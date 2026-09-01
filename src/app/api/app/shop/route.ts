import { NextResponse } from "next/server";
import { getRequestUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isLocale, type Locale } from "@/i18n/config";
import { getPagesCopy } from "@/i18n/pages";
import { CATEGORIES, V1_COLOURWAYS, products, recommendationsFor, type Category } from "@/lib/shop/catalog";
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
/**
 * Pulls the hex colours out of a CSS swatch so the app can draw it.
 *
 * The catalogue stores swatches as CSS gradients because that is what the web
 * shop paints with, and React Native has no CSS gradient. Rather than keeping a
 * second copy of every colour in sync by hand, the colours are read back out of
 * the one definition that already exists.
 */
function swatchColours(swatch: string | undefined): string[] {
  if (!swatch) return [];
  const found = swatch.match(/#[0-9a-f]{3,8}/gi) ?? [];
  // A weave is two colours repeated; the app only needs each one once.
  return [...new Set(found.map((hex) => hex.toLowerCase()))].slice(0, 4);
}

export async function GET(request: Request) {
  const user = await getRequestUser(request);
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  // Prices are formatted in the member's own locale, taken from their account
  // rather than the device, so the app and the web shop agree.
  const account = await prisma.user.findUnique({ where: { id: user.id }, select: { locale: true } });
  const stored = account?.locale ?? "";
  const locale: Locale = isLocale(stored) ? stored : "en";
  const copy = getPagesCopy(locale);

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
  const owned = band ? V1_COLOURWAYS.find((variant) => variant.id === band.colourway) ?? null : null;

  const url = new URL(request.url);
  const requested = url.searchParams.get("category");
  const category = CATEGORIES.includes(requested as Category) ? (requested as Category) : null;

  const list = category ? products.filter((product) => product.category === category) : products;

  const recommended = recommendationsFor(band ? ["terrifit-v1"] : [], 4).map((product) => product.slug);

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
      colourways: V1_COLOURWAYS.map((variant) => ({
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
        description: product.description,
        highlights: product.highlights,
        specs: product.specs,
        // The V1 has a full spec sheet on the Band page, grouped by subsystem.
        // The phone gets the same one rather than the six-row summary — it is
        // the product people research hardest before spending £229.
        specGroups: product.slug === "terrifit-v1" ? copy.band.specsSection.groups : null,
        stock: product.stock,
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
          price: price(variant.priceCents ?? product.priceCents),
        })),
      })),
    },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
