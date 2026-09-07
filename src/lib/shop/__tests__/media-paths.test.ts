import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { products } from "../catalog";
import { catalogMedia } from "../product-media";

/**
 * Every image the shop renders must exist on disk.
 *
 * `/media/band/colourways-v2/grey.png` was referenced by the strap set and by
 * the legacy rewrite table, and had never existed — the only symptom was a 404
 * in the browser on a live product page. Nothing in the type system or the
 * build catches a string that happens to be a path.
 *
 * Checked *after* `catalogMedia`, because the rewrite table deliberately keys
 * on paths that do not exist; only the resolved output is ever requested.
 */
describe("catalogue media", () => {
  it("resolves every product image to a file that exists", () => {
    const broken: string[] = [];
    for (const product of products) {
      for (const item of catalogMedia(product.slug, product.media)) {
        if (!existsSync(`public${item.src}`)) broken.push(`${product.slug}: ${item.src}`);
      }
    }
    expect(broken).toEqual([]);
  });

  it("resolves every variant image to a file that exists", () => {
    const broken: string[] = [];
    for (const product of products) {
      for (const variant of product.variants ?? []) {
        if (variant.image && !existsSync(`public${variant.image}`)) {
          broken.push(`${product.slug}/${variant.id}: ${variant.image}`);
        }
      }
    }
    expect(broken).toEqual([]);
  });

  it("gives every product at least one image", () => {
    // A product card with no media renders an empty tile, which reads as a
    // broken page rather than as a product without a photograph.
    for (const product of products) {
      expect(catalogMedia(product.slug, product.media).length, product.slug).toBeGreaterThan(0);
    }
  });
});
