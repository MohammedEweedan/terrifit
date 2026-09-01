import { NextResponse } from "next/server";
import { isLocale, defaultLocale } from "@/i18n/config";
import { search } from "@/lib/search";
import { clientKey, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function GET(request: Request) {
  // The index is in memory and cheap, but typing is fast — this only stops a
  // script hammering the endpoint, not a person searching.
  if (!rateLimit(`search:${clientKey(request)}`, 120, 60_000)) {
    return NextResponse.json({ results: [] }, { status: 429 });
  }

  const url = new URL(request.url);
  const query = (url.searchParams.get("q") ?? "").slice(0, 120);
  const localeParam = url.searchParams.get("locale") ?? defaultLocale;
  const locale = isLocale(localeParam) ? localeParam : defaultLocale;
  const limit = Math.min(25, Math.max(1, Number(url.searchParams.get("limit")) || 12));

  return NextResponse.json(
    { results: search(locale, query, limit) },
    // The corpus only changes on deploy, so this is safe to cache at the edge.
    { headers: { "Cache-Control": "public, max-age=60, s-maxage=300" } },
  );
}
