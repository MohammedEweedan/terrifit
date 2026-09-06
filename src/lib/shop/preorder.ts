import { prisma } from "../db";
import { MANUFACTURING_TRIGGER } from "./offer-constants";

/**
 * The V1 pre-order: how many are reserved, and what that obliges us to.
 *
 * A pre-order is not a sale. It is a deposit against a manufacturing run that
 * has not been placed yet, and the entire ethics of it live in three rules that
 * are encoded here rather than left to the copy:
 *
 *  1. **The money is a liability until the unit ships.** Nothing in this module
 *     treats a pre-order as revenue. `reserved` counts units, never currency.
 *  2. **The run is triggered by a number, not a date.** Publishing "ships in
 *     March" for a run that has not been ordered is how consumer hardware
 *     projects end up in the press. Publishing "we order at 500" is honest and,
 *     in practice, more persuasive — it turns a purchase into a vote.
 *  3. **A refund is available until it ships, without a reason.** Encoded as
 *     `refundableUntilShipped` so the policy page and the product page cannot
 *     drift apart.
 *
 * Every figure here is a count from the order table. There is deliberately no
 * way to seed, pad or override it: the last thing this page carried was a
 * hard-coded "24,891 members" and the fix is not a better hard-coded number.
 */

// Re-exported so every existing import keeps working; the value lives in a
// dependency-free module so scripts can read it without booting Prisma.
export { MANUFACTURING_TRIGGER } from "./offer-constants";

/** Slugs that count toward the run. The bundle contains a band. */
const V1_SLUGS = ["terrifit-v1", "v1-starter-bundle"] as const;

export type PreorderState = {
  /** Units reserved. A count of order lines, never a sum of money. */
  reserved: number;
  /** How many more before the run is placed. Zero once it is triggered. */
  remaining: number;
  /** 0–1, for a progress meter. Clamped, so an over-subscribed run reads full. */
  progress: number;
  /** True once enough units are reserved to place the manufacturing order. */
  triggered: boolean;
  trigger: number;
  /** Always true before shipping. Stated here so the policy has one home. */
  refundableUntilShipped: true;
};

const EMPTY: PreorderState = {
  reserved: 0,
  remaining: MANUFACTURING_TRIGGER,
  progress: 0,
  triggered: false,
  trigger: MANUFACTURING_TRIGGER,
  refundableUntilShipped: true,
};

/**
 * How many V1s are actually spoken for.
 *
 * Counts quantity across order items, not orders — somebody buying three bands
 * has reserved three units of the run, and the manufacturing trigger is about
 * units.
 *
 * Only settled, non-sandbox payments count. An abandoned checkout, cancelled
 * order or refunded payment cannot validate demand or trigger manufacturing.
 */
export async function preorderState(): Promise<PreorderState> {
  let reserved = 0;
  try {
    const rows = await prisma.orderItem.findMany({
      where: {
        slug: { in: [...V1_SLUGS] },
        order: { paymentStatus: "paid", sandbox: false, fulfillmentStatus: { not: "cancelled" } },
      },
      select: { quantity: true },
    });
    reserved = rows.reduce((total, row) => total + row.quantity, 0);
  } catch {
    // A storefront that cannot count is a storefront that does not promise.
    return EMPTY;
  }

  return {
    reserved,
    remaining: Math.max(0, MANUFACTURING_TRIGGER - reserved),
    progress: Math.min(1, reserved / MANUFACTURING_TRIGGER),
    triggered: reserved >= MANUFACTURING_TRIGGER,
    trigger: MANUFACTURING_TRIGGER,
    refundableUntilShipped: true,
  };
}
