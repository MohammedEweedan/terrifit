"use client";

import Link from "next/link";
import type { Locale } from "@/i18n/config";
import type { PagesCopy } from "@/i18n/pages";
import { useCart } from "@/lib/shop/cart";
import { formatMoney } from "@/lib/shop/money";
import { FREE_SHIPPING_THRESHOLD_CENTS, orderTotalCents } from "@/lib/shop/shipping";
import { CartLines } from "@/components/shop/CartLines";

/** The bag as a page. Bookmarkable, and what someone sees if the drawer never hydrates. */
export function CartView({ locale, copy }: { locale: Locale; copy: PagesCopy["shop"] }) {
  const cart = useCart();
  const hasPhysical = cart.lines.some((line) => line.product.fulfilment === "ship");
  const totals = orderTotalCents(cart.subtotalCents, hasPhysical);
  const remaining = FREE_SHIPPING_THRESHOLD_CENTS - cart.subtotalCents;

  if (cart.ready && cart.lines.length === 0) {
    return (
      <div className="sh-page">
        <div className="tf-shell sh-cart-empty">
          <h1>{copy.cart.title}</h1>
          <p>{copy.cart.empty}</p>
          <span>{copy.cart.emptyBody}</span>
          <Link className="sh-button" href={`/${locale}/band`}>
            {copy.cart.emptyCta}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="sh-page">
      <div className="tf-shell">
        <h1>{copy.cart.title}</h1>
        <div className="sh-cart-layout">
          <div className="sh-cart-items">
            <CartLines locale={locale} />
          </div>

          <aside className="sh-summary">
            <h2>{copy.checkout.summaryTitle}</h2>
            <dl>
              <div>
                <dt>{copy.cart.subtotal}</dt>
                <dd className="numeric">{formatMoney(totals.subtotalCents, locale)}</dd>
              </div>
              {cart.savingsCents > 0 ? (
                <div className="is-saving">
                  <dt>{copy.cart.savings}</dt>
                  <dd className="numeric">−{formatMoney(cart.savingsCents, locale)}</dd>
                </div>
              ) : null}
              <div>
                <dt>{copy.cart.shipping}</dt>
                <dd className="numeric">
                  {totals.shippingCents === 0 ? copy.cart.shippingFree : formatMoney(totals.shippingCents, locale)}
                </dd>
              </div>
              <div>
                <dt>{copy.checkout.tax}</dt>
                <dd className="numeric">{formatMoney(totals.taxCents, locale)}</dd>
              </div>
              <div className="is-total">
                <dt>{copy.cart.total}</dt>
                <dd className="numeric">{formatMoney(totals.totalCents, locale)}</dd>
              </div>
            </dl>
            <p className="sh-tax-note">{copy.checkout.taxNote}</p>

            {hasPhysical && remaining > 0 ? (
              <p className="sh-shipping-nudge">
                <b className="numeric">{formatMoney(remaining, locale)}</b> {copy.cart.freeShippingProgress}
              </p>
            ) : null}

            <Link className="sh-button sh-button-block" href={`/${locale}/shop/checkout`}>
              {copy.cart.checkout}
            </Link>
            <Link className="sh-text-link" href={`/${locale}/shop`}>
              {copy.cart.continue}
            </Link>
          </aside>
        </div>
      </div>
    </div>
  );
}
