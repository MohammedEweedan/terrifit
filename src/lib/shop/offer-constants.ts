/**
 * The launch numbers, with no dependencies.
 *
 * `preorder.ts` and `launch-offer.ts` both reach for Prisma, which makes them
 * unimportable from a plain Node script — and the ad-script generator needs
 * these figures so marketing copy cannot drift from what the product page says.
 * Keeping the constants in a module that imports nothing lets both sides read
 * from one source.
 *
 * Both modules re-export from here, so every existing import keeps working.
 */

/** Units reserved before the manufacturing order is placed. */
export const MANUFACTURING_TRIGGER = 500;

/** How many orders earn founding-hundred kit. */
export const FOUNDING_ORDERS = 100;

/** Terrifuel spend, in cents, that earns the Terrifits tee. */
export const FUEL_GIFT_THRESHOLD_CENTS = 15_000;
