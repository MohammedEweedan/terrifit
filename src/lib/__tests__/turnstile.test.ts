import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { verifyTurnstile } from "../turnstile";

/**
 * The sitekey is public, so `success: true` on its own proves only that
 * *someone* solved *a* challenge. These cover the two checks that make the
 * token ours — the action it was minted for, and the host it was solved on —
 * plus the deliberate escape hatches.
 */
const SECRET = "TURNSTILE_SECRET_KEY";

function siteverify(body: Record<string, unknown>) {
  return vi.fn().mockResolvedValue({ json: async () => body } as Response);
}

describe("verifyTurnstile", () => {
  const original = process.env[SECRET];
  const originalHosts = process.env.TURNSTILE_ALLOWED_HOSTNAMES;

  beforeEach(() => {
    process.env[SECRET] = "secret";
    process.env.TURNSTILE_ALLOWED_HOSTNAMES = "terri.fit,www.terri.fit";
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    if (original === undefined) delete process.env[SECRET];
    else process.env[SECRET] = original;
    if (originalHosts === undefined) delete process.env.TURNSTILE_ALLOWED_HOSTNAMES;
    else process.env.TURNSTILE_ALLOWED_HOSTNAMES = originalHosts;
    vi.restoreAllMocks();
  });

  it("is a no-op when no secret is configured, so the forms keep working", async () => {
    delete process.env[SECRET];
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    await expect(verifyTurnstile(undefined)).resolves.toEqual({ ok: true });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("rejects a request with no token once a secret is configured", async () => {
    await expect(verifyTurnstile(undefined)).resolves.toEqual({ ok: false, reason: "missing" });
    await expect(verifyTurnstile("   ")).resolves.toEqual({ ok: false, reason: "missing" });
  });

  it("accepts a token whose action and hostname both match", async () => {
    vi.stubGlobal("fetch", siteverify({ success: true, action: "waitlist", hostname: "terri.fit" }));
    await expect(verifyTurnstile("token", null, "waitlist")).resolves.toEqual({ ok: true });
  });

  it("rejects a token minted for a different form", async () => {
    vi.stubGlobal("fetch", siteverify({ success: true, action: "contact", hostname: "terri.fit" }));
    await expect(verifyTurnstile("token", null, "waitlist")).resolves.toEqual({ ok: false, reason: "action" });
  });

  it("rejects a token solved on someone else's domain", async () => {
    // The replay this exists to stop: real token, real sitekey, wrong origin.
    vi.stubGlobal("fetch", siteverify({ success: true, action: "waitlist", hostname: "phish.example" }));
    await expect(verifyTurnstile("token", null, "waitlist")).resolves.toEqual({ ok: false, reason: "hostname" });
  });

  it("rejects an unsuccessful verification", async () => {
    vi.stubGlobal("fetch", siteverify({ success: false, "error-codes": ["invalid-input-response"] }));
    await expect(verifyTurnstile("token", null, "waitlist")).resolves.toEqual({ ok: false, reason: "invalid" });
  });

  it("shouts when Cloudflare rejects our own secret", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubGlobal("fetch", siteverify({ success: false, "error-codes": ["invalid-input-secret"] }));
    await expect(verifyTurnstile("token")).resolves.toEqual({ ok: false, reason: "invalid" });
    expect(error).toHaveBeenCalledWith(expect.stringContaining("TURNSTILE_SECRET_KEY"));
  });

  it("skips pinning for Cloudflare's testing keys, which return example.com", async () => {
    vi.stubGlobal("fetch", siteverify({
      success: true,
      hostname: "example.com",
      metadata: { result_with_testing_key: true },
    }));
    await expect(verifyTurnstile("XXXX.DUMMY.TOKEN.XXXX", null, "waitlist")).resolves.toEqual({ ok: true });
  });

  it("fails open when Cloudflare is unreachable rather than taking the forms down", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network")));
    await expect(verifyTurnstile("token", null, "waitlist")).resolves.toEqual({ ok: true });
  });
});
