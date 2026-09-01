/**
 * Transactional email.
 *
 * One function, one provider, no template engine. Resend is used because it
 * takes an API key and JSON and nothing else — no SDK, no build step, and it
 * works from an edge or node runtime identically.
 *
 * With no key configured, `sendEmail` logs and returns `skipped` rather than
 * throwing. That matters: a password reset that 500s because email is not set
 * up tells an attacker the address exists, and an order that fails to complete
 * because a receipt could not be sent is a lost sale over a nicety.
 */

const env = (key: string) => process.env[key]?.trim() || "";

export type EmailResult = { sent: boolean; skipped: boolean; error?: string };

export function emailConfigured(): boolean {
  return Boolean(env("RESEND_API_KEY") && env("EMAIL_FROM"));
}

export async function sendEmail(message: {
  to: string;
  subject: string;
  /** Plain text. Always sent, and the only thing some clients will show. */
  text: string;
  html?: string;
}): Promise<EmailResult> {
  if (!emailConfigured()) {
    return { sent: false, skipped: true };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env("RESEND_API_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: env("EMAIL_FROM"),
        to: [message.to],
        subject: message.subject,
        text: message.text,
        ...(message.html ? { html: message.html } : {}),
      }),
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) return { sent: false, skipped: false, error: `resend_${response.status}` };
    return { sent: true, skipped: false };
  } catch {
    return { sent: false, skipped: false, error: "network" };
  }
}
