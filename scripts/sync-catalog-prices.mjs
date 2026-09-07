/**
 * Reconciles the database with the catalogue in the code: prices, and any
 * variants that were added after a product was first seeded.
 *
 * `ensureCatalogSeeded()` only ever *inserts* products that are missing — it
 * never updates one that already exists, deliberately, so a price set in the
 * admin panel is not silently reverted on the next boot. The consequence is
 * that editing `catalog.ts` changes the price for new databases only. This is
 * the explicit way to push a catalogue price onto a database that already has
 * the row.
 *
 *   node scripts/sync-catalog-prices.mjs             # show the differences
 *   node scripts/sync-catalog-prices.mjs --apply     # write them
 *   node scripts/sync-catalog-prices.mjs --apply --only terrifit-v1
 *
 * Dry by default because this overwrites prices a human may have set on purpose.
 */
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "pg";

const root = fileURLToPath(new URL("..", import.meta.url));
try {
  process.loadEnvFile(join(root, ".env"));
} catch {
  // CI and production supply the environment directly.
}

const apply = process.argv.includes("--apply");
const onlyIndex = process.argv.indexOf("--only");
const only = onlyIndex > -1 ? process.argv[onlyIndex + 1] : null;

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

// Read the catalogue through the same TypeScript module the app uses, so this
// can never drift from what the site would seed.
const { products } = await import("../src/lib/shop/catalog.ts");

const client = new Client({ connectionString: url });
await client.connect();

let changed = 0;
let addedVariants = 0;
let updatedVariants = 0;
try {
  for (const product of products) {
    if (only && product.slug !== only) continue;
    const { rows } = await client.query(
      `select slug, "priceCents", "compareAtCents" from "ShopProduct" where slug = $1`,
      [product.slug],
    );
    const row = rows[0];
    if (!row) continue; // absent rows are the seeder's job, not this script's

    const compare = product.compareAtCents ?? null;
    if (row.priceCents === product.priceCents && row.compareAtCents === compare) continue;

    changed += 1;
    console.log(
      `  ${product.slug.padEnd(28)} ${row.priceCents} -> ${product.priceCents}` +
        (row.compareAtCents !== compare ? `   compareAt ${row.compareAtCents} -> ${compare}` : ""),
    );
    if (apply) {
      await client.query(
        `update "ShopProduct" set "priceCents" = $2, "compareAtCents" = $3, "updatedAt" = now() where slug = $1`,
        [product.slug, product.priceCents, compare],
      );
    }
  }

  // Variants added to the catalogue after a product was seeded are never
  // inserted by `ensureCatalogSeeded`, which only creates whole products that
  // are missing. That is why the Band shipped five colourways on a page whose
  // catalogue listed seven.
  for (const product of products) {
    if (only && product.slug !== only) continue;
    if (!product.variants?.length) continue;

    const { rows: found } = await client.query(
      `select p.id, v.key from "ShopProduct" p left join "ShopVariant" v on v."productId" = p.id where p.slug = $1`,
      [product.slug],
    );
    if (!found.length) continue;
    const productId = found[0].id;
    const have = new Set(found.map((row) => row.key).filter(Boolean));

    // Existing variants keep whatever image they were seeded with, so a
    // renamed or re-shot render never reaches them: the Band's colourways were
    // still pointing at /media/terrifit-band-grey.png, a file that does not
    // exist, long after the catalogue moved to colourways-v2.
    for (const variant of product.variants) {
      if (!have.has(variant.id)) continue;
      const { rows: cur } = await client.query(
        `select v.image, v.label, v.accent from "ShopVariant" v where v."productId" = $1 and v.key = $2`,
        [productId, variant.id],
      );
      const row = cur[0];
      if (!row) continue;
      const wanted = [variant.image ?? null, variant.label, variant.accent ?? null];
      if (row.image === wanted[0] && row.label === wanted[1] && row.accent === wanted[2]) continue;
      updatedVariants += 1;
      console.log(`  ${product.slug.padEnd(28)} ~ ${variant.label}: ${row.image} -> ${variant.image}`);
      if (apply) {
        await client.query(
          `update "ShopVariant" set image = $3, label = $4, accent = $5, note = $6, "updatedAt" = now()
             where "productId" = $1 and key = $2`,
          [productId, variant.id, variant.image ?? null, variant.label, variant.accent ?? null, variant.note ?? null],
        );
      }
    }

    for (const [index, variant] of product.variants.entries()) {
      if (have.has(variant.id)) continue;
      addedVariants += 1;
      console.log(`  ${product.slug.padEnd(28)} + variant ${variant.label} (${variant.id})`);
      if (!apply) continue;
      await client.query(
        `insert into "ShopVariant"
           (id, "productId", key, label, note, sku, image, accent, active, "sortOrder", "stockQuantity", "allowBackorder", "updatedAt")
         values (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, true, $8, 0, true, now())`,
        [productId, variant.id, variant.label, variant.note ?? null, variant.sku,
         variant.image ?? null, variant.accent ?? null, index],
      );
    }
  }
} finally {
  await client.end();
}

const summary = [
  changed === 0 ? "prices already match" : `${changed} price(s) differ`,
  addedVariants === 0 ? "no missing variants" : `${addedVariants} variant(s) missing`,
  updatedVariants === 0 ? "variant art matches" : `${updatedVariants} variant image(s) stale`,
].join(", ");
console.log(apply ? `Applied: ${summary}.` : `${summary}. Re-run with --apply to write them.`);
