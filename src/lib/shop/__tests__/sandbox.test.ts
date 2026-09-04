import assert from "node:assert/strict";
import { afterEach, describe, it } from "vitest";
import { sandboxAllowed } from "../payments";

/**
 * Sandbox checkout records an order nobody paid for. Which way this defaults
 * is a money question, not a style one: the dangerous case is a live site
 * whose payment keys are not set yet, and that site must refuse the order
 * rather than book it.
 */
const originalEnv = process.env.NODE_ENV;
const originalFlag = process.env.ALLOW_SANDBOX_CHECKOUT;

function set(nodeEnv: string | undefined, flag: string | undefined) {
  // `process.env` rejects a defineProperty descriptor, and NODE_ENV is typed
  // readonly, so plain assignment through a widened view is the way in.
  const env = process.env as Record<string, string | undefined>;
  if (nodeEnv === undefined) delete env.NODE_ENV;
  else env.NODE_ENV = nodeEnv;
  if (flag === undefined) delete env.ALLOW_SANDBOX_CHECKOUT;
  else env.ALLOW_SANDBOX_CHECKOUT = flag;
}

afterEach(() => set(originalEnv, originalFlag));

describe("sandboxAllowed", () => {
  it("is off in production when nothing is configured", () => {
    set("production", undefined);
    assert.equal(sandboxAllowed(), false);
  });

  it("is on in development when nothing is configured", () => {
    set("development", undefined);
    assert.equal(sandboxAllowed(), true);
  });

  it("stays off in production when the flag is empty", () => {
    set("production", "");
    assert.equal(sandboxAllowed(), false);
  });

  it("can be turned on in production, but only deliberately", () => {
    set("production", "true");
    assert.equal(sandboxAllowed(), true);
  });

  it("can be turned off in development", () => {
    set("development", "false");
    assert.equal(sandboxAllowed(), false);
  });

  it("ignores a value that is neither true nor false", () => {
    // A typo must not read as consent to book unpaid orders.
    set("production", "yes");
    assert.equal(sandboxAllowed(), false);
  });

  it("accepts the flag regardless of case", () => {
    set("production", "TRUE");
    assert.equal(sandboxAllowed(), true);
  });
});
