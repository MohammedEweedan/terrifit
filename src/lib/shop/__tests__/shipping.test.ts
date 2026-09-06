import assert from "node:assert/strict";
import { describe, it } from "vitest";
import {
  ESTIMATED_TAX_RATE,
  FREE_SHIPPING_THRESHOLD_CENTS,
  STANDARD_SHIPPING_CENTS,
  orderTotalCents,
  shippingCents,
  taxCents,
} from "../shipping";

/**
 * The money at the bottom of the bag.
 *
 * Every one of these numbers is shown to somebody before they are charged, and
 * the cart drawer, the checkout page and the server route all reach them through
 * these three functions. A discrepancy between the previewed total and the
 * charged one is the single worst bug this codebase can ship, so the arithmetic
 * is pinned here rather than left to be noticed in production.
 *
 * The thresholds themselves are imported rather than written out: this file has
 * an opinion about the *rules*, not about where the free-shipping bar happens to
 * sit this quarter.
 */

describe("shipping", () => {
  it("charges the flat rate below the threshold", () => {
    assert.equal(shippingCents(FREE_SHIPPING_THRESHOLD_CENTS - 1, true), STANDARD_SHIPPING_CENTS);
    assert.equal(shippingCents(0, true), STANDARD_SHIPPING_CENTS);
  });

  it("is free at the threshold, not a cent above it", () => {
    // Off-by-one here means somebody who spent exactly the advertised amount is
    // charged postage anyway, which reads as a bait and switch.
    assert.equal(shippingCents(FREE_SHIPPING_THRESHOLD_CENTS, true), 0);
    assert.equal(shippingCents(FREE_SHIPPING_THRESHOLD_CENTS + 1, true), 0);
  });

  it("posts nothing for an order with nothing physical in it", () => {
    // A membership on its own has no parcel, so it cannot carry postage.
    assert.equal(shippingCents(100, false), 0);
    assert.equal(shippingCents(FREE_SHIPPING_THRESHOLD_CENTS - 1, false), 0);
  });

  it("never returns a negative or fractional amount", () => {
    for (const subtotal of [0, 1, 999, 7499, 7500, 250000]) {
      const value = shippingCents(subtotal, true);
      assert.ok(Number.isInteger(value) && value >= 0, `shipping ${value} for subtotal ${subtotal}`);
    }
  });
});

describe("tax", () => {
  it("is a whole number of cents", () => {
    // A fractional cent reaching Stripe is a rejected PaymentIntent.
    for (const subtotal of [1, 7, 33, 999, 12345, 999999]) {
      assert.ok(Number.isInteger(taxCents(subtotal)), `${subtotal} produced a fraction`);
    }
  });

  it("applies the stated estimate", () => {
    assert.equal(taxCents(10000), Math.round(10000 * ESTIMATED_TAX_RATE));
    assert.equal(taxCents(0), 0);
  });
});

describe("order totals", () => {
  it("sums to exactly its own parts", () => {
    // The receipt shows the three lines and the total. If they disagree, one of
    // the four numbers on screen is a lie.
    for (const [subtotal, physical] of [[4990, true], [7500, true], [1999, false], [0, true]] as const) {
      const totals = orderTotalCents(subtotal, physical);
      assert.equal(
        totals.totalCents,
        totals.subtotalCents + totals.shippingCents + totals.taxCents,
        `total disagrees with its parts at ${subtotal}`,
      );
    }
  });

  it("passes the subtotal through untouched", () => {
    assert.equal(orderTotalCents(4990, true).subtotalCents, 4990);
  });

  it("taxes the goods, not the postage", () => {
    // Tax is computed from the subtotal alone. Taxing shipping too would make a
    // £9 postage line quietly cost more than £9.
    const under = orderTotalCents(FREE_SHIPPING_THRESHOLD_CENTS - 100, true);
    const over = orderTotalCents(FREE_SHIPPING_THRESHOLD_CENTS - 100, false);
    assert.equal(under.taxCents, over.taxCents);
    assert.equal(under.totalCents - over.totalCents, STANDARD_SHIPPING_CENTS);
  });

  it("is never cheaper to add postage", () => {
    // Guards the crossing point: spending a little more to clear the threshold
    // must never leave the customer paying more overall than spending less.
    const justUnder = orderTotalCents(FREE_SHIPPING_THRESHOLD_CENTS - 1, true);
    const atBar = orderTotalCents(FREE_SHIPPING_THRESHOLD_CENTS, true);
    assert.ok(
      atBar.totalCents <= justUnder.totalCents,
      `clearing the threshold cost more: ${atBar.totalCents} vs ${justUnder.totalCents}`,
    );
  });

  it("charges nothing for an empty bag", () => {
    assert.equal(orderTotalCents(0, false).totalCents, 0);
  });
});
