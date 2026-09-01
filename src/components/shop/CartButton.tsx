"use client";

import Link from "next/link";
import type { Locale } from "@/i18n/config";
import { getPagesCopy } from "@/i18n/pages";
import { useOptionalCart } from "@/lib/shop/cart";

/**
 * The bag indicator in the site header.
 *
 * It stays out of the way until there is something in it: an empty bag icon on
 * a marketing landing page is noise, and the header is already dense with a
 * locale switcher, sign-in and the waitlist CTA. Once the bag has contents it
 * appears everywhere, because someone mid-purchase needs to find it from any
 * page they wander onto.
 *
 * Rendered outside a CartProvider it renders nothing rather than throwing, so
 * the header stays usable on any route that has not opted into the shop.
 */
export function CartButton({ locale }: { locale: Locale }) {
  const cart = useOptionalCart();
  const copy = getPagesCopy(locale).shop.cart;

  if (!cart || !cart.ready || cart.count === 0) return null;

  return (
    <button
      type="button"
      className="tf-cart-button"
      onClick={cart.openDrawer}
      aria-label={`${copy.open} — ${cart.count}`}
    >
      <BagIcon />
      <span className="tf-cart-count numeric">{cart.count}</span>
    </button>
  );
}

/** The same control as a link, for surfaces with no drawer (the shop header). */
export function CartLink({ locale, label }: { locale: Locale; label: string }) {
  const cart = useOptionalCart();
  return (
    <Link className="tf-cart-button" href={`/${locale}/shop/cart`} aria-label={label}>
      <BagIcon />
      {cart && cart.ready && cart.count > 0 ? (
        <span className="tf-cart-count numeric">{cart.count}</span>
      ) : null}
    </Link>
  );
}

function BagIcon() {
  return (
    <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M4.5 7.5h15l-1.2 12a1.5 1.5 0 0 1-1.5 1.35H7.2A1.5 1.5 0 0 1 5.7 19.5z" strokeLinejoin="round" />
      <path d="M8.75 10V6.5a3.25 3.25 0 0 1 6.5 0V10" strokeLinecap="round" />
    </svg>
  );
}
