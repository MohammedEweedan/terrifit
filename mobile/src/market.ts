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

/**
 * Country names, bundled rather than derived.
 *
 * `Intl.DisplayNames` is not available in Hermes, so the previous
 * implementation silently fell into its own catch and returned the ISO code —
 * the market row read "EG · EG" instead of naming the country. It is still
 * tried first, because where a runtime does have it the names are localised
 * for free; this table is what makes the failure case readable.
 *
 * English and Arabic are written out because they are the two markets this
 * launches into. Every other locale falls back to the English name, which is
 * a recognisable word rather than two letters.
 */
const COUNTRY_NAMES: Record<string, { en: string; ar: string }> = {
  AE: { en: "United Arab Emirates", ar: "الإمارات العربية المتحدة" },
  SA: { en: "Saudi Arabia", ar: "السعودية" },
  QA: { en: "Qatar", ar: "قطر" },
  KW: { en: "Kuwait", ar: "الكويت" },
  BH: { en: "Bahrain", ar: "البحرين" },
  OM: { en: "Oman", ar: "عُمان" },
  JO: { en: "Jordan", ar: "الأردن" },
  EG: { en: "Egypt", ar: "مصر" },
  MA: { en: "Morocco", ar: "المغرب" },
  TN: { en: "Tunisia", ar: "تونس" },
  DZ: { en: "Algeria", ar: "الجزائر" },
  LB: { en: "Lebanon", ar: "لبنان" },
  IQ: { en: "Iraq", ar: "العراق" },
  TR: { en: "Türkiye", ar: "تركيا" },
  GB: { en: "United Kingdom", ar: "المملكة المتحدة" },
  IE: { en: "Ireland", ar: "أيرلندا" },
  DE: { en: "Germany", ar: "ألمانيا" },
  FR: { en: "France", ar: "فرنسا" },
  ES: { en: "Spain", ar: "إسبانيا" },
  IT: { en: "Italy", ar: "إيطاليا" },
  NL: { en: "Netherlands", ar: "هولندا" },
  BE: { en: "Belgium", ar: "بلجيكا" },
  SE: { en: "Sweden", ar: "السويد" },
  NO: { en: "Norway", ar: "النرويج" },
  DK: { en: "Denmark", ar: "الدنمارك" },
  FI: { en: "Finland", ar: "فنلندا" },
  PL: { en: "Poland", ar: "بولندا" },
  PT: { en: "Portugal", ar: "البرتغال" },
  CH: { en: "Switzerland", ar: "سويسرا" },
  AT: { en: "Austria", ar: "النمسا" },
  US: { en: "United States", ar: "الولايات المتحدة" },
  CA: { en: "Canada", ar: "كندا" },
  MX: { en: "Mexico", ar: "المكسيك" },
  BR: { en: "Brazil", ar: "البرازيل" },
  AR: { en: "Argentina", ar: "الأرجنتين" },
  CL: { en: "Chile", ar: "تشيلي" },
  CO: { en: "Colombia", ar: "كولومبيا" },
  AU: { en: "Australia", ar: "أستراليا" },
  NZ: { en: "New Zealand", ar: "نيوزيلندا" },
  ZA: { en: "South Africa", ar: "جنوب أفريقيا" },
  NG: { en: "Nigeria", ar: "نيجيريا" },
  KE: { en: "Kenya", ar: "كينيا" },
  IN: { en: "India", ar: "الهند" },
  PK: { en: "Pakistan", ar: "باكستان" },
  ID: { en: "Indonesia", ar: "إندونيسيا" },
  MY: { en: "Malaysia", ar: "ماليزيا" },
  SG: { en: "Singapore", ar: "سنغافورة" },
  PH: { en: "Philippines", ar: "الفلبين" },
  TH: { en: "Thailand", ar: "تايلاند" },
  VN: { en: "Vietnam", ar: "فيتنام" },
  JP: { en: "Japan", ar: "اليابان" },
  KR: { en: "South Korea", ar: "كوريا الجنوبية" },
  HK: { en: "Hong Kong", ar: "هونغ كونغ" },
};

/**
 * The bundled lookup, exported so the Hermes path can be tested on its own.
 *
 * Node has `Intl.DisplayNames` and the device does not, so a test that only
 * calls `countryName` exercises the branch that was never broken.
 */
export function fallbackCountryName(countryCode: string, locale: string): string {
  const entry = COUNTRY_NAMES[countryCode];
  if (!entry) return countryCode;
  return locale.startsWith("ar") ? entry.ar : entry.en;
}

export function countryName(countryCode: string, locale: string): string {
  try {
    // `fallback: "none"` so a runtime that has the API but not the data
    // returns undefined and drops through to the table, rather than handing
    // back the code and looking like a successful lookup.
    const display = new Intl.DisplayNames([locale], { type: "region", fallback: "none" }).of(countryCode);
    if (display && display !== countryCode) return display;
  } catch {
    // Hermes. Expected, not exceptional.
  }
  return fallbackCountryName(countryCode, locale);
}

