/**
 * Cloudflare Turnstile verification.
 *
 * Turnstile is the one part of the Cloudflare stack that does not require the
 * domain to be proxied through Cloudflare — it is a widget plus this
 * server-side check — so it works while DNS still points straight at Vercel.
 *
 * Disabled unless `TURNSTILE_SECRET_KEY` is set. That is deliberate: the forms
 * must keep working in local development, in previews, and on the deployment
 * that is live right now, none of which have keys. Configure the secret and
 * enforcement begins; leave it unset and this is a no-op.
 */

const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export type TurnstileFailure = "missing" | "invalid" | "action" | "hostname";
export type TurnstileResult = { ok: true } | { ok: false; reason: TurnstileFailure };

/** Whether a secret is configured, i.e. whether tokens are enforced at all. */
export const turnstileEnabled = () => Boolean(process.env.TURNSTILE_SECRET_KEY);

/**
 * Hostnames a solved challenge may have come from.
 *
 * A sitekey is public. Without this check, anyone can embed it on a page they
 * control, solve the challenge there and replay the token against our API — the
 * token verifies as genuine, because it is. Cloudflare returns the hostname the
 * challenge was solved on, so pinning it is what makes the token ours.
 */
function allowedHostnames(): string[] {
  const configured = process.env.TURNSTILE_ALLOWED_HOSTNAMES;
  if (configured) return configured.split(",").map((entry) => entry.trim()).filter(Boolean);

  const hosts = new Set(["localhost", "127.0.0.1"]);
  for (const source of [process.env.NEXT_PUBLIC_SITE_URL, process.env.VERCEL_URL, process.env.VERCEL_BRANCH_URL]) {
    if (!source) continue;
    try {
      hosts.add(new URL(source.startsWith("http") ? source : `https://${source}`).hostname);
    } catch {
      // A malformed value must not take the allowlist down with it.
    }
  }
  // Preview deployments get a generated hostname per build, so the apex and its
  // www alias are named explicitly rather than inferred from one deployment.
  hosts.add("terri.fit");
  hosts.add("www.terri.fit");
  return [...hosts];
}

type SiteverifyResponse = {
  success?: boolean;
  action?: string;
  hostname?: string;
  "error-codes"?: string[];
  /** Cloudflare marks responses produced by its published testing keys. */
  metadata?: { result_with_testing_key?: boolean };
};

export async function verifyTurnstile(
  token: unknown,
  ip?: string | null,
  expectedAction?: string,
): Promise<TurnstileResult> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return { ok: true };

  if (typeof token !== "string" || !token.trim()) return { ok: false, reason: "missing" };

  const body = new URLSearchParams({ secret, response: token });
  if (ip) body.set("remoteip", ip);

  let result: SiteverifyResponse;
  try {
    const response = await fetch(VERIFY_URL, {
      method: "POST",
      body,
      // A hung verifier must not hold a form submission open indefinitely.
      signal: AbortSignal.timeout(5_000),
    });
    result = (await response.json()) as SiteverifyResponse;
  } catch (error) {
    // Cloudflare unreachable. Rejecting here would take the signup forms down
    // for an outage that is not ours, so this fails open — the same choice
    // `rateLimit()` makes — and says so in the logs rather than silently.
    console.error("turnstile verification unavailable, allowing request", error);
    return { ok: true };
  }

  if (!result.success) {
    const codes = result["error-codes"] ?? [];
    // Our own misconfiguration, not a failed challenge: worth shouting about,
    // because every form on the site is rejecting everyone while it is true.
    if (codes.includes("invalid-input-secret") || codes.includes("missing-input-secret")) {
      console.error("turnstile secret is rejected by Cloudflare — check TURNSTILE_SECRET_KEY");
    }
    return { ok: false, reason: "invalid" };
  }

  // Cloudflare's testing keys return a synthetic hostname of example.com and
  // no action at all, so pinning them would reject the documented test flow —
  // and only the test flow, since a real key can never set this.
  if (result.metadata?.result_with_testing_key) return { ok: true };

  // A token solved for the contact form must not be spent on the waitlist.
  if (expectedAction && result.action !== expectedAction) {
    console.warn(`turnstile action mismatch: expected ${expectedAction}, got ${result.action}`);
    return { ok: false, reason: "action" };
  }

  if (result.hostname && !allowedHostnames().includes(result.hostname)) {
    console.warn(`turnstile hostname not allowed: ${result.hostname}`);
    return { ok: false, reason: "hostname" };
  }

  return { ok: true };
}
