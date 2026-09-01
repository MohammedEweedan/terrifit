import { duration, plural, sourceName, weight } from "../src/format";

describe("duration", () => {
  it("formats hours and minutes", () => {
    expect(duration(443)).toBe("7h 23m");
  });

  it("drops the hour when there isn't one", () => {
    expect(duration(45)).toBe("45m");
  });

  it("pads the minutes so times line up in a column", () => {
    expect(duration(425)).toBe("7h 05m");
  });

  it("has nothing to say about no reading", () => {
    expect(duration(null)).toBe("—");
  });
});

describe("weight", () => {
  it("keeps kilos in metric", () => {
    expect(weight(84.3, "metric")).toBe("84.3 kg");
  });

  it("converts to pounds in imperial", () => {
    expect(weight(100, "imperial")).toBe("220.5 lb");
  });
});

describe("plural", () => {
  it("keeps the singular at one", () => {
    expect(plural(1, "day")).toBe("1 day");
  });

  it("pluralises everything else, zero included", () => {
    expect(plural(0, "day")).toBe("0 days");
    expect(plural(3, "day")).toBe("3 days");
  });
});

describe("sourceName", () => {
  it("names the sources people recognise", () => {
    expect(sourceName("apple_health")).toBe("Apple Health");
    expect(sourceName("inbody")).toBe("InBody");
  });

  it("makes an unknown key readable rather than showing the key", () => {
    expect(sourceName("some_new_tracker")).toBe("Some New Tracker");
  });
});
