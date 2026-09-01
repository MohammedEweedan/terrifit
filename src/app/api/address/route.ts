import { NextResponse } from "next/server";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { findCountry, validPostal } from "@/lib/shop/countries";
import {
  parseGetAddress, parseIdealPostcodes, parseNominatim, parsePostcodesIo,
  type GetAddressRow, type IdealPostcodesRow, type Lookup, type NominatimRow, type PostcodesIoResult,
} from "@/lib/shop/address";

export const runtime = "nodejs";

const env = (key: string) => process.env[key]?.trim() || "";

/**
 * Postcode → address lookup.
 *
 * Three tiers, best first, because full address data is licensed and nobody
 * gives it away:
 *
 *   1. Ideal Postcodes or getAddress.io, when a key is set. Both resell Royal
 *      Mail's PAF, which is the only authoritative source of UK addresses —
 *      every house on the street, correctly formatted.
 *   2. OpenStreetMap's Nominatim otherwise. Free and keyless, worldwide, but
 *      it knows streets rather than door numbers, so it fills in everything
 *      except the number.
 *   3. postcodes.io for the town and region on a UK postcode, which is better
 *      than nothing when Nominatim has no coverage.
 *
 * The response shape is identical in all three cases; only `precision` differs,
 * so the app can say honestly how much still needs typing.
 */
export async function GET(request: Request) {
  if (!rateLimit(`address:${clientKey(request)}`, 30, 60_000)) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const url = new URL(request.url);
  const country = (url.searchParams.get("country") ?? "").toUpperCase();
  const postal = (url.searchParams.get("postal") ?? "").trim();

  const known = findCountry(country);
  if (!known) return NextResponse.json({ error: "unknown_country" }, { status: 422 });
  if (!validPostal(country, postal)) {
    return NextResponse.json({ error: "invalid_postal" }, { status: 422 });
  }

  try {
    if (country === "GB") {
      const paf = await royalMail(postal);
      if (paf) return NextResponse.json(paf);
    }

    const streets = await nominatim(country, postal);
    if (streets.addresses.length > 0) return NextResponse.json(streets);

    if (country === "GB") {
      const area = await postcodesIo(postal);
      if (area) return NextResponse.json(area);
    }

    return NextResponse.json({ precision: "none", addresses: [] });
  } catch {
    // A lookup failing must never block a checkout — the fields are all there
    // to be typed into.
    return NextResponse.json({ precision: "none", addresses: [] });
  }
}

/* -------------------------------------------------------------------------- */

/** Full PAF, when somebody has paid for it. */
async function royalMail(postal: string): Promise<Lookup | null> {
  const ideal = env("IDEAL_POSTCODES_API_KEY");
  if (ideal) {
    const response = await fetch(
      `https://api.ideal-postcodes.co.uk/v1/postcodes/${encodeURIComponent(postal.replace(/\s+/g, ""))}?api_key=${encodeURIComponent(ideal)}`,
      { signal: AbortSignal.timeout(4500) },
    );
    if (!response.ok) return null;
    const body = (await response.json()) as { result?: IdealPostcodesRow[] };
    if (!body.result?.length) return null;
    return parseIdealPostcodes(body.result);
  }

  const getAddress = env("GETADDRESS_API_KEY");
  if (getAddress) {
    const response = await fetch(
      `https://api.getaddress.io/find/${encodeURIComponent(postal)}?api-key=${encodeURIComponent(getAddress)}&expand=true`,
      { signal: AbortSignal.timeout(4500) },
    );
    if (!response.ok) return null;
    const body = (await response.json()) as { postcode?: string; addresses?: GetAddressRow[] };
    if (!body.addresses?.length) return null;
    return parseGetAddress(body.addresses, body.postcode ?? postal);
  }

  return null;
}

/**
 * OpenStreetMap, worldwide and keyless.
 *
 * Their usage policy requires an identifying User-Agent and no more than one
 * request a second; the per-client rate limit above is stricter than that, and
 * checkout lookups are rare enough not to approach it in aggregate.
 */
async function nominatim(country: string, postal: string): Promise<Lookup> {
  const query = new URLSearchParams({
    postalcode: postal,
    country,
    format: "jsonv2",
    addressdetails: "1",
    limit: "25",
  });

  const response = await fetch(`https://nominatim.openstreetmap.org/search?${query}`, {
    headers: { "User-Agent": "Terrifit/1.0 (checkout address lookup; support@terrifit.com)" },
    signal: AbortSignal.timeout(5000),
  });
  if (!response.ok) return { precision: "none", addresses: [] };

  return parseNominatim((await response.json()) as NominatimRow[], postal);
}

/** The town and region for a UK postcode. Free, keyless, Royal Mail open data. */
async function postcodesIo(postal: string): Promise<Lookup | null> {
  const response = await fetch(
    `https://api.postcodes.io/postcodes/${encodeURIComponent(postal.replace(/\s+/g, ""))}`,
    { signal: AbortSignal.timeout(4000) },
  );
  if (!response.ok) return null;

  const body = (await response.json()) as { result?: PostcodesIoResult };
  return body.result ? parsePostcodesIo(body.result) : null;
}
