"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import type { Locale } from "@/i18n/config";
import { getPagesCopy } from "@/i18n/pages";
import { useOptionalCart } from "@/lib/shop/cart";
import { formatMoney } from "@/lib/shop/money";
import { FREE_SHIPPING_THRESHOLD_CENTS } from "@/lib/shop/shipping";
import { CartLines } from "@/components/shop/CartLines";
import { CartRecommendations } from "@/components/shop/CartRecommendations";

/**
 * The slide-over bag.
 *
 * Mounted once in the locale layout so adding something from the band page, a
 * product page or the shop grid all open the same panel and the customer never
 * loses their place. The full `/shop/cart` route renders the same `CartLines`,
 * so the two surfaces cannot disagree about what is in the bag.
 */
export function CartDrawer({ locale }: { locale: Locale }) {
  const cart = useOptionalCart();
  const copy = getPagesCopy(locale).shop.cart;
  if (!cart) return null;

  const remaining = FREE_SHIPPING_THRESHOLD_CENTS - cart.subtotalCents;

  return (
    <AnimatePresence>
      {cart.drawerOpen ? (
        <motion.div
          className="sh-drawer-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={cart.closeDrawer}
        >
          <motion.aside
            className="sh-drawer"
            role="dialog"
            aria-modal="true"
            aria-label={copy.title}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            onClick={(event) => event.stopPropagation()}
          >
            <header className="sh-drawer-head">
              <h2>
                {copy.title}
                {cart.count > 0 ? (
                  <span className="numeric">
                    {cart.count} {cart.count === 1 ? copy.item : copy.items}
                  </span>
                ) : null}
              </h2>
              <button type="button" onClick={cart.closeDrawer} aria-label={copy.close}>
                ×
              </button>
            </header>

            {cart.lines.length === 0 ? (
              <div className="sh-drawer-empty">
                <p>{copy.empty}</p>
                <span>{copy.emptyBody}</span>
                <Link className="sh-button" href={`/${locale}/band`} onClick={cart.closeDrawer}>
                  {copy.emptyCta}
                </Link>
              </div>
            ) : (
              <>
                <div className="sh-drawer-body">
                  {remaining > 0 ? (
                    <p className="sh-shipping-nudge">
                      <b className="numeric">{formatMoney(remaining, locale)}</b>{" "}
                      {copy.freeShippingProgress}
                    </p>
                  ) : (
                    <p className="sh-shipping-nudge is-met">{copy.freeShippingReached}</p>
                  )}
                  <CartLines locale={locale} compact />
                  <CartRecommendations locale={locale} />
                </div>
                <footer className="sh-drawer-foot">
                  <div className="sh-total-row">
                    <span>{copy.subtotal}</span>
                    <strong className="numeric">{formatMoney(cart.subtotalCents, locale)}</strong>
                  </div>
                  <p className="sh-total-note">{copy.shippingAt}</p>
                  <Link
                    className="sh-button sh-button-block"
                    href={`/${locale}/shop/checkout`}
                    onClick={cart.closeDrawer}
                  >
                    {copy.checkout}
                  </Link>
                  <Link
                    className="sh-text-link"
                    href={`/${locale}/shop/cart`}
                    onClick={cart.closeDrawer}
                  >
                    {copy.viewBag}
                  </Link>
                </footer>
              </>
            )}
          </motion.aside>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
