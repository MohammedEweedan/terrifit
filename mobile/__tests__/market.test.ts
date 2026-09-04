import { currencyForCountry, findAppCurrency, formatMoney } from "../src/market";

describe("market preferences", () => {
  it("maps supported countries to their expected checkout currency", () => {
    expect(currencyForCountry("US")).toBe("USD");
    expect(currencyForCountry("GB")).toBe("GBP");
    expect(currencyForCountry("DE")).toBe("EUR");
    expect(currencyForCountry("AE")).toBe("AED");
  });

  it("uses USD when a market has no supported local presentment currency", () => {
    expect(currencyForCountry("QA")).toBe("USD");
  });

  it("does not divide zero-decimal currencies by 100", () => {
    expect(findAppCurrency("JPY").decimals).toBe(0);
    expect(formatMoney(1500, "JPY", "en")).toContain("1,500");
  });
});

