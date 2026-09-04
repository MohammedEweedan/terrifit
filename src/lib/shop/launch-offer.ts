import type { PricedLine } from "./orders";
import { prisma } from "../db";

/**
 * The founding-hundred launch offer.
 *
 * The first hundred orders earn kit rather than a discount, because a discount
 * trains people to wait for the next one and a Terrifits hoodie on somebody's
 * back is the cheapest advertising this brand will ever buy.
 *
 *   · Terrifuel over $150            → a Terrifits tee
 *   · any Terrifit V1                → a Terrifits hoodie
 *   · both of the above              → both
 *
 * Gifts are added server-side as zero-priced order lines. They are never in the
 * cart the browser sends, so nothing here can be forged by editing a request —
 * the same rule that already governs prices.
 */

/** How many orders qualify, counted across the whole store for all time. */
export const FOUNDING_ORDERS = 100;

/** Terrifuel spend, in cents, that earns the tee. */
export const FUEL_GIFT_THRESHOLD_CENTS = 15_000;

export const GIFT_TEE_SLUG = "terrifits-field-tee";
export const GIFT_HOODIE_SLUG = "terrifits-hoodie";

/** Categories that count as Terrifuel for the threshold. */
const FUEL_CATEGORIES = new Set(["fuel", "recovery"]);

export type LaunchGift = {
  slug: string;
  title: string;
  /** Why it was earned, shown on the receipt so it never looks like an error. */
  reason: string;
};

export type LaunchOfferState = {
  /** Orders placed so far. */
  claimed: number;
  remaining: number;
  /** False once the hundred are gone; the offer then stops applying. */
  open: boolean;
};

/**
 * How many places are left.
 *
 * Counting every order rather than only paid ones is deliberate for now: the
 * payment webhook is not built, so no order ever reaches a paid state on its
 * own and counting paid orders would leave the offer open forever. Revisit
 * when webhooks land.
 */
export async function launchOfferState(): Promise<LaunchOfferState> {
  let claimed = 0;
  try {
    claimed = await prisma.order.count();
  } catch {
    // A storefront that cannot count is a storefront that does not promise.
    return { claimed: 0, remaining: 0, open: false };
  }
  const remaining = Math.max(0, FOUNDING_ORDERS - claimed);
  return { claimed, remaining, open: remaining > 0 };
}

/** Terrifuel spend in a priced bag, in the bag's own currency. */
export function fuelSpendCents(lines: PricedLine[]): number {
  return lines
    .filter((line) => FUEL_CATEGORIES.has(line.product.category))
    .reduce((total, line) => total + line.unitCents * line.quantity, 0);
}

export function hasBand(lines: PricedLine[]): boolean {
  // The band itself, not a strap or a charger — those are `accessories`.
  return lines.some((line) => line.product.category === "band" && line.product.fulfilment === "ship");
}

/**
 * What this bag earns, given the offer is still open.
 *
 * `thresholdCents` is passed in rather than read from the constant so a
 * non-USD bag can be measured against the same price point converted into its
 * own currency — $150 of protein is $150 of protein in every market.
 */
export function giftsFor(
  lines: PricedLine[],
  { open, thresholdCents = FUEL_GIFT_THRESHOLD_CENTS }: { open: boolean; thresholdCents?: number },
): LaunchGift[] {
  if (!open) return [];

  const gifts: LaunchGift[] = [];

  if (fuelSpendCents(lines) >= thresholdCents) {
    gifts.push({
      slug: GIFT_TEE_SLUG,
      title: "Terrifits Field Tee",
      reason: "Founding hundred — Terrifuel order over $150",
    });
  }

  if (hasBand(lines)) {
    gifts.push({
      slug: GIFT_HOODIE_SLUG,
      title: "Terrifits Hoodie",
      reason: "Founding hundred — Terrifit V1",
    });
  }

  return gifts;
}

/**
 * The offer as a sentence, for the bag and the checkout summary.
 *
 * Returns what this bag has already earned and what one more step would earn,
 * because "spend $12 more for a free tee" is the line that moves an order and
 * "you have earned a tee" is the line that makes somebody finish it.
 */
export function offerProgress(
  lines: PricedLine[],
  { open, thresholdCents = FUEL_GIFT_THRESHOLD_CENTS }: { open: boolean; thresholdCents?: number },
): { earned: LaunchGift[]; shortfallCents: number | null; bandWouldEarnHoodie: boolean } {
  const earned = giftsFor(lines, { open, thresholdCents });
  const spend = fuelSpendCents(lines);
  return {
    earned,
    // Only worth showing when there is fuel in the bag already; nagging an
    // empty bag toward a threshold is not persuasion.
    shortfallCents: open && spend > 0 && spend < thresholdCents ? thresholdCents - spend : null,
    bandWouldEarnHoodie: open && !hasBand(lines),
  };
}
