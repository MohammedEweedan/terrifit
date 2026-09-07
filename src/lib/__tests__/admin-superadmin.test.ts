import { describe, expect, it } from "vitest";
import { isSuperadminEmail } from "../admin";

/**
 * The allowlist is the one path to staff access that does not require database
 * access, so it must be exact: no prefix matches, no domain matches, no
 * near-misses.
 */
describe("superadmin allowlist", () => {
  it("recognises the founders' addresses", () => {
    expect(isSuperadminEmail("mohammedawidan@yahoo.com")).toBe(true);
    expect(isSuperadminEmail("moeawidan99@gmail.com")).toBe(true);
  });

  it("ignores case and surrounding whitespace, as a login form would send it", () => {
    expect(isSuperadminEmail("  MohammedAwidan@Yahoo.com ")).toBe(true);
  });

  it("refuses anything that merely resembles one", () => {
    for (const near of [
      "mohammedawidan@yahoo.com.evil.test",
      "notmohammedawidan@yahoo.com",
      "mohammedawidan@gmail.com",
      "moeawidan9@gmail.com",
      "@yahoo.com",
      "",
    ]) {
      expect(isSuperadminEmail(near), near).toBe(false);
    }
  });
});
