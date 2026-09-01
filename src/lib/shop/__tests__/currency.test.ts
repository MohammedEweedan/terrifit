import assert from "node:assert/strict";
import { describe, it } from "vitest";
import {
  BASE_CURRENCY, CURRENCIES, currencyForLocale, findCurrency, formatIn, priceIn,
} from "../currency";

const usd = findCurrency("USD")!;
const gbp = findCurrency("GBP")!;
const jpy = findCurrency("JPY")!;
const sek = findCurrency("SEK")!;

describe("priceIn", () => {
  it("leaves the base currency exactly as the catalogue holds it", () => {
    assert.equal(priceIn(22900, usd), 22900);
    assert.equal(priceIn(499, usd), 499);
  });

  it("returns minor units on the currency's own scale, not always hundredths", () => {
    // $229 at ~150 is ¥34,350 → rounded up to ¥34,400. Yen has no decimals, so
    // the answer is 34400, NOT 3440000. Getting this wrong overcharges 100×.
    const amount = priceIn(22900, jpy);
    assert.equal(amount, 34400);
    assert.ok(amount < 100_000, `yen amount looks scaled by 100: ${amount}`);
  });

  it("rounds to a charm price rather than a converted-looking one", () => {
    // $229 × 0.79 = £180.91 → £180.99, not £180.91.
    assert.equal(priceIn(22900, gbp), 18099);
    // $4.99 × 0.79 = £3.94 → £3.99.
    assert.equal(priceIn(499, gbp), 399);
  });

  it("rounds krona to a whole ten", () => {
    // $229 × 10.5 = 2404.5 → 2410 kr.
    assert.equal(priceIn(22900, sek), 241000);
  });

  it("never returns a free or negative price for a cheap item", () => {
    for (const currency of CURRENCIES) {
      const amount = priceIn(99, currency);
      assert.ok(amount > 0, `${currency.code} priced a $0.99 item at ${amount}`);
    }
  });

  it("is monotonic — a dearer item is never cheaper after conversion", () => {
    for (const currency of CURRENCIES) {
      const cheap = priceIn(2900, currency);
      const dear = priceIn(22900, currency);
      assert.ok(dear > cheap, `${currency.code}: ${dear} not above ${cheap}`);
    }
  });
});

describe("formatIn", () => {
  it("does not divide a zero-decimal currency by 100", () => {
    // ¥34,400 must render as ¥34,400, not ¥344.
    const text = formatIn(34400, jpy, "en-GB");
    assert.ok(text.includes("34,400"), text);
  });

  it("renders a whole price without trailing zeros", () => {
    assert.equal(formatIn(18099, gbp, "en-GB"), "£180.99");
    assert.equal(formatIn(18100, gbp, "en-GB"), "£181");
  });
});

describe("the currency table", () => {
  it("has the base currency in it, at rate 1", () => {
    const base = findCurrency(BASE_CURRENCY);
    assert.ok(base);
    assert.equal(base.rate, 1);
  });

  it("has no duplicate codes", () => {
    const codes = CURRENCIES.map((currency) => currency.code);
    assert.equal(new Set(codes).size, codes.length);
  });

  it("gives every locale a currency we actually sell in", () => {
    for (const locale of ["en", "es", "fr", "de", "it", "nl", "pt", "tr", "ar", "ru"] as const) {
      const currency = currencyForLocale(locale);
      assert.ok(findCurrency(currency.code), `${locale} maps to unknown ${currency.code}`);
    }
  });

  it("only marks yen-like currencies as zero-decimal", () => {
    const zero = CURRENCIES.filter((currency) => currency.decimals === 0).map((c) => c.code);
    // ISO 4217 zero-decimal currencies we sell in. Adding one here without
    // checking the standard is how a 100× overcharge ships.
    assert.deepEqual(zero, ["JPY"]);
  });
});
