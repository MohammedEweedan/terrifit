import { describe, expect, it } from "vitest";
import { swatchColours, V1_COLOURWAYS } from "../catalog";

describe("V1 colourways", () => {
  it("exposes both woven yarn colours to native clients", () => {
    expect(
      V1_COLOURWAYS.map((colourway) => ({
        id: colourway.id,
        colours: swatchColours(colourway.swatch),
      })),
    ).toEqual([
      { id: "ember", colours: ["#0b0b0b", "#ff4d16"] },
      { id: "black", colours: ["#050505", "#242424"] },
      { id: "graphite", colours: ["#33373c", "#a7adb4"] },
      { id: "midnight", colours: ["#0d0f12", "#1f2e4d"] },
      { id: "bubblegum", colours: ["#ff5fa8", "#f4eee9"] },
    ]);
  });
});
