import { NextResponse } from "next/server";
import { isLocale, defaultLocale } from "@/i18n/config";
import { search } from "@/lib/search";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { listProducts } from "@/lib/shop/catalog-store";

export const runtime = "nodejs";

export async function GET(request: Request) {
  // The index is in memory and cheap, but typing is fast — this only stops a
  // script hammering the endpoint, not a person searching.
  if (!(await rateLimit(`search:${clientKey(request)}`, 120, 60_000))) {
    return NextResponse.json({ results: [] }, { status: 429 });
  }

  const url = new URL(request.url);
  const query = (url.searchParams.get("q") ?? "").slice(0, 120);
  const localeParam = url.searchParams.get("locale") ?? defaultLocale;
  const locale = isLocale(localeParam) ? localeParam : defaultLocale;
  const limit = Math.min(25, Math.max(1, Number(url.searchParams.get("limit")) || 12));

  const products = await listProducts();
  return NextResponse.json(
    { results: search(locale, query, limit, products) },
    { headers: { "Cache-Control": "public, max-age=30, s-maxage=60" } },
  );
}
