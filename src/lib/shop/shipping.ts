/**
 * Shipping and tax, in one place because checkout, the cart drawer and the
 * order confirmation all have to arrive at the same number. The server route
 * recomputes totals with these same functions — the browser's arithmetic is
 * only ever a preview.
 */
export const FREE_SHIPPING_THRESHOLD_CENTS = 7500;
export const STANDARD_SHIPPING_CENTS = 900;

export function shippingCents(subtotalCents: number, physical: boolean): number {
  // A membership-only order has nothing to post.
  if (!physical) return 0;
  return subtotalCents >= FREE_SHIPPING_THRESHOLD_CENTS ? 0 : STANDARD_SHIPPING_CENTS;
}

/**
 * A flat estimate, shown as an estimate. Real destination-based rates need a
 * tax provider; quoting a confident wrong number is worse than saying so.
 */
export const ESTIMATED_TAX_RATE = 0.05;

export function taxCents(subtotalCents: number): number {
  return Math.round(subtotalCents * ESTIMATED_TAX_RATE);
}

export function orderTotalCents(subtotalCents: number, physical: boolean): {
  subtotalCents: number;
  shippingCents: number;
  taxCents: number;
  totalCents: number;
} {
  const shipping = shippingCents(subtotalCents, physical);
  const tax = taxCents(subtotalCents);
  return {
    subtotalCents,
    shippingCents: shipping,
    taxCents: tax,
    totalCents: subtotalCents + shipping + tax,
  };
}
