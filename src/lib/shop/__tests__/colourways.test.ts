import { describe, expect, it } from "vitest";
import { swatchColours, V1_COLOURWAYS } from "../catalog";
import { BAND_FINISHES } from "@/components/band/colourways";

/**
 * These used to assert one frozen list of five colourways, so adding Stone and
 * Olive to the catalogue broke a test that had no opinion about how many
 * colourways exist — only about the shape of each one. The contract is
 * asserted instead, with spot checks on the two finishes whose palette is part
 * of the brand.
 */
describe("V1 colourways", () => {
  it("exposes exactly two woven yarn colours to native clients", () => {
    for (const colourway of V1_COLOURWAYS) {
      const colours = swatchColours(colourway.swatch);
      expect(colours, `${colourway.id} swatch`).toHaveLength(2);
      for (const colour of colours) expect(colour).toMatch(/^#[0-9a-f]{6}$/i);
      // One colour twice is a flat dye, not the two-yarn weave the product is.
      expect(new Set(colours).size, `${colourway.id} yarns are identical`).toBe(2);
    }
  });

  it("keeps the flagship palettes fixed", () => {
    const of = (id: string) => swatchColours(V1_COLOURWAYS.find((c) => c.id === id)!.swatch);
    expect(of("ember")).toEqual(["#0b0b0b", "#ff4d16"]);
    expect(of("black")).toEqual(["#050505", "#242424"]);
  });

  it("gives every id a distinct label", () => {
    expect(new Set(V1_COLOURWAYS.map((c) => c.id)).size).toBe(V1_COLOURWAYS.length);
    expect(new Set(V1_COLOURWAYS.map((c) => c.sku)).size).toBe(V1_COLOURWAYS.length);
  });

  /**
   * The 3D viewer looks a finish up by the catalogue's id and falls back to
   * `BAND_FINISHES[0]` — Ember — when it misses. So an id in the shop with no
   * matching finish does not error: it silently renders the wrong colour.
   * Selecting Stone showed an Ember band, which is exactly the failure this
   * pins down.
   */
  it("has a 3D finish for every colourway the shop sells", () => {
    // Widened: BAND_FINISHES is const-asserted, so an un-annotated Set
    // narrows to the literal union and rejects a lookup by plain string.
    const finishes = new Set<string>(BAND_FINISHES.map((finish) => finish.id));
    const orphans = V1_COLOURWAYS.map((c) => c.id).filter((id) => !finishes.has(id));
    expect(orphans, "shop colourways with no 3D finish — these render as Ember").toEqual([]);
  });
});
