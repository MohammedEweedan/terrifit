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

export type TurnstileResult = { ok: true } | { ok: false; reason: "missing" | "invalid" };

/** Whether a secret is configured, i.e. whether tokens are enforced at all. */
export const turnstileEnabled = () => Boolean(process.env.TURNSTILE_SECRET_KEY);

export async function verifyTurnstile(token: unknown, ip?: string | null): Promise<TurnstileResult> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return { ok: true };

  if (typeof token !== "string" || !token.trim()) return { ok: false, reason: "missing" };

  const body = new URLSearchParams({ secret, response: token });
  if (ip) body.set("remoteip", ip);

  try {
    const response = await fetch(VERIFY_URL, {
      method: "POST",
      body,
      // A hung verifier must not hold a form submission open indefinitely.
      signal: AbortSignal.timeout(5_000),
    });
    const result = (await response.json()) as { success?: boolean };
    return result.success ? { ok: true } : { ok: false, reason: "invalid" };
  } catch (error) {
    // Cloudflare unreachable. Rejecting here would take the signup forms down
    // for an outage that is not ours, so this fails open — the same choice
    // `rateLimit()` makes — and says so in the logs rather than silently.
    console.error("turnstile verification unavailable, allowing request", error);
    return { ok: true };
  }
}
