import assert from "node:assert/strict";
import { describe, it } from "vitest";
import {
  parseGetAddress, parseIdealPostcodes, parseNominatim, parsePostcodesIo,
} from "../address";

describe("parseNominatim", () => {
  it("reports exact when a row carries a house number", () => {
    const result = parseNominatim(
      [
        { address: { house_number: "126", road: "Corporation Street", city: "Coventry", state: "England", postcode: "CV1 1GU" } },
        { address: { house_number: "128", road: "Corporation Street", city: "Coventry", state: "England", postcode: "CV1 1GU" } },
      ],
      "CV11GU",
    );
    assert.equal(result.precision, "exact");
    assert.equal(result.addresses.length, 2);
    assert.equal(result.addresses[0].line1, "126 Corporation Street");
    assert.equal(result.addresses[0].city, "Coventry");
    assert.equal(result.addresses[0].postal, "CV1 1GU");
    assert.equal(result.addresses[0].label, "126 Corporation Street, Coventry");
  });

  it("reports street when OSM only knows the road", () => {
    const result = parseNominatim(
      [{ address: { road: "Corporation Street", town: "Coventry", county: "West Midlands" } }],
      "CV11GU",
    );
    assert.equal(result.precision, "street");
    assert.equal(result.addresses[0].line1, "Corporation Street");
    assert.equal(result.addresses[0].region, "West Midlands");
    // No postcode on the row, so the one that was searched for is kept.
    assert.equal(result.addresses[0].postal, "CV11GU");
  });

  it("drops duplicates rather than showing the same door twice", () => {
    const row = { address: { house_number: "1", road: "High Street", city: "Coventry" } };
    const result = parseNominatim([row, row, row], "CV11GU");
    assert.equal(result.addresses.length, 1);
  });

  it("skips rows with neither a street nor a settlement", () => {
    const result = parseNominatim([{ address: { country: "United Kingdom" } }, {}], "CV11GU");
    assert.equal(result.precision, "none");
    assert.equal(result.addresses.length, 0);
  });

  it("falls back through the settlement keys OSM actually uses", () => {
    const village = parseNominatim([{ address: { road: "Mill Lane", village: "Ryton" } }], "CV8");
    assert.equal(village.addresses[0].city, "Ryton");
    const suburb = parseNominatim([{ address: { road: "Mill Lane", suburb: "Earlsdon" } }], "CV5");
    assert.equal(suburb.addresses[0].city, "Earlsdon");
  });
});

describe("parseIdealPostcodes", () => {
  it("keeps every deliverable address on the postcode", () => {
    const result = parseIdealPostcodes([
      { line_1: "Flat 1", line_2: "126 Corporation Street", post_town: "COVENTRY", county: "West Midlands", postcode: "CV1 1GU" },
      { line_1: "Flat 2", line_2: "126 Corporation Street", post_town: "COVENTRY", county: "West Midlands", postcode: "CV1 1GU" },
    ]);
    assert.equal(result.precision, "exact");
    assert.equal(result.addresses.length, 2);
    assert.equal(result.addresses[0].label, "Flat 1, 126 Corporation Street, COVENTRY");
    assert.equal(result.addresses[0].line2, "126 Corporation Street");
  });

  it("is none rather than exact when the provider returns nothing", () => {
    assert.equal(parseIdealPostcodes([]).precision, "none");
  });
});

describe("parseGetAddress", () => {
  it("maps town_or_city onto the same shape", () => {
    const result = parseGetAddress(
      [{ line_1: "126 Corporation Street", line_2: "", town_or_city: "Coventry", county: "West Midlands" }],
      "CV1 1GU",
    );
    assert.equal(result.precision, "exact");
    assert.equal(result.addresses[0].city, "Coventry");
    // getAddress returns the postcode once, at the top level, not per row.
    assert.equal(result.addresses[0].postal, "CV1 1GU");
    assert.equal(result.addresses[0].label, "126 Corporation Street, Coventry");
  });
});

describe("parsePostcodesIo", () => {
  it("gives the town and region with an empty street", () => {
    const result = parsePostcodesIo({
      postcode: "CV1 1GU", admin_district: "Coventry", region: "West Midlands",
    });
    assert.equal(result.precision, "area");
    assert.equal(result.addresses[0].city, "Coventry");
    assert.equal(result.addresses[0].line1, "");
  });

  it("falls back to the ward when there is no district", () => {
    const result = parsePostcodesIo({ postcode: "CV1 1GU", admin_ward: "St Michael's" });
    assert.equal(result.addresses[0].city, "St Michael's");
  });

  it("is none when neither is present, rather than an empty row", () => {
    assert.equal(parsePostcodesIo({ postcode: "CV1 1GU" }).precision, "none");
  });
});
