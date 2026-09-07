import { catalogMedia } from "./product-media";
import { launchStatus, HARDWARE_NOTICE } from "./launch";
import { prisma } from "@/lib/db";
import {
  products as seedProducts,
  swatchColours,
  swatchFromColours,
  type Product,
  type Variant,
} from "./catalog";

const json = <T>(value: string, fallback: T): T => {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};

function seedStock(status: Product["stock"]): { quantity: number; threshold: number; backorder: boolean } {
  if (status === "preorder") return { quantity: 0, threshold: 5, backorder: true };
  if (status === "out") return { quantity: 0, threshold: 5, backorder: false };
  if (status === "low") return { quantity: 4, threshold: 5, backorder: false };
  return { quantity: 100, threshold: 10, backorder: false };
}

/**
 * One-time migration of the launch catalogue into editable rows.
 *
 * The arrays in `catalog.ts` are seed data only. After the first successful
 * call every storefront and checkout read comes from Prisma, so an admin edit
 * is live immediately and does not require an app-store release.
 */
let seedPromise: Promise<void> | null = null;

export function ensureCatalogSeeded(): Promise<void> {
  seedPromise ??= seedMissingProducts().catch((error) => {
    seedPromise = null;
    throw error;
  });
  return seedPromise;
}

async function seedMissingProducts(): Promise<void> {
  const seedSlugs = seedProducts.map((product) => product.slug);
  const existing = new Set((await prisma.shopProduct.findMany({
    where: { slug: { in: seedSlugs } },
    select: { slug: true },
  })).map((product) => product.slug));
  if (seedProducts.every((product) => existing.has(product.slug))) return;

  for (const [productIndex, product] of seedProducts.entries()) {
    if (existing.has(product.slug)) continue;
    const baseStock = seedStock(product.stock);
    await prisma.shopProduct.create({
      data: {
        slug: product.slug,
        name: product.name,
        tagline: product.tagline,
        category: product.category,
        brand: product.category === "fuel" ? "TERRIFUEL" : product.brand,
        partner: product.partner,
        description: product.description,
        priceCents: product.priceCents,
        compareAtCents: product.compareAtCents,
        rating: product.rating,
        reviewCount: product.reviews,
        badges: JSON.stringify(product.badges),
        variantLabel: product.variantLabel,
        highlights: JSON.stringify(product.highlights),
        specs: JSON.stringify(product.specs),
        shipsIn: product.shipsIn,
        fulfilment: product.fulfilment,
        subscriptionLabel: product.subscription?.label,
        subscriptionDiscountPercent: product.subscription?.discountPercent,
        active: product.active ?? true,
        featured: productIndex < 4,
        sortOrder: productIndex,
        trackInventory: product.fulfilment === "ship",
        stockQuantity: product.variants.length === 0 ? baseStock.quantity : 0,
        lowStockThreshold: baseStock.threshold,
        allowBackorder: baseStock.backorder,
        variants: {
          create: product.variants.map((variant, variantIndex) => ({
            key: variant.id,
            label: variant.label,
            note: variant.note,
            sku: variant.sku,
            priceCents: variant.priceCents,
            image: variant.image,
            colours: JSON.stringify(swatchColours(variant.swatch)),
            accent: variant.accent,
            active: true,
            sortOrder: variantIndex,
            stockQuantity: baseStock.quantity,
            lowStockThreshold: baseStock.threshold,
            allowBackorder: baseStock.backorder,
          })),
        },
        media: {
          create: product.media.map((item, mediaIndex) => ({ ...item, sortOrder: mediaIndex })),
        },
      },
    });
  }
}

type Row = Awaited<ReturnType<typeof rows>>[number];

async function rows(includeInactive: boolean) {
  await ensureCatalogSeeded();
  return prisma.shopProduct.findMany({
    where: includeInactive ? undefined : { active: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    include: {
      variants: {
        where: includeInactive ? undefined : { active: true },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      },
      media: { orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] },
    },
  });
}

function toProduct(row: Row): Product {
  const variants: Variant[] = row.variants.map((variant) => {
    const colours = json<string[]>(variant.colours, []);
    return {
      id: variant.key,
      label: variant.label,
      note: variant.note ?? undefined,
      sku: variant.sku,
      priceCents: variant.priceCents ?? undefined,
      image: variant.image ?? undefined,
      colours,
      swatch: swatchFromColours(colours),
      accent: variant.accent ?? undefined,
      stockQuantity: variant.stockQuantity,
      lowStockThreshold: variant.lowStockThreshold,
      allowBackorder: variant.allowBackorder,
      active: variant.active,
    };
  });
  const quantity = variants.length > 0
    ? variants.reduce((total, variant) => total + (variant.stockQuantity ?? 0), 0)
    : row.stockQuantity;
  const threshold = variants.length > 0
    ? variants.reduce((total, variant) => total + (variant.lowStockThreshold ?? 0), 0)
    : row.lowStockThreshold;
  const allowBackorder = variants.length > 0 ? variants.some((variant) => variant.allowBackorder) : row.allowBackorder;
  const stock: Product["stock"] = quantity <= 0 ? (allowBackorder ? "preorder" : "out") : quantity <= threshold ? "low" : "in";

  return {
    launchStatus: launchStatus(row.slug, row.category, process.env.HARDWARE_PREORDERS_OPEN === "true"),
    slug: row.slug,
    name: row.name,
    tagline: row.tagline,
    category: row.category as Product["category"],
    brand: row.brand,
    partner: row.partner,
    priceCents: row.priceCents,
    compareAtCents: row.compareAtCents ?? undefined,
    rating: row.rating,
    reviews: row.reviewCount,
    badges: json<string[]>(row.badges, []),
    variantLabel: row.variantLabel ?? undefined,
    variants,
    description: row.description,
    highlights: json<string[]>(row.highlights, []),
    specs: json<Array<[string, string]>>(row.specs, []),
    media: catalogMedia(row.slug, row.media.map((item) => ({ src: item.src, alt: item.alt, ratio: item.ratio ?? undefined }))),
    stock,
    shipsIn: launchStatus(row.slug, row.category, process.env.HARDWARE_PREORDERS_OPEN === "true") === "upcoming" ? HARDWARE_NOTICE : row.shipsIn,
    fulfilment: row.fulfilment as Product["fulfilment"],
    subscription: row.subscriptionLabel
      ? { label: row.subscriptionLabel, discountPercent: row.subscriptionDiscountPercent ?? 0 }
      : undefined,
    stockQuantity: quantity,
    lowStockThreshold: threshold,
    trackInventory: row.trackInventory,
    allowBackorder,
    active: row.active,
    featured: row.featured,
    sortOrder: row.sortOrder,
  };
}

export async function listProducts(options: { includeInactive?: boolean } = {}): Promise<Product[]> {
  return (await rows(options.includeInactive === true)).map(toProduct);
}

/**
 * The catalogue, falling back to the code-defined seed when the database is
 * unreachable.
 *
 * `products` in `catalog.ts` is what `ensureCatalogSeeded()` writes into the
 * database in the first place, so this is not a degraded answer — it is the
 * same catalogue, minus any edits an admin has made since. The database copy
 * exists so the shop can be edited without a deploy, not because the code
 * copy is incomplete.
 *
 * This exists because the root layout needs a catalogue on *every* page in
 * order to price the cart, which made all 444 prerendered pages — including
 * `/en/about` and the password-reset screens — require a live database at
 * build time. A build that cannot reach Postgres should still produce a
 * working site; a cart that silently prices nothing should not be the
 * alternative.
 */
export async function listProductsOrSeed(): Promise<Product[]> {
  try {
    return await listProducts();
  } catch {
    return seedProducts;
  }
}

export async function getProduct(slug: string, options: { includeInactive?: boolean } = {}): Promise<Product | undefined> {
  return (await listProducts(options)).find((product) => product.slug === slug);
}

export async function getV1Colourways(options: { includeInactive?: boolean } = {}): Promise<Variant[]> {
  return (await getProduct("terrifit-v1", options))?.variants ?? [];
}

/** Pure recommendation rules over a live catalogue. */
export function recommendationsFrom(products: Product[], slugsInBag: string[], limit = 3): Product[] {
  const inBag = new Set(slugsInBag);
  const preferred = inBag.has("terrifit-v1")
    ? ["v1-strap-set", "v1-charger", "terrifit-membership", "recovery-protein", "night-magnesium"]
    : ["terrifit-v1", "recovery-protein", "pure-creatine", "daily-hydration"];
  const picked = preferred
    .filter((slug) => !inBag.has(slug))
    .map((slug) => products.find((product) => product.slug === slug))
    .filter((product): product is Product => Boolean(product));
  for (const product of products) {
    if (picked.length >= limit) break;
    if (inBag.has(product.slug) || picked.some((item) => item.slug === product.slug)) continue;
    picked.push(product);
  }
  return picked.slice(0, limit);
}

export async function inventoryProblems(items: Array<{ slug: string; variantId?: string; quantity: number }>): Promise<string[]> {
  const products = await listProducts();
  const problems: string[] = [];
  for (const item of items) {
    const product = products.find((candidate) => candidate.slug === item.slug);
    if (!product || (product.launchStatus && product.launchStatus !== "available")) {
      problems.push(item.slug);
      continue;
    }
    if (product.fulfilment !== "ship" || product.trackInventory === false) continue;
    const variant = product.variants.find((candidate) => candidate.id === item.variantId) ?? product.variants[0];
    const available = variant ? variant.stockQuantity ?? 0 : product.stockQuantity ?? 0;
    const backorder = variant ? variant.allowBackorder === true : product.allowBackorder === true;
    if (!backorder && item.quantity > available) problems.push(item.variantId ? `${item.slug}:${item.variantId}` : item.slug);
  }
  return problems;
}

/** Decrement stock once, only after a verified payment event. */
export async function commitOrderInventory(orderId: string): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const claimed = await tx.order.updateMany({
      where: { id: orderId, inventoryCommittedAt: null },
      data: { inventoryCommittedAt: new Date() },
    });
    if (claimed.count === 0) return;
    const order = await tx.order.findUnique({ where: { id: orderId }, select: { items: true } });
    if (!order) return;
    for (const item of order.items) {
      const product = await tx.shopProduct.findUnique({ where: { slug: item.slug }, include: { variants: true } });
      if (!product || !product.trackInventory || product.fulfilment !== "ship") continue;
      const variant = product.variants.find((candidate) => candidate.key === item.variantId);
      if (variant) {
        await tx.shopVariant.update({ where: { id: variant.id }, data: { stockQuantity: { decrement: Math.min(item.quantity, variant.stockQuantity) } } });
      } else {
        await tx.shopProduct.update({ where: { id: product.id }, data: { stockQuantity: { decrement: Math.min(item.quantity, product.stockQuantity) } } });
      }
    }
  });
}
