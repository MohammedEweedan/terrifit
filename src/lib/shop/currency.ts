import type { Locale } from "@/i18n/config";

/**
 * Currencies Terrifit sells in.
 *
 * Prices are **fixed points per currency, not a live conversion.** A shop that
 * converts on the fly shows £4.99 today and £5.03 tomorrow, which looks broken
 * and makes every price a moving target for support. Apple, Spotify and every
 * other subscription business set deliberate price points per market and revisit
 * them occasionally; so does this.
 *
 * The `rate` below is therefore an *anchor* for deriving a sensible starting
 * price from the USD catalogue, not an FX rate. It is applied once and then
 * rounded to a charm price. Review it when a currency has drifted far enough to
 * matter — that is a pricing decision, not a cron job.
 */
export type Currency = {
  code: string;
  symbol: string;
  /**
   * Decimal places the currency actually has. Yen and Won have none, and
   * sending Stripe 100× too much for them is the classic way to charge
   * somebody ¥100,000 for a ¥1,000 order.
   */
  decimals: 0 | 2;
  /** Rough value of one USD. An anchor for deriving prices, not live FX. */
  rate: number;
  /** How to round a derived price so it reads like a price somebody set. */
  rounding: "charm" | "whole" | "hundred";
};

export const CURRENCIES: Currency[] = [
  { code: "USD", symbol: "$", decimals: 2, rate: 1, rounding: "charm" },
  { code: "GBP", symbol: "£", decimals: 2, rate: 0.79, rounding: "charm" },
  { code: "EUR", symbol: "€", decimals: 2, rate: 0.92, rounding: "charm" },
  { code: "CAD", symbol: "CA$", decimals: 2, rate: 1.36, rounding: "charm" },
  { code: "AUD", symbol: "A$", decimals: 2, rate: 1.52, rounding: "charm" },
  { code: "CHF", symbol: "CHF", decimals: 2, rate: 0.88, rounding: "charm" },
  { code: "SEK", symbol: "kr", decimals: 2, rate: 10.5, rounding: "whole" },
  { code: "NOK", symbol: "kr", decimals: 2, rate: 10.8, rounding: "whole" },
  { code: "DKK", symbol: "kr", decimals: 2, rate: 6.9, rounding: "whole" },
  { code: "PLN", symbol: "zł", decimals: 2, rate: 4.0, rounding: "whole" },
  { code: "JPY", symbol: "¥", decimals: 0, rate: 150, rounding: "hundred" },
  { code: "SGD", symbol: "S$", decimals: 2, rate: 1.34, rounding: "charm" },
  { code: "HKD", symbol: "HK$", decimals: 2, rate: 7.8, rounding: "whole" },
  { code: "NZD", symbol: "NZ$", decimals: 2, rate: 1.64, rounding: "charm" },
  { code: "AED", symbol: "AED", decimals: 2, rate: 3.67, rounding: "whole" },
  { code: "SAR", symbol: "SAR", decimals: 2, rate: 3.75, rounding: "whole" },
  { code: "TRY", symbol: "₺", decimals: 2, rate: 34, rounding: "whole" },
  { code: "BRL", symbol: "R$", decimals: 2, rate: 5.4, rounding: "charm" },
  { code: "MXN", symbol: "MX$", decimals: 2, rate: 17, rounding: "whole" },
  { code: "INR", symbol: "₹", decimals: 2, rate: 84, rounding: "hundred" },
  { code: "ZAR", symbol: "R", decimals: 2, rate: 18, rounding: "whole" },
];

export const BASE_CURRENCY = "USD";

export function findCurrency(code: string): Currency | undefined {
  return CURRENCIES.find((currency) => currency.code === code.toUpperCase());
}

/** Which currency a market defaults to. Overridable by the member. */
const BY_LOCALE: Record<Locale, string> = {
  en: "USD",
  es: "EUR",
  fr: "EUR",
  de: "EUR",
  it: "EUR",
  nl: "EUR",
  pt: "EUR",
  tr: "TRY",
  ar: "AED",
  ru: "USD",
};

export function currencyForLocale(locale: Locale): Currency {
  return findCurrency(BY_LOCALE[locale] ?? BASE_CURRENCY) ?? CURRENCIES[0];
}

/**
 * The catalogue's USD price, expressed in another currency.
 *
 * Returns **minor units in that currency's own scale** — 2 decimals for most,
 * 0 for yen — which is exactly what Stripe's `amount` expects. Getting this
 * wrong for a zero-decimal currency overcharges by 100×, so it is the one part
 * of this file with its own tests.
 */
export function priceIn(baseCents: number, currency: Currency): number {
  if (currency.code === BASE_CURRENCY) return baseCents;

  // Convert in whole units first; the rounding rules all think in whole units.
  const units = (baseCents / 100) * currency.rate;
  const rounded = roundPrice(units, currency.rounding);

  return currency.decimals === 0 ? Math.round(rounded) : Math.round(rounded * 100);
}

function roundPrice(units: number, rule: Currency["rounding"]): number {
  switch (rule) {
    case "charm":
      // Up to the next .99 — 181.4 becomes 181.99, 4.1 becomes 4.99.
      return Math.max(0.99, Math.floor(units) + 0.99);
    case "whole":
      // Up to the next 10, so 2409 reads as 2410 rather than 2409.
      return Math.max(10, Math.ceil(units / 10) * 10);
    case "hundred":
      // Yen and rupees are quoted in round hundreds.
      return Math.max(100, Math.ceil(units / 100) * 100);
  }
}

/**
 * Formats an amount already expressed in that currency's minor units.
 *
 * `Intl` knows each currency's real decimal count, so passing it a yen amount
 * divided by 100 would render ¥10 as ¥0.10. The scale is taken from the
 * currency, never assumed to be 100.
 */
export function formatIn(amount: number, currency: Currency, htmlLang: string): string {
  const scale = currency.decimals === 0 ? 1 : 100;
  const value = amount / scale;

  return new Intl.NumberFormat(htmlLang, {
    style: "currency",
    currency: currency.code,
    // Whole prices read better without trailing zeros; anything with a
    // fractional part (tax, shipping) still shows them.
    minimumFractionDigits: currency.decimals === 0 ? 0 : value % 1 === 0 ? 0 : 2,
    maximumFractionDigits: currency.decimals,
  }).format(value);
}
