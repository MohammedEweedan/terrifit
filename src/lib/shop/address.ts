/**
 * Turning provider payloads into one address shape.
 *
 * Kept out of the route so each provider's parsing can be tested against a
 * captured response — an address that comes back subtly wrong is a parcel that
 * goes to the wrong door, and that is not something to find out in production.
 */

export type Suggestion = {
  /** The whole thing on one line, for the list row. */
  label: string;
  line1: string;
  line2: string;
  city: string;
  region: string;
  postal: string;
};

/** How much of the address the provider actually knew. */
export type Precision = "exact" | "street" | "area" | "none";

export type Lookup = { precision: Precision; addresses: Suggestion[] };

export type NominatimRow = {
  address?: Record<string, string>;
  display_name?: string;
};

/**
 * OpenStreetMap rows.
 *
 * OSM maps streets reliably and door numbers only where a contributor has
 * walked them, so the result is deduplicated by label and reports `street`
 * unless at least one row came back with a house number.
 */
export function parseNominatim(rows: NominatimRow[], fallbackPostal: string): Lookup {
  const seen = new Set<string>();
  const addresses: Suggestion[] = [];

  for (const row of rows) {
    const a = row.address ?? {};
    const street = a.road ?? a.pedestrian ?? a.residential ?? "";
    const city = a.city ?? a.town ?? a.village ?? a.suburb ?? a.municipality ?? "";
    if (!street && !city) continue;

    const line1 = [a.house_number, street].filter(Boolean).join(" ") || street;
    const label = [line1, city].filter(Boolean).join(", ");
    if (!label || seen.has(label)) continue;
    seen.add(label);


    addresses.push({
      label,
      line1,
      line2: "",
      city,
      region: a.state ?? a.county ?? "",
      postal: a.postcode ?? fallbackPostal,
    });
  }

  if (addresses.length === 0) return { precision: "none", addresses };

  // Precision is decided by what actually came back, not by the fact that
  // *something* did. Nominatim will happily answer a postcode with the city
  // alone; calling that "street" made the app promise an address it could not
  // deliver, and the picker then filled in nothing.
  const anyStreet = addresses.some((address) => address.line1.length > 0);
  if (!anyStreet) return { precision: "area", addresses };

  const exact = addresses.some((address) => /^\d/.test(address.line1));
  return { precision: exact ? "exact" : "street", addresses };
}

export type IdealPostcodesRow = {
  line_1: string;
  line_2?: string;
  post_town: string;
  county?: string;
  postcode: string;
};

/** Royal Mail PAF via Ideal Postcodes. Every deliverable address on the postcode. */
export function parseIdealPostcodes(rows: IdealPostcodesRow[]): Lookup {
  if (rows.length === 0) return { precision: "none", addresses: [] };
  return {
    precision: "exact",
    addresses: rows.map((row) => ({
      label: [row.line_1, row.line_2, row.post_town].filter(Boolean).join(", "),
      line1: row.line_1,
      line2: row.line_2 ?? "",
      city: row.post_town,
      region: row.county ?? "",
      postal: row.postcode,
    })),
  };
}

export type GetAddressRow = {
  line_1: string;
  line_2?: string;
  town_or_city: string;
  county?: string;
};

/** The same data through getAddress.io, which names its fields differently. */
export function parseGetAddress(rows: GetAddressRow[], postcode: string): Lookup {
  if (rows.length === 0) return { precision: "none", addresses: [] };
  return {
    precision: "exact",
    addresses: rows.map((row) => ({
      label: [row.line_1, row.line_2, row.town_or_city].filter(Boolean).join(", "),
      line1: row.line_1,
      line2: row.line_2 ?? "",
      city: row.town_or_city,
      region: row.county ?? "",
      postal: postcode,
    })),
  };
}

export type PostcodesIoResult = {
  postcode: string;
  admin_district?: string;
  admin_ward?: string;
  region?: string;
};

/** Town and region only — Royal Mail's *open* data has no street level. */
export function parsePostcodesIo(result: PostcodesIoResult): Lookup {
  const city = result.admin_district ?? result.admin_ward ?? "";
  if (!city) return { precision: "none", addresses: [] };
  return {
    precision: "area",
    addresses: [
      {
        label: [city, result.region].filter(Boolean).join(", "),
        line1: "",
        line2: "",
        city,
        region: result.region ?? "",
        postal: result.postcode,
      },
    ],
  };
}
