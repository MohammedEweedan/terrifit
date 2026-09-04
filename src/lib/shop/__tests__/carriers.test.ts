import assert from "node:assert/strict";
import { describe, it } from "vitest";
import { CARRIERS, findCarrier, trackingUrl } from "../carriers";

describe("trackingUrl", () => {
  it("builds a carrier's tracking link", () => {
    const url = trackingUrl("royal-mail", "AB123456789GB");
    assert.equal(url, "https://www.royalmail.com/track-your-item#/tracking-results/AB123456789GB");
  });

  it("is null with no carrier, so no half-built link is offered", () => {
    assert.equal(trackingUrl(null, "AB123456789GB"), null);
    assert.equal(trackingUrl("not-a-carrier", "AB123456789GB"), null);
  });

  it("is null with no number, rather than linking to an empty search", () => {
    assert.equal(trackingUrl("royal-mail", null), null);
    assert.equal(trackingUrl("royal-mail", "   "), null);
  });

  it("encodes a number that would otherwise break the URL", () => {
    const url = trackingUrl("ups", "1Z 999/AA1&0123456784");
    assert.ok(url);
    assert.ok(!url.includes(" "), url);
    assert.ok(!url.includes("&0123"), url);
  });

  it("trims surrounding whitespace from a pasted number", () => {
    assert.equal(trackingUrl("ups", "  1Z999  "), "https://www.ups.com/track?tracknum=1Z999");
  });
});

describe("the carrier table", () => {
  it("has no duplicate keys", () => {
    const keys = CARRIERS.map((carrier) => carrier.key);
    assert.equal(new Set(keys).size, keys.length);
  });

  it("gives every carrier a placeholder to put the number in", () => {
    for (const carrier of CARRIERS) {
      assert.ok(carrier.url.includes("{n}"), `${carrier.key} has nowhere to put the number`);
      assert.ok(carrier.url.startsWith("https://"), `${carrier.key} is not https`);
    }
  });

  it("resolves a known key and rejects an unknown one", () => {
    assert.equal(findCarrier("dhl")?.name, "DHL");
    assert.equal(findCarrier("nope"), undefined);
    assert.equal(findCarrier(null), undefined);
  });
});
