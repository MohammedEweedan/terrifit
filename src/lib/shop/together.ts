import { prisma } from "@/lib/db";
import type { Product } from "./catalog";
import { listProducts, recommendationsFrom } from "./catalog-store";

/**
 * "Usually bought together", from what people actually bought together.
 *
 * Counts how often each product appears in the same order as the things
 * already in the bag, which is a real co-occurrence measure rather than a
 * merchandiser's guess. Early on there are not enough orders for that to mean
 * anything, so it falls back to the hand-written rules — and says which of the
 * two it used, because a recommendation that claims evidence it does not have
 * is how people stop trusting the shop.
 */
const MIN_ORDERS = 12;

export type Together = {
  products: Product[];
  /** orders = learned from real baskets. curated = the fallback rules. */
  basis: "orders" | "curated";
  /** How many past orders the counts came from. Zero when curated. */
  sampleSize: number;
};

export async function boughtTogether(slugsInBag: string[], limit = 3): Promise<Together> {
  const inBag = new Set(slugsInBag);
  const products = await listProducts();

  if (slugsInBag.length === 0) {
    return { products: recommendationsFrom(products, [], limit), basis: "curated", sampleSize: 0 };
  }

  // Orders that contained at least one thing currently in the bag.
  const orders = await prisma.order.findMany({
    where: {
      paymentStatus: { not: "failed" },
      items: { some: { slug: { in: slugsInBag } } },
    },
    select: { id: true, items: { select: { slug: true } } },
    take: 500,
  });

  if (orders.length < MIN_ORDERS) {
    return { products: recommendationsFrom(products, slugsInBag, limit), basis: "curated", sampleSize: orders.length };
  }

  const counts = new Map<string, number>();
  for (const order of orders) {
    // A slug appearing twice in one order is still one basket, so dedupe first.
    for (const slug of new Set(order.items.map((item) => item.slug))) {
      if (inBag.has(slug)) continue;
      counts.set(slug, (counts.get(slug) ?? 0) + 1);
    }
  }

  const ranked = [...counts.entries()]
    .sort(([, a], [, b]) => b - a)
    .map(([slug]) => products.find((product) => product.slug === slug))
    .filter((product): product is Product => Boolean(product));

  // Top up from the curated list if the data is thin on variety.
  for (const product of recommendationsFrom(products, slugsInBag, limit * 2)) {
    if (ranked.length >= limit) break;
    if (ranked.some((item) => item.slug === product.slug)) continue;
    ranked.push(product);
  }

  // And from the catalogue if even that ran out.
  for (const product of products) {
    if (ranked.length >= limit) break;
    if (inBag.has(product.slug) || ranked.some((item) => item.slug === product.slug)) continue;
    ranked.push(product);
  }

  return { products: ranked.slice(0, limit), basis: "orders", sampleSize: orders.length };
}
