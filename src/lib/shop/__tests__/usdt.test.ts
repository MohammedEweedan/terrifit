import { afterEach, describe, expect, it, vi } from "vitest";
import { isTronAddress, usdtAmountDue, usdtWallet } from "../usdt";

describe("Tron address validation", () => {
  it("accepts the configured mainnet wallet", () => {
    expect(isTronAddress("TB8G1EfBDDVoxBpE8Q5zDfDow5fWPBote2")).toBe(true);
  });

  it("rejects addresses that would silently swallow real money", () => {
    for (const bad of [
      "",
      "TB8G1EfBDDVoxBpE8Q5zDfDow5fWPBote",           // a character short
      "TB8G1EfBDDVoxBpE8Q5zDfDow5fWPBote22",         // a character long
      "0x2170Ed0880ac9A755fd29B2688956BD959F933F8",  // Ethereum, wrong chain
      "TB8G1EfBDDVoxBpE8Q5zDfDow5fWPB0te2",          // base58 excludes 0
      "TB8G1EfBDDVoxBpE8Q5zDfDow5fWPBOte2",          // and O
      "bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq",  // Bitcoin
    ]) {
      expect(isTronAddress(bad), bad).toBe(false);
    }
  });
});

describe("usdtWallet", () => {
  const original = process.env.USDT_TRC20_ADDRESS;
  afterEach(() => {
    if (original === undefined) delete process.env.USDT_TRC20_ADDRESS;
    else process.env.USDT_TRC20_ADDRESS = original;
    vi.restoreAllMocks();
  });

  it("is null when unset, which keeps the rail off the checkout", () => {
    delete process.env.USDT_TRC20_ADDRESS;
    expect(usdtWallet()).toBeNull();
  });

  it("refuses a malformed address rather than offering it to customers", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    process.env.USDT_TRC20_ADDRESS = "TB8G1EfBDDVoxBpE8Q5zDfDow5fWPBote";
    expect(usdtWallet()).toBeNull();
    expect(error).toHaveBeenCalled();
  });

  it("returns a valid address, trimmed", () => {
    process.env.USDT_TRC20_ADDRESS = "  TB8G1EfBDDVoxBpE8Q5zDfDow5fWPBote2  ";
    expect(usdtWallet()).toBe("TB8G1EfBDDVoxBpE8Q5zDfDow5fWPBote2");
  });
});

describe("amount owed in USDT", () => {
  it("is the dollar total for USD orders", () => {
    expect(usdtAmountDue(24_000, "USD")).toBe(240);
    expect(usdtAmountDue(7_500, "USD")).toBe(75);
  });

  it("reverses the currency anchor for other currencies", () => {
    // GBP is anchored at 0.79 to the dollar, so £189.60 is a $240 order.
    expect(usdtAmountDue(18_960, "GBP")).toBeCloseTo(240, 2);
  });

  it("treats zero-decimal currencies as whole units, not cents", () => {
    // JPY has no minor unit: 36000 is ¥36,000, anchored at 150 = $240.
    expect(usdtAmountDue(36_000, "JPY")).toBe(240);
  });

  it("never rounds down, which would leave orders a cent short forever", () => {
    // 1000/3 = 333.333…; collecting 333.33 would leave the order unsettled.
    const due = usdtAmountDue(100_000, "TRY"); // anchored at 34
    expect(due).toBe(Math.ceil((1000 / 34) * 100) / 100);
    expect(due).toBeGreaterThanOrEqual(1000 / 34);
  });

  it("falls back to a 1:1 rate for an unknown currency rather than throwing", () => {
    expect(usdtAmountDue(5_000, "XYZ")).toBe(50);
  });
});
