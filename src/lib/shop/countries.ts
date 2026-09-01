/**
 * Every country, with the two things checkout actually needs: how to dial it
 * and what its postal code looks like.
 *
 * ISO 3166-1 alpha-2 throughout, because that is what payment processors,
 * carriers and tax engines all speak. The postal patterns are deliberately
 * permissive — a regex that rejects a real address is far worse than one that
 * lets a typo through to a human.
 */
export type Country = {
  code: string;
  name: string;
  /** International dialling prefix, without the plus. */
  dial: string;
  /** Loose validation for the postal field. Null where none is used. */
  postal: RegExp | null;
  /** What to call the postal field to someone who lives there. */
  postalLabel: string;
};

const P = {
  gb: /^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i,
  us: /^\d{5}(-\d{4})?$/,
  ca: /^[A-Z]\d[A-Z]\s*\d[A-Z]\d$/i,
  nl: /^\d{4}\s*[A-Z]{2}$/i,
  five: /^\d{5}$/,
  four: /^\d{4}$/,
  six: /^\d{6}$/,
  any: /^[A-Z\d][A-Z\d\s-]{1,10}$/i,
};

export const COUNTRIES: Country[] = [
  { code: "AF", name: "Afghanistan", dial: "93", postal: P.four, postalLabel: "Postal code" },
  { code: "AL", name: "Albania", dial: "355", postal: P.four, postalLabel: "Postal code" },
  { code: "DZ", name: "Algeria", dial: "213", postal: P.five, postalLabel: "Postal code" },
  { code: "AD", name: "Andorra", dial: "376", postal: P.any, postalLabel: "Postal code" },
  { code: "AO", name: "Angola", dial: "244", postal: null, postalLabel: "Postal code" },
  { code: "AG", name: "Antigua and Barbuda", dial: "1268", postal: null, postalLabel: "Postal code" },
  { code: "AR", name: "Argentina", dial: "54", postal: P.any, postalLabel: "Postal code" },
  { code: "AM", name: "Armenia", dial: "374", postal: P.four, postalLabel: "Postal code" },
  { code: "AU", name: "Australia", dial: "61", postal: P.four, postalLabel: "Postcode" },
  { code: "AT", name: "Austria", dial: "43", postal: P.four, postalLabel: "Postal code" },
  { code: "AZ", name: "Azerbaijan", dial: "994", postal: P.any, postalLabel: "Postal code" },
  { code: "BS", name: "Bahamas", dial: "1242", postal: null, postalLabel: "Postal code" },
  { code: "BH", name: "Bahrain", dial: "973", postal: P.any, postalLabel: "Postal code" },
  { code: "BD", name: "Bangladesh", dial: "880", postal: P.four, postalLabel: "Postal code" },
  { code: "BB", name: "Barbados", dial: "1246", postal: P.any, postalLabel: "Postal code" },
  { code: "BY", name: "Belarus", dial: "375", postal: P.six, postalLabel: "Postal code" },
  { code: "BE", name: "Belgium", dial: "32", postal: P.four, postalLabel: "Postal code" },
  { code: "BZ", name: "Belize", dial: "501", postal: null, postalLabel: "Postal code" },
  { code: "BJ", name: "Benin", dial: "229", postal: null, postalLabel: "Postal code" },
  { code: "BT", name: "Bhutan", dial: "975", postal: P.five, postalLabel: "Postal code" },
  { code: "BO", name: "Bolivia", dial: "591", postal: null, postalLabel: "Postal code" },
  { code: "BA", name: "Bosnia and Herzegovina", dial: "387", postal: P.five, postalLabel: "Postal code" },
  { code: "BW", name: "Botswana", dial: "267", postal: null, postalLabel: "Postal code" },
  { code: "BR", name: "Brazil", dial: "55", postal: /^\d{5}-?\d{3}$/, postalLabel: "CEP" },
  { code: "BN", name: "Brunei", dial: "673", postal: P.any, postalLabel: "Postal code" },
  { code: "BG", name: "Bulgaria", dial: "359", postal: P.four, postalLabel: "Postal code" },
  { code: "BF", name: "Burkina Faso", dial: "226", postal: null, postalLabel: "Postal code" },
  { code: "BI", name: "Burundi", dial: "257", postal: null, postalLabel: "Postal code" },
  { code: "KH", name: "Cambodia", dial: "855", postal: P.five, postalLabel: "Postal code" },
  { code: "CM", name: "Cameroon", dial: "237", postal: null, postalLabel: "Postal code" },
  { code: "CA", name: "Canada", dial: "1", postal: P.ca, postalLabel: "Postal code" },
  { code: "CV", name: "Cape Verde", dial: "238", postal: P.four, postalLabel: "Postal code" },
  { code: "CF", name: "Central African Republic", dial: "236", postal: null, postalLabel: "Postal code" },
  { code: "TD", name: "Chad", dial: "235", postal: null, postalLabel: "Postal code" },
  { code: "CL", name: "Chile", dial: "56", postal: P.any, postalLabel: "Postal code" },
  { code: "CN", name: "China", dial: "86", postal: P.six, postalLabel: "Postal code" },
  { code: "CO", name: "Colombia", dial: "57", postal: P.six, postalLabel: "Postal code" },
  { code: "CG", name: "Congo", dial: "242", postal: null, postalLabel: "Postal code" },
  { code: "CD", name: "Congo (DRC)", dial: "243", postal: null, postalLabel: "Postal code" },
  { code: "CR", name: "Costa Rica", dial: "506", postal: P.five, postalLabel: "Postal code" },
  { code: "HR", name: "Croatia", dial: "385", postal: P.five, postalLabel: "Postal code" },
  { code: "CU", name: "Cuba", dial: "53", postal: P.five, postalLabel: "Postal code" },
  { code: "CY", name: "Cyprus", dial: "357", postal: P.four, postalLabel: "Postal code" },
  { code: "CZ", name: "Czechia", dial: "420", postal: /^\d{3}\s*\d{2}$/, postalLabel: "Postal code" },
  { code: "DK", name: "Denmark", dial: "45", postal: P.four, postalLabel: "Postal code" },
  { code: "DJ", name: "Djibouti", dial: "253", postal: null, postalLabel: "Postal code" },
  { code: "DM", name: "Dominica", dial: "1767", postal: null, postalLabel: "Postal code" },
  { code: "DO", name: "Dominican Republic", dial: "1809", postal: P.five, postalLabel: "Postal code" },
  { code: "EC", name: "Ecuador", dial: "593", postal: P.six, postalLabel: "Postal code" },
  { code: "EG", name: "Egypt", dial: "20", postal: P.five, postalLabel: "Postal code" },
  { code: "SV", name: "El Salvador", dial: "503", postal: P.four, postalLabel: "Postal code" },
  { code: "EE", name: "Estonia", dial: "372", postal: P.five, postalLabel: "Postal code" },
  { code: "ET", name: "Ethiopia", dial: "251", postal: P.four, postalLabel: "Postal code" },
  { code: "FJ", name: "Fiji", dial: "679", postal: null, postalLabel: "Postal code" },
  { code: "FI", name: "Finland", dial: "358", postal: P.five, postalLabel: "Postal code" },
  { code: "FR", name: "France", dial: "33", postal: P.five, postalLabel: "Code postal" },
  { code: "GA", name: "Gabon", dial: "241", postal: null, postalLabel: "Postal code" },
  { code: "GM", name: "Gambia", dial: "220", postal: null, postalLabel: "Postal code" },
  { code: "GE", name: "Georgia", dial: "995", postal: P.four, postalLabel: "Postal code" },
  { code: "DE", name: "Germany", dial: "49", postal: P.five, postalLabel: "PLZ" },
  { code: "GH", name: "Ghana", dial: "233", postal: null, postalLabel: "Postal code" },
  { code: "GR", name: "Greece", dial: "30", postal: /^\d{3}\s*\d{2}$/, postalLabel: "Postal code" },
  { code: "GT", name: "Guatemala", dial: "502", postal: P.five, postalLabel: "Postal code" },
  { code: "GN", name: "Guinea", dial: "224", postal: null, postalLabel: "Postal code" },
  { code: "GY", name: "Guyana", dial: "592", postal: null, postalLabel: "Postal code" },
  { code: "HT", name: "Haiti", dial: "509", postal: P.four, postalLabel: "Postal code" },
  { code: "HN", name: "Honduras", dial: "504", postal: P.any, postalLabel: "Postal code" },
  { code: "HK", name: "Hong Kong", dial: "852", postal: null, postalLabel: "Postal code" },
  { code: "HU", name: "Hungary", dial: "36", postal: P.four, postalLabel: "Postal code" },
  { code: "IS", name: "Iceland", dial: "354", postal: /^\d{3}$/, postalLabel: "Postal code" },
  { code: "IN", name: "India", dial: "91", postal: P.six, postalLabel: "PIN code" },
  { code: "ID", name: "Indonesia", dial: "62", postal: P.five, postalLabel: "Postal code" },
  { code: "IQ", name: "Iraq", dial: "964", postal: P.five, postalLabel: "Postal code" },
  { code: "IE", name: "Ireland", dial: "353", postal: P.any, postalLabel: "Eircode" },
  { code: "IL", name: "Israel", dial: "972", postal: /^\d{5,7}$/, postalLabel: "Postal code" },
  { code: "IT", name: "Italy", dial: "39", postal: P.five, postalLabel: "CAP" },
  { code: "JM", name: "Jamaica", dial: "1876", postal: null, postalLabel: "Postal code" },
  { code: "JP", name: "Japan", dial: "81", postal: /^\d{3}-?\d{4}$/, postalLabel: "Postal code" },
  { code: "JO", name: "Jordan", dial: "962", postal: P.five, postalLabel: "Postal code" },
  { code: "KZ", name: "Kazakhstan", dial: "7", postal: P.six, postalLabel: "Postal code" },
  { code: "KE", name: "Kenya", dial: "254", postal: P.five, postalLabel: "Postal code" },
  { code: "KW", name: "Kuwait", dial: "965", postal: P.five, postalLabel: "Postal code" },
  { code: "KG", name: "Kyrgyzstan", dial: "996", postal: P.six, postalLabel: "Postal code" },
  { code: "LA", name: "Laos", dial: "856", postal: P.five, postalLabel: "Postal code" },
  { code: "LV", name: "Latvia", dial: "371", postal: P.any, postalLabel: "Postal code" },
  { code: "LB", name: "Lebanon", dial: "961", postal: P.any, postalLabel: "Postal code" },
  { code: "LY", name: "Libya", dial: "218", postal: null, postalLabel: "Postal code" },
  { code: "LI", name: "Liechtenstein", dial: "423", postal: P.four, postalLabel: "Postal code" },
  { code: "LT", name: "Lithuania", dial: "370", postal: P.any, postalLabel: "Postal code" },
  { code: "LU", name: "Luxembourg", dial: "352", postal: P.four, postalLabel: "Postal code" },
  { code: "MG", name: "Madagascar", dial: "261", postal: /^\d{3}$/, postalLabel: "Postal code" },
  { code: "MW", name: "Malawi", dial: "265", postal: null, postalLabel: "Postal code" },
  { code: "MY", name: "Malaysia", dial: "60", postal: P.five, postalLabel: "Postcode" },
  { code: "MV", name: "Maldives", dial: "960", postal: P.five, postalLabel: "Postal code" },
  { code: "ML", name: "Mali", dial: "223", postal: null, postalLabel: "Postal code" },
  { code: "MT", name: "Malta", dial: "356", postal: P.any, postalLabel: "Postal code" },
  { code: "MU", name: "Mauritius", dial: "230", postal: P.any, postalLabel: "Postal code" },
  { code: "MX", name: "Mexico", dial: "52", postal: P.five, postalLabel: "Código postal" },
  { code: "MD", name: "Moldova", dial: "373", postal: P.any, postalLabel: "Postal code" },
  { code: "MC", name: "Monaco", dial: "377", postal: P.five, postalLabel: "Postal code" },
  { code: "MN", name: "Mongolia", dial: "976", postal: P.five, postalLabel: "Postal code" },
  { code: "ME", name: "Montenegro", dial: "382", postal: P.five, postalLabel: "Postal code" },
  { code: "MA", name: "Morocco", dial: "212", postal: P.five, postalLabel: "Postal code" },
  { code: "MZ", name: "Mozambique", dial: "258", postal: P.four, postalLabel: "Postal code" },
  { code: "MM", name: "Myanmar", dial: "95", postal: P.five, postalLabel: "Postal code" },
  { code: "NA", name: "Namibia", dial: "264", postal: null, postalLabel: "Postal code" },
  { code: "NP", name: "Nepal", dial: "977", postal: P.five, postalLabel: "Postal code" },
  { code: "NL", name: "Netherlands", dial: "31", postal: P.nl, postalLabel: "Postcode" },
  { code: "NZ", name: "New Zealand", dial: "64", postal: P.four, postalLabel: "Postcode" },
  { code: "NI", name: "Nicaragua", dial: "505", postal: P.any, postalLabel: "Postal code" },
  { code: "NE", name: "Niger", dial: "227", postal: P.four, postalLabel: "Postal code" },
  { code: "NG", name: "Nigeria", dial: "234", postal: P.six, postalLabel: "Postal code" },
  { code: "MK", name: "North Macedonia", dial: "389", postal: P.four, postalLabel: "Postal code" },
  { code: "NO", name: "Norway", dial: "47", postal: P.four, postalLabel: "Postal code" },
  { code: "OM", name: "Oman", dial: "968", postal: /^\d{3}$/, postalLabel: "Postal code" },
  { code: "PK", name: "Pakistan", dial: "92", postal: P.five, postalLabel: "Postal code" },
  { code: "PS", name: "Palestine", dial: "970", postal: P.any, postalLabel: "Postal code" },
  { code: "PA", name: "Panama", dial: "507", postal: P.any, postalLabel: "Postal code" },
  { code: "PY", name: "Paraguay", dial: "595", postal: P.four, postalLabel: "Postal code" },
  { code: "PE", name: "Peru", dial: "51", postal: P.five, postalLabel: "Postal code" },
  { code: "PH", name: "Philippines", dial: "63", postal: P.four, postalLabel: "Postal code" },
  { code: "PL", name: "Poland", dial: "48", postal: /^\d{2}-?\d{3}$/, postalLabel: "Postal code" },
  { code: "PT", name: "Portugal", dial: "351", postal: /^\d{4}-?\d{3}$/, postalLabel: "Código postal" },
  { code: "QA", name: "Qatar", dial: "974", postal: null, postalLabel: "Postal code" },
  { code: "RO", name: "Romania", dial: "40", postal: P.six, postalLabel: "Postal code" },
  { code: "RU", name: "Russia", dial: "7", postal: P.six, postalLabel: "Postal code" },
  { code: "RW", name: "Rwanda", dial: "250", postal: null, postalLabel: "Postal code" },
  { code: "SA", name: "Saudi Arabia", dial: "966", postal: P.five, postalLabel: "Postal code" },
  { code: "SN", name: "Senegal", dial: "221", postal: P.five, postalLabel: "Postal code" },
  { code: "RS", name: "Serbia", dial: "381", postal: P.five, postalLabel: "Postal code" },
  { code: "SG", name: "Singapore", dial: "65", postal: P.six, postalLabel: "Postal code" },
  { code: "SK", name: "Slovakia", dial: "421", postal: /^\d{3}\s*\d{2}$/, postalLabel: "Postal code" },
  { code: "SI", name: "Slovenia", dial: "386", postal: P.four, postalLabel: "Postal code" },
  { code: "SO", name: "Somalia", dial: "252", postal: P.any, postalLabel: "Postal code" },
  { code: "ZA", name: "South Africa", dial: "27", postal: P.four, postalLabel: "Postal code" },
  { code: "KR", name: "South Korea", dial: "82", postal: P.five, postalLabel: "Postal code" },
  { code: "ES", name: "Spain", dial: "34", postal: P.five, postalLabel: "Código postal" },
  { code: "LK", name: "Sri Lanka", dial: "94", postal: P.five, postalLabel: "Postal code" },
  { code: "SD", name: "Sudan", dial: "249", postal: P.five, postalLabel: "Postal code" },
  { code: "SE", name: "Sweden", dial: "46", postal: /^\d{3}\s*\d{2}$/, postalLabel: "Postal code" },
  { code: "CH", name: "Switzerland", dial: "41", postal: P.four, postalLabel: "Postal code" },
  { code: "SY", name: "Syria", dial: "963", postal: null, postalLabel: "Postal code" },
  { code: "TW", name: "Taiwan", dial: "886", postal: /^\d{3,6}$/, postalLabel: "Postal code" },
  { code: "TZ", name: "Tanzania", dial: "255", postal: P.five, postalLabel: "Postal code" },
  { code: "TH", name: "Thailand", dial: "66", postal: P.five, postalLabel: "Postal code" },
  { code: "TN", name: "Tunisia", dial: "216", postal: P.four, postalLabel: "Postal code" },
  { code: "TR", name: "Türkiye", dial: "90", postal: P.five, postalLabel: "Posta kodu" },
  { code: "UG", name: "Uganda", dial: "256", postal: null, postalLabel: "Postal code" },
  { code: "UA", name: "Ukraine", dial: "380", postal: P.five, postalLabel: "Postal code" },
  { code: "AE", name: "United Arab Emirates", dial: "971", postal: null, postalLabel: "Postal code" },
  { code: "GB", name: "United Kingdom", dial: "44", postal: P.gb, postalLabel: "Postcode" },
  { code: "US", name: "United States", dial: "1", postal: P.us, postalLabel: "ZIP code" },
  { code: "UY", name: "Uruguay", dial: "598", postal: P.five, postalLabel: "Postal code" },
  { code: "UZ", name: "Uzbekistan", dial: "998", postal: P.six, postalLabel: "Postal code" },
  { code: "VE", name: "Venezuela", dial: "58", postal: P.four, postalLabel: "Postal code" },
  { code: "VN", name: "Vietnam", dial: "84", postal: P.six, postalLabel: "Postal code" },
  { code: "YE", name: "Yemen", dial: "967", postal: null, postalLabel: "Postal code" },
  { code: "ZM", name: "Zambia", dial: "260", postal: P.five, postalLabel: "Postal code" },
  { code: "ZW", name: "Zimbabwe", dial: "263", postal: null, postalLabel: "Postal code" },
];

export function findCountry(code: string): Country | undefined {
  return COUNTRIES.find((country) => country.code === code.toUpperCase());
}

/** True when the postal code looks right for that country, or it has none. */
export function validPostal(code: string, postal: string): boolean {
  const country = findCountry(code);
  if (!country) return postal.trim().length > 0;
  if (!country.postal) return true;
  return country.postal.test(postal.trim());
}

/**
 * Loose international phone validation.
 *
 * Deliberately not a full libphonenumber: the national number lengths vary
 * from 4 to 13 digits and a stricter rule rejects real numbers, which costs an
 * order. The dialling code has to be one we know; the rest is a length check.
 */
export function validPhone(dial: string, national: string): boolean {
  const digits = national.replace(/\D/g, "");
  if (digits.length < 4 || digits.length > 14) return false;
  return COUNTRIES.some((country) => country.dial === dial);
}

/** E.164, which is what every carrier and OTP provider expects. */
export function toE164(dial: string, national: string): string {
  return `+${dial}${national.replace(/\D/g, "").replace(/^0+/, "")}`;
}
