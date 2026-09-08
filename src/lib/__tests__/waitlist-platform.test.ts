import { describe, expect, it } from "vitest";
import { waitlistSchema } from "../validation";

const base = {
  name: "Sam", email: "sam@example.com", country: "AE", locale: "en",
  features: ["maps"], consent: true as const,
};
const fieldsOf = (result: ReturnType<typeof waitlistSchema.safeParse>) =>
  result.success ? [] : result.error.issues.map((i) => i.path.join("."));

/**
 * Creators are verified before they can publish Maps, and that review is a
 * person opening the profile. A handle with no platform cannot be opened —
 * "@sam" is a different account on every network.
 */
describe("waitlist creator identity", () => {
  it("rejects a creator with no platform or handle", () => {
    const result = waitlistSchema.safeParse({ ...base, role: "creator" });
    expect(result.success).toBe(false);
    expect(fieldsOf(result)).toEqual(expect.arrayContaining(["platform", "handle"]));
  });

  it("rejects a creator who gives a handle but no platform", () => {
    const result = waitlistSchema.safeParse({ ...base, role: "creator", handle: "@sam" });
    expect(fieldsOf(result)).toContain("platform");
  });

  it("accepts a creator with both", () => {
    const result = waitlistSchema.safeParse({
      ...base, role: "creator", platform: "instagram", handle: "https://instagram.com/sam",
    });
    expect(result.success).toBe(true);
  });

  it("requires a platform from any role that volunteers a handle", () => {
    const result = waitlistSchema.safeParse({ ...base, role: "athlete", handle: "@sam" });
    expect(fieldsOf(result)).toContain("platform");
  });

  it("leaves roles that give no handle alone", () => {
    expect(waitlistSchema.safeParse({ ...base, role: "athlete" }).success).toBe(true);
  });

  it("refuses a platform that is not one we can review", () => {
    const result = waitlistSchema.safeParse({
      ...base, role: "creator", platform: "myspace", handle: "@sam",
    });
    expect(result.success).toBe(false);
  });
});
