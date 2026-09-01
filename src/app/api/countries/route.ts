import { NextResponse } from "next/server";
import { COUNTRIES } from "@/lib/shop/countries";

export const runtime = "nodejs";
export const dynamic = "force-static";

/**
 * The country list, so the app and the site cannot disagree about which
 * countries exist, what they dial or what their postal field is called.
 *
 * Static: this changes when the world changes, not when a request arrives.
 * The postal pattern goes over the wire as its source string because JSON has
 * no regex — the client compiles it back with `new RegExp`.
 */
export async function GET() {
  return NextResponse.json(
    {
      countries: COUNTRIES.map((country) => ({
        code: country.code,
        name: country.name,
        dial: country.dial,
        postal: country.postal ? country.postal.source : null,
        postalLabel: country.postalLabel,
      })),
    },
    { headers: { "Cache-Control": "public, max-age=86400, s-maxage=604800" } },
  );
}
