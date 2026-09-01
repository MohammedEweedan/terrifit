"use client";

import Link from "next/link";
import type { Locale } from "@/i18n/config";
import { getPagesCopy } from "@/i18n/pages";
import { Shot } from "@/components/ui/Shot";
import { useCart } from "@/lib/shop/cart";
import { formatMoney } from "@/lib/shop/money";
import { lineImage, recommendationsFor } from "@/lib/shop/catalog";

/**
 * What to add before checking out.
 *
 * Shown inside the bag rather than after it, because the moment someone has
 * committed to the band is the moment a spare strap or a charger is genuinely
 * useful — and it is the last point where adding one costs them nothing extra
 * in shipping.
 */
export function CartRecommendations({ locale }: { locale: Locale }) {
  const cart = useCart();
  const copy = getPagesCopy(locale).shop;
  const suggestions = recommendationsFor(cart.lines.map((line) => line.product.slug), 3);

  if (cart.lines.length === 0 || suggestions.length === 0) return null;

  return (
    <div className="sh-recommend">
      <h3>{copy.cart.recommendTitle}</h3>
      <ul>
        {suggestions.map((product) => (
          <li key={product.slug}>
            <Link href={`/${locale}/shop/${product.slug}`} onClick={cart.closeDrawer}>
              <Shot
                src={lineImage(product).src}
                alt={lineImage(product).alt}
                ratio={1}
                sizes="52px"
                fit="contain"
                fallback={{ label: product.name }}
              />
            </Link>
            <div>
              <strong>{product.name}</strong>
              <span className="numeric">{formatMoney(product.priceCents, locale)}</span>
            </div>
            {/* Anything with options has to be opened — adding a random size
                from a strip is how returns happen. */}
            {product.variants.length > 1 ? (
              <Link className="sh-recommend-add" href={`/${locale}/shop/${product.slug}`} onClick={cart.closeDrawer}>
                {copy.viewProduct}
              </Link>
            ) : (
              <button
                type="button"
                className="sh-recommend-add"
                onClick={() => cart.add({ slug: product.slug, variantId: product.variants[0]?.id, quantity: 1 })}
              >
                {copy.cart.recommendAdd}
              </button>
            )}
          </li>
        ))}
      </ul>

      <div className="sh-recommend-maps">
        <strong>{copy.cart.mapsTitle}</strong>
        <p>{copy.cart.mapsBody}</p>
        <Link href={`/${locale}/maps`} onClick={cart.closeDrawer}>
          {copy.cart.mapsCta} <span aria-hidden>→</span>
        </Link>
      </div>
    </div>
  );
}
