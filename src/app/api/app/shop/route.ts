import { NextResponse } from "next/server";
import { getRequestUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isLocale, type Locale } from "@/i18n/config";
import { getPagesCopy } from "@/i18n/pages";
import {
  CATEGORIES,
  swatchColours,
  type Category,
} from "@/lib/shop/catalog";
import { getV1Colourways, listShopProducts, recommendationsFrom } from "@/lib/shop/catalog-store";
import { CURRENCIES, currencyForLocale, findCurrency, formatIn, priceIn } from "@/lib/shop/currency";
import { localeMeta } from "@/i18n/config";

export const runtime = "nodejs";

/**
 * The storefront, shaped for a phone.
 *
 * Prices are formatted here rather than on the device so the app and the web
 * shop can never quote different money, and the raw cents go along too for
 * anything the app wants to total itself.
 */
export async function GET(request: Request) {
  const user = await getRequestUser(request);
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  // Prices are formatted in the member's own locale, taken from their account
  // rather than the device, so the app and the web shop agree.
  const account = await prisma.user.findUnique({ where: { id: user.id }, select: { locale: true } });
  const stored = account?.locale ?? "";
  const requestedLocale = new URL(request.url).searchParams.get("locale") ?? "";
  const locale: Locale = isLocale(requestedLocale) ? requestedLocale : isLocale(stored) ? stored : "en";
  const copy = getPagesCopy(locale);
  // Same rule as the web shop: only what actually ships.
  const [products, colourways] = await Promise.all([listShopProducts(), getV1Colourways()]);

  // The member's market decides the currency, and an explicit `?currency=`
  // overrides it — someone living abroad may well want to pay in their own.
  const requestedCurrency = new URL(request.url).searchParams.get("currency") ?? "";
  const currency = findCurrency(requestedCurrency) ?? currencyForLocale(locale);
  const htmlLang = localeMeta[locale].htmlLang;
  const price = (cents: number) => formatIn(priceIn(cents, currency), currency, htmlLang);

  // A paired band decides which colourway the V1 is pictured in — showing
  // someone the Ember band when they bought Midnight is a small lie the shop
  // has no reason to tell.
  const band = await prisma.bandDevice.findFirst({
    where: { userId: user.id },
    orderBy: { pairedAt: "desc" },
    select: { colourway: true, serial: true },
  });
  const owned = band ? colourways.find((variant) => variant.id === band.colourway) ?? null : null;

  const url = new URL(request.url);
  const requested = url.searchParams.get("category");
  const category = CATEGORIES.includes(requested as Category) ? (requested as Category) : null;

  const list = category ? products.filter((product) => product.category === category) : products;

  const recommended = recommendationsFrom(products, band ? ["terrifit-v1"] : [], 4).map((product) => product.slug);

  return NextResponse.json(
    {
      categories: CATEGORIES,
      currency: {
        code: currency.code,
        symbol: currency.symbol,
        decimals: currency.decimals,
      },
      /** Everything the picker can offer. */
      currencies: CURRENCIES.map((item) => ({ code: item.code, symbol: item.symbol })),
      yourBand: band
        ? {
            serial: band.serial,
            colourway: band.colourway,
            label: owned?.label ?? band.colourway,
            image: owned?.image ?? null,
            accent: owned?.accent ?? null,
          }
        : null,
      recommended,
      colourways: colourways.map((variant) => ({
        id: variant.id,
        label: variant.label,
        note: variant.note ?? null,
        swatch: variant.swatch ?? null,
        swatchColours: swatchColours(variant.swatch),
        accent: variant.accent ?? null,
        image: variant.image ?? null,
      })),
      products: list.map((product) => ({
        slug: product.slug,
        name: product.name,
        tagline: product.tagline,
        category: product.category,
        brand: product.brand,
        partner: product.partner,
        // Minor units in the charged currency, so a client that totals its own
        // cart arrives at the same number the server will charge.
        priceCents: priceIn(product.priceCents, currency),
        price: price(product.priceCents),
        compareAt: product.compareAtCents ? price(product.compareAtCents) : null,
        rating: product.rating,
        reviews: product.reviews,
        badges: product.badges,
        variantLabel: product.variantLabel ?? null,
        description: product.description,
        highlights: product.highlights,
        specs: product.specs,
        // The V1 has a full spec sheet on the Band page, grouped by subsystem.
        // The phone gets the same one rather than the six-row summary — it is
        // the product people research hardest before spending £229.
        specGroups: product.slug === "terrifit-v1" ? copy.band.specsSection.groups : null,
        stock: product.stock,
        launchStatus: product.launchStatus,
        stockQuantity: product.stockQuantity ?? 0,
        allowBackorder: product.allowBackorder ?? false,
        shipsIn: product.shipsIn,
        fulfilment: product.fulfilment,
        subscription: product.subscription ?? null,
        image:
          product.slug === "terrifit-v1" && owned?.image ? owned.image : (product.media[0]?.src ?? null),
        imageAlt: product.media[0]?.alt ?? product.name,
        variants: product.variants.map((variant) => ({
          id: variant.id,
          label: variant.label,
          note: variant.note ?? null,
          swatch: variant.swatch ?? null,
          swatchColours: swatchColours(variant.swatch),
          accent: variant.accent ?? null,
          image: variant.image ?? null,
          stockQuantity: variant.stockQuantity ?? 0,
          allowBackorder: variant.allowBackorder ?? false,
          priceCents: priceIn(variant.priceCents ?? product.priceCents, currency),
          price: price(variant.priceCents ?? product.priceCents),
        })),
      })),
    },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
