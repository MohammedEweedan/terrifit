/**
 * The native copy of the website's supported presentment currencies.
 *
 * Product prices still come from the server. This table only drives the
 * country/currency pickers and formats amounts the server has already quoted.
 * Keeping decimals here is essential: JPY is a zero-decimal currency.
 */
export type AppCurrency = {
  code: string;
  symbol: string;
  decimals: 0 | 2;
};

export const APP_CURRENCIES: readonly AppCurrency[] = [
  { code: "USD", symbol: "$", decimals: 2 },
  { code: "GBP", symbol: "£", decimals: 2 },
  { code: "EUR", symbol: "€", decimals: 2 },
  { code: "CAD", symbol: "CA$", decimals: 2 },
  { code: "AUD", symbol: "A$", decimals: 2 },
  { code: "CHF", symbol: "CHF", decimals: 2 },
  { code: "SEK", symbol: "kr", decimals: 2 },
  { code: "NOK", symbol: "kr", decimals: 2 },
  { code: "DKK", symbol: "kr", decimals: 2 },
  { code: "PLN", symbol: "zł", decimals: 2 },
  { code: "JPY", symbol: "¥", decimals: 0 },
  { code: "SGD", symbol: "S$", decimals: 2 },
  { code: "HKD", symbol: "HK$", decimals: 2 },
  { code: "NZD", symbol: "NZ$", decimals: 2 },
  { code: "AED", symbol: "AED", decimals: 2 },
  { code: "SAR", symbol: "SAR", decimals: 2 },
  { code: "TRY", symbol: "₺", decimals: 2 },
  { code: "BRL", symbol: "R$", decimals: 2 },
  { code: "MXN", symbol: "MX$", decimals: 2 },
  { code: "INR", symbol: "₹", decimals: 2 },
  { code: "ZAR", symbol: "R", decimals: 2 },
] as const;

export const MARKET_CODES = [
  "AE", "SA", "QA", "KW", "BH", "OM", "JO", "EG", "MA", "TN", "DZ", "LB", "IQ", "TR",
  "GB", "IE", "DE", "FR", "ES", "IT", "NL", "BE", "SE", "NO", "DK", "FI", "PL", "PT", "CH", "AT",
  "US", "CA", "MX", "BR", "AR", "CL", "CO", "AU", "NZ", "ZA", "NG", "KE", "IN", "PK", "ID", "MY",
  "SG", "PH", "TH", "VN", "JP", "KR",
] as const;

const EURO = new Set(["AT", "BE", "DE", "ES", "FI", "FR", "IE", "IT", "NL", "PT"]);
const COUNTRY_CURRENCY: Record<string, string> = {
  AE: "AED", SA: "SAR", TR: "TRY", GB: "GBP", CH: "CHF", SE: "SEK", NO: "NOK", DK: "DKK", PL: "PLN",
  US: "USD", CA: "CAD", MX: "MXN", BR: "BRL", AU: "AUD", NZ: "NZD", ZA: "ZAR", IN: "INR", SG: "SGD",
  JP: "JPY", HK: "HKD",
};

export function currencyForCountry(countryCode: string): string {
  const code = countryCode.toUpperCase();
  if (EURO.has(code)) return "EUR";
  return COUNTRY_CURRENCY[code] ?? "USD";
}

export function findAppCurrency(code: string): AppCurrency {
  return APP_CURRENCIES.find((item) => item.code === code.toUpperCase()) ?? APP_CURRENCIES[0];
}

export function formatMoney(amount: number, currencyCode: string, locale: string): string {
  const currency = findAppCurrency(currencyCode);
  const scale = currency.decimals === 0 ? 1 : 100;
  const value = amount / scale;

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currency.code,
    minimumFractionDigits: currency.decimals === 0 ? 0 : value % 1 === 0 ? 0 : 2,
    maximumFractionDigits: currency.decimals,
  }).format(value);
}

export function countryName(countryCode: string, locale: string): string {
  try {
    return new Intl.DisplayNames([locale], { type: "region", fallback: "code" }).of(countryCode) ?? countryCode;
  } catch {
    return countryCode;
  }
}

