import assert from "node:assert/strict";
import { beforeEach, describe, it } from "vitest";
import { prisma } from "@/lib/db";
import { clientKey, rateLimit } from "../rate-limit";

/**
 * Driven against the real table, because the bug this guards against was
 * invisible to any mock: Prisma maps DateTime to a `timestamp` with no time
 * zone, so comparing it to SQL `NOW()` — a `timestamptz` — shifted every window
 * by the server's UTC offset and made all of them read as already expired. The
 * limiter still returned true and still wrote rows; it just let everything
 * through. Only a query against Postgres shows it.
 */
const key = () => `test:${Math.random().toString(36).slice(2)}`;

beforeEach(async () => {
  await prisma.rateLimit.deleteMany({ where: { key: { startsWith: "test:" } } });
});

describe("rateLimit", () => {
  it("allows exactly the limit, then refuses", async () => {
    const k = key();
    const results: boolean[] = [];
    for (let i = 0; i < 5; i += 1) results.push(await rateLimit(k, 3, 60_000));
    assert.deepEqual(results, [true, true, true, false, false]);
  });

  it("counts the window up rather than resetting it on each call", async () => {
    const k = key();
    for (let i = 0; i < 4; i += 1) await rateLimit(k, 10, 60_000);
    const row = await prisma.rateLimit.findUnique({ where: { key: k } });
    assert.equal(row?.count, 4);
  });

  it("keeps a live window's expiry instead of pushing it back on every call", async () => {
    // A window that renewed on each request would never expire under sustained
    // traffic, turning a one-minute limit into a permanent block.
    const k = key();
    await rateLimit(k, 10, 60_000);
    const first = await prisma.rateLimit.findUnique({ where: { key: k } });
    await rateLimit(k, 10, 60_000);
    const second = await prisma.rateLimit.findUnique({ where: { key: k } });
    assert.equal(first?.resetAt.getTime(), second?.resetAt.getTime());
  });

  it("starts a fresh window once the old one has expired", async () => {
    const k = key();
    await rateLimit(k, 1, 60_000);
    assert.equal(await rateLimit(k, 1, 60_000), false);

    // Expired directly rather than waiting a minute for it.
    await prisma.rateLimit.update({ where: { key: k }, data: { resetAt: new Date(Date.now() - 1) } });
    assert.equal(await rateLimit(k, 1, 60_000), true);
  });

  it("keeps separate keys separate", async () => {
    const a = key();
    const b = key();
    await rateLimit(a, 1, 60_000);
    assert.equal(await rateLimit(b, 1, 60_000), true);
  });
});

describe("clientKey", () => {
  it("takes the first hop of x-forwarded-for", () => {
    const request = new Request("https://terrifit.test", {
      headers: { "x-forwarded-for": "203.0.113.9, 70.41.3.18" },
    });
    assert.equal(clientKey(request), "203.0.113.9");
  });

  it("falls back to x-real-ip", () => {
    const request = new Request("https://terrifit.test", { headers: { "x-real-ip": "203.0.113.9" } });
    assert.equal(clientKey(request), "203.0.113.9");
  });

  it("is a stable string when the proxy tells it nothing", () => {
    // Must not be empty: an empty key collapses every anonymous caller into one
    // bucket per endpoint, which is a denial of service by accident.
    assert.equal(clientKey(new Request("https://terrifit.test")), "unknown");
  });
});
