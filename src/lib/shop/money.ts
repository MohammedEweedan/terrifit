import type { Locale } from "@/i18n/config";
import { localeMeta } from "@/i18n/config";

/**
 * Every price in the catalogue is an integer of minor units. Floats are never
 * used for money: 0.1 + 0.2 is a rounding bug waiting for a checkout total.
 */
export const CURRENCY = "USD";

export function formatMoney(cents: number, locale: Locale, currency = CURRENCY): string {
  return new Intl.NumberFormat(localeMeta[locale].htmlLang, {
    style: "currency",
    currency,
    // Whole-dollar catalogue prices read better without ".00"; anything with a
    // fractional part (tax, shipping, discounts) still shows both digits.
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

/** Percentage off, rounded to a whole number for badge copy. */
export function discountPercent(priceCents: number, compareAtCents?: number): number {
  if (!compareAtCents || compareAtCents <= priceCents) return 0;
  return Math.round(((compareAtCents - priceCents) / compareAtCents) * 100);
}
