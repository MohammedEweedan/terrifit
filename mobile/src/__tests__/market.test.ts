import { countryName, fallbackCountryName, MARKET_CODES } from "../market";

/**
 * The regression this guards: `countryName` relied on `Intl.DisplayNames`,
 * which Hermes does not provide. It caught its own exception and returned the
 * ISO code, so the market row read "EG · EG" instead of naming the country —
 * a silent failure that looked like a rendering bug.
 *
 * Node *does* have `Intl.DisplayNames`, so `countryName` here takes the branch
 * that was never broken. The bundled table is therefore tested directly: that
 * is the code path the phone actually runs.
 */
describe("the bundled table, which is what the device uses", () => {
  it("names a country rather than echoing its code", () => {
    expect(fallbackCountryName("EG", "en-GB")).toBe("Egypt");
    expect(fallbackCountryName("AE", "en-GB")).toBe("United Arab Emirates");
    expect(fallbackCountryName("JP", "en-GB")).toBe("Japan");
  });

  it("names it in Arabic for Arabic", () => {
    expect(fallbackCountryName("EG", "ar")).toBe("مصر");
    expect(fallbackCountryName("SA", "ar")).toBe("السعودية");
  });

  it("covers every market we sell to, in both bundled languages", () => {
    for (const code of MARKET_CODES) {
      for (const locale of ["en-GB", "ar"]) {
        const name = fallbackCountryName(code, locale);
        expect(name).not.toBe(code);
        expect(name.length).toBeGreaterThan(2);
      }
    }
  });

  it("returns the code for something genuinely unknown", () => {
    expect(fallbackCountryName("ZZ", "en-GB")).toBe("ZZ");
  });
});

describe("countryName", () => {
  it("never gives back the bare code for a supported market", () => {
    for (const code of MARKET_CODES) {
      expect(countryName(code, "en-GB")).not.toBe(code);
    }
  });

  it("prefers a localised name where the runtime can provide one", () => {
    // Node can, so this asserts the Intl branch is actually reached rather
    // than being dead code behind a try/catch.
    expect(countryName("DE", "de")).toBe("Deutschland");
  });
});
