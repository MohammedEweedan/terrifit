/**
 * Launch markets, as ISO 3166-1 alpha-2 codes. Names are never hardcoded —
 * they are resolved through Intl.DisplayNames in the active locale, so the
 * Arabic build shows Arabic country names without a translation table.
 */
export const MARKET_CODES = [
  "AE", "SA", "QA", "KW", "BH", "OM", "JO", "EG", "MA", "TN", "DZ", "LB", "IQ", "TR",
  "GB", "IE", "DE", "FR", "ES", "IT", "NL", "BE", "SE", "NO", "DK", "FI", "PL", "PT", "CH", "AT",
  "US", "CA", "MX", "BR", "AR", "CL", "CO",
  "AU", "NZ", "ZA", "NG", "KE",
  "IN", "PK", "ID", "MY", "SG", "PH", "TH", "VN", "JP", "KR",
] as const;

export type MarketCode = (typeof MARKET_CODES)[number];

/** Markets shown at the top of the select before the alphabetical remainder. */
export const PRIORITY_MARKETS: readonly MarketCode[] = ["AE", "SA", "GB", "US", "QA", "KW"];

export type MarketOption = { code: string; name: string };

export function getMarkets(locale: string): {
  priority: MarketOption[];
  rest: MarketOption[];
} {
  const display = new Intl.DisplayNames([locale], { type: "region", fallback: "code" });
  const collator = new Intl.Collator(locale);

  const named = MARKET_CODES.map((code) => ({
    code,
    name: display.of(code) ?? code,
  }));

  const priority = PRIORITY_MARKETS.map(
    (code) => named.find((market) => market.code === code)!,
  );
  const rest = named
    .filter((market) => !PRIORITY_MARKETS.includes(market.code as MarketCode))
    .sort((a, b) => collator.compare(a.name, b.name));

  return { priority, rest };
}

export function isKnownMarket(code: string): boolean {
  return (MARKET_CODES as readonly string[]).includes(code.toUpperCase());
}
