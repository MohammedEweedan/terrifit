import { API_BASE } from "@/api";

/**
 * The country list, fetched from the site so the app and the site cannot
 * disagree about which countries exist or what their postal fields look like.
 *
 * Fetched once per launch and held in module state. Checkout needs the network
 * anyway — there is nothing to buy offline — so there is no local copy to drift
 * out of date.
 */
export type Country = {
  code: string;
  name: string;
  /** International dialling prefix, without the plus. */
  dial: string;
  /** Compiled from the pattern the server sends. Null where none is used. */
  postal: RegExp | null;
  postalLabel: string;
};

let cache: Country[] | null = null;
let inflight: Promise<Country[]> | null = null;

export async function loadCountries(): Promise<Country[]> {
  if (cache) return cache;
  if (inflight) return inflight;

  inflight = fetch(`${API_BASE}/api/countries`)
    .then((response) => response.json())
    .then((body: { countries: Array<Omit<Country, "postal"> & { postal: string | null }> }) => {
      cache = body.countries.map((country) => ({
        ...country,
        // The server sends the pattern source because JSON has no regex type.
        postal: country.postal ? new RegExp(country.postal, "i") : null,
      }));
      return cache;
    })
    .finally(() => {
      inflight = null;
    });

  return inflight;
}

export function findCountry(list: Country[], code: string): Country | undefined {
  return list.find((country) => country.code === code.toUpperCase());
}

/** True when the postal code looks right for that country, or it has none. */
export function validPostal(country: Country | undefined, postal: string): boolean {
  if (!country) return postal.trim().length > 0;
  if (!country.postal) return true;
  return country.postal.test(postal.trim());
}

/**
 * Loose international phone validation, matching the server exactly.
 *
 * Deliberately not a full libphonenumber: national numbers run from 4 to 14
 * digits and a stricter rule rejects real ones, which costs an order.
 */
export function validPhone(national: string): boolean {
  const digits = national.replace(/\D/g, "");
  return digits.length >= 4 && digits.length <= 14;
}

/** E.164, which is what every carrier and OTP provider expects. */
export function toE164(dial: string, national: string): string {
  return `+${dial}${national.replace(/\D/g, "").replace(/^0+/, "")}`;
}

export type Suggestion = {
  /** The whole thing on one line, for the list row. */
  label: string;
  line1: string;
  line2: string;
  city: string;
  region: string;
  postal: string;
};

/**
 * How much of the address came back.
 *
 * `exact` means door numbers, `street` means the road but not the number,
 * `area` means only the town. The UI says which, so nobody wonders why the
 * house number did not fill itself in.
 */
export type Precision = "exact" | "street" | "area" | "none";

export type AddressLookup = { precision: Precision; addresses: Suggestion[] } | { error: string };

export async function lookupPostcode(country: string, postal: string): Promise<AddressLookup> {
  const response = await fetch(
    `${API_BASE}/api/address?country=${encodeURIComponent(country)}&postal=${encodeURIComponent(postal)}`,
  );
  return (await response.json()) as AddressLookup;
}

/** Streets matching what has been typed, narrowed to the postcode if valid. */
export async function searchStreets(
  country: string,
  postal: string,
  query: string,
): Promise<AddressLookup> {
  const response = await fetch(
    `${API_BASE}/api/address?country=${encodeURIComponent(country)}`
    + `&postal=${encodeURIComponent(postal)}&q=${encodeURIComponent(query)}`,
  );
  return (await response.json()) as AddressLookup;
}
