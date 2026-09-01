"use client";

import Link from "next/link";
import type { Locale } from "@/i18n/config";
import { getPagesCopy } from "@/i18n/pages";
import { useCart } from "@/lib/shop/cart";
import { lineImage } from "@/lib/shop/catalog";
import { formatMoney } from "@/lib/shop/money";
import { Shot } from "@/components/ui/Shot";

/**
 * The editable list of what is in the bag.
 *
 * Shared by the slide-over drawer and the `/shop/cart` route so the two can
 * never show different quantities or a different subtotal.
 */
export function CartLines({ locale, compact = false }: { locale: Locale; compact?: boolean }) {
  const cart = useCart();
  const copy = getPagesCopy(locale).shop;

  return (
    <ul className={`sh-lines ${compact ? "is-compact" : ""}`}>
      {cart.lines.map((line) => {
        const shot = lineImage(line.product, line.variantId);
        return (
        <li key={line.key}>
          <Link className="sh-line-media" href={`/${locale}/shop/${line.product.slug}`}>
            <Shot
              src={shot.src}
              alt={shot.alt}
              ratio={1}
              sizes="96px"
              fit="contain"
              fallback={{ label: line.product.name }}
            />
          </Link>
          <div className="sh-line-body">
            <Link href={`/${locale}/shop/${line.product.slug}`}>
              <strong>{line.product.name}</strong>
            </Link>
            {line.variant ? <span>{line.variant.label}</span> : null}
            {line.subscribe ? <em>{copy.cart.subscription}</em> : null}
            <div className="sh-line-controls">
              <div className="sh-qty" role="group" aria-label={copy.product.quantity}>
                <button
                  type="button"
                  onClick={() => cart.setQty(line.key, line.quantity - 1)}
                  aria-label="−"
                >
                  −
                </button>
                <span className="numeric">{line.quantity}</span>
                <button
                  type="button"
                  onClick={() => cart.setQty(line.key, line.quantity + 1)}
                  aria-label="+"
                  disabled={line.quantity >= 20}
                >
                  +
                </button>
              </div>
              <button type="button" className="sh-remove" onClick={() => cart.remove(line.key)}>
                {copy.cart.remove}
              </button>
            </div>
          </div>
          <div className="sh-line-price">
            <strong className="numeric">{formatMoney(line.lineCents, locale)}</strong>
            {line.quantity > 1 ? (
              <small className="numeric">
                {formatMoney(line.unitCents, locale)} {copy.cart.each}
              </small>
            ) : null}
          </div>
        </li>
        );
      })}
    </ul>
  );
}
