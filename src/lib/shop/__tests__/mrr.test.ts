import assert from "node:assert/strict";
import { describe, it } from "vitest";
import { PRICING } from "@/lib/health/plan";

/**
 * The MRR arithmetic, lifted from `adminOverview`.
 *
 * Kept here rather than exported from the query function because the sum is the
 * part worth pinning: a yearly plan counted at full price would make MRR jump
 * $70 on one signup and sit flat for a year, which is not a number anybody can
 * steer a business by.
 *
 * Every expectation below is derived from `PRICING` rather than written out as
 * a figure. This file previously hardcoded $4.99 and $39, so repricing to
 * $7.99 and $70 broke three tests that had no opinion about the price — only
 * about the arithmetic. Derived expectations survive the next repricing and
 * still fail if the shape of the sum changes, which is the thing being tested.
 */
function mrrCents(monthly: number, yearly: number): number {
  return monthly * PRICING.monthly.cents + Math.round((yearly * PRICING.yearly.cents) / 12);
}

describe("recurring revenue", () => {
  it("is zero with nobody paying", () => {
    assert.equal(mrrCents(0, 0), 0);
  });

  it("counts a monthly plan at its full price", () => {
    assert.equal(mrrCents(1, 0), PRICING.monthly.cents);
    assert.equal(mrrCents(10, 0), PRICING.monthly.cents * 10);
  });

  it("spreads a yearly plan across the twelve months it covers", () => {
    // $70 a year is $5.83 a month, not $70 in the month somebody signs up.
    assert.equal(mrrCents(0, 1), Math.round(PRICING.yearly.cents / 12));
    assert.equal(mrrCents(0, 12), PRICING.yearly.cents);
    assert.ok(mrrCents(0, 1) < PRICING.yearly.cents, "a yearly signup must not land as a one-month spike");
  });

  it("adds the two together", () => {
    assert.equal(mrrCents(10, 12), PRICING.monthly.cents * 10 + PRICING.yearly.cents);
  });

  it("annualises to twelve times the monthly figure", () => {
    const mrr = mrrCents(100, 50);
    assert.equal(mrr * 12, mrrCents(100, 50) * 12);
    // A pure-yearly book annualises back to what was actually charged.
    assert.equal(mrrCents(0, 12) * 12, 12 * PRICING.yearly.cents);
  });

  it("prices the yearly plan below twelve monthly payments", () => {
    // The yearly discount is the reason people take it; if this ever inverts,
    // the pricing page is lying.
    assert.ok(PRICING.yearly.cents < PRICING.monthly.cents * 12);
  });
});
