import { distance, height, temperature, toCm, toKg, weight } from "../src/units";

describe("weight", () => {
  it("shows kilograms unchanged", () => {
    expect(weight(84.3, "metric")).toBe("84.3 kg");
  });
  it("converts to pounds", () => {
    expect(weight(84.3, "imperial")).toBe("185.8 lb");
  });
  it("has no reading rather than a zero", () => {
    expect(weight(null, "metric")).toBe("—");
  });
});

describe("height", () => {
  it("shows whole centimetres", () => {
    expect(height(180, "metric")).toBe("180 cm");
  });
  it("splits into feet and inches", () => {
    expect(height(180, "imperial")).toBe("5 ft 11 in");
  });
  it("carries rounded inches instead of printing 12", () => {
    // 182.7 cm is 71.93 in — rounds to 72, which must read as 6 ft 0 in.
    expect(height(182.7, "imperial")).toBe("6 ft 0 in");
  });
});

describe("distance", () => {
  it("uses metres under a kilometre", () => {
    expect(distance(640, "metric")).toBe("640 m");
  });
  it("uses kilometres above one", () => {
    expect(distance(5200, "metric")).toBe("5.2 km");
  });
  it("uses miles, and feet for very short runs", () => {
    expect(distance(5200, "imperial")).toBe("3.2 mi");
    expect(distance(60, "imperial")).toBe("197 ft");
  });
});

describe("temperature", () => {
  it("converts to Fahrenheit", () => {
    expect(temperature(36.6, "imperial")).toBe("97.9 °F");
    expect(temperature(36.6, "metric")).toBe("36.6 °C");
  });
});

describe("input conversion", () => {
  it("round-trips a weight typed in pounds", () => {
    const kg = toKg(185.8, "imperial");
    expect(weight(kg, "imperial")).toBe("185.8 lb");
  });
  it("leaves metric input alone", () => {
    expect(toKg(84.3, "metric")).toBe(84.3);
    expect(toCm(180, "metric")).toBe(180);
  });
  it("converts inches to centimetres", () => {
    expect(toCm(71, "imperial")).toBeCloseTo(180.34, 2);
  });
});
