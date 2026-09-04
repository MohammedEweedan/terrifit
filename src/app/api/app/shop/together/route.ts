import { NextResponse } from "next/server";
import { getRequestUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isLocale, type Locale } from "@/i18n/config";
import { boughtTogether } from "@/lib/shop/together";
import { CURRENCIES, currencyForLocale, findCurrency, formatIn, priceIn } from "@/lib/shop/currency";
import { localeMeta } from "@/i18n/config";

export const runtime = "nodejs";

/** What goes with what is in the bag. `slugs` is a comma-separated list. */
export async function GET(request: Request) {
  const user = await getRequestUser(request);
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const url = new URL(request.url);
  const slugs = (url.searchParams.get("slugs") ?? "")
    .split(",")
    .map((slug) => slug.trim())
    .filter(Boolean)
    .slice(0, 30);

  const account = await prisma.user.findUnique({ where: { id: user.id }, select: { locale: true } });
  const stored = account?.locale ?? "";
  const requestedLocale = url.searchParams.get("locale") ?? "";
  const locale: Locale = isLocale(requestedLocale) ? requestedLocale : isLocale(stored) ? stored : "en";
  const requestedCurrency = url.searchParams.get("currency") ?? "";
  const currency = findCurrency(requestedCurrency) ?? currencyForLocale(locale);
  const price = (cents: number) => formatIn(priceIn(cents, currency), currency, localeMeta[locale].htmlLang);

  const result = await boughtTogether(slugs, 3);

  return NextResponse.json(
    {
      basis: result.basis,
      sampleSize: result.sampleSize,
      products: result.products.map((product) => ({
        slug: product.slug,
        name: product.name,
        tagline: product.tagline,
        price: price(product.priceCents),
        priceCents: priceIn(product.priceCents, currency),
        image: product.media[0]?.src ?? null,
        variantId: product.variants[0]?.id ?? null,
        variantLabel: product.variants.length === 1 ? (product.variants[0]?.label ?? null) : null,
        needsChoice: product.variants.length > 1,
      })),
      currency: { code: currency.code, symbol: currency.symbol, decimals: currency.decimals },
      currencies: CURRENCIES.map((item) => ({ code: item.code, symbol: item.symbol })),
    },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
