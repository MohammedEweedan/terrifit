/**
 * Transactional email.
 *
 * Two transports, one function. SMTP is preferred when it is configured,
 * because it works with any mailbox you already own — a domain mailbox, Google
 * Workspace, Postmark, anything — and does not tie deliverability to one
 * vendor's API. Resend stays as the fallback for deployments already using it.
 *
 * With neither configured, `sendEmail` returns `skipped` rather than throwing.
 * That matters: a password reset that 500s because email is not set up tells an
 * attacker the address exists, and an order that fails to complete because a
 * receipt could not be sent is a lost sale over a nicety.
 */

const env = (key: string) => process.env[key]?.trim() || "";

export type EmailResult = { sent: boolean; skipped: boolean; error?: string };

/** SMTP takes precedence; Resend is the fallback. */
export type Transport = "smtp" | "resend" | "none";

export function emailTransport(): Transport {
  if (env("SMTP_HOST") && env("EMAIL_FROM")) return "smtp";
  if (env("RESEND_API_KEY") && env("EMAIL_FROM")) return "resend";
  return "none";
}

export function emailConfigured(): boolean {
  return emailTransport() !== "none";
}

/**
 * One pooled SMTP connection per process.
 *
 * Creating a transport per message opens a new TLS session for every email,
 * which is slow and gets a server rate-limited quickly. `nodemailer` pools and
 * reuses connections when asked to.
 */
let transporter: import("nodemailer").Transporter | undefined;

async function smtp() {
  if (transporter) return transporter;
  const nodemailer = await import("nodemailer");
  const port = Number(env("SMTP_PORT") || 587);
  transporter = nodemailer.createTransport({
    host: env("SMTP_HOST"),
    port,
    // 465 is implicit TLS; 587 and 25 upgrade with STARTTLS. Getting this
    // backwards is the usual cause of a hang rather than an error.
    secure: port === 465,
    auth: env("SMTP_USER") ? { user: env("SMTP_USER"), pass: env("SMTP_PASSWORD") } : undefined,
    pool: true,
    maxConnections: 3,
    connectionTimeout: 8000,
    greetingTimeout: 8000,
  });
  return transporter;
}

export async function sendEmail(message: {
  to: string;
  subject: string;
  /** Plain text. Always sent, and the only thing some clients will show. */
  text: string;
  html?: string;
}): Promise<EmailResult> {
  const transport = emailTransport();
  if (transport === "none") {
    return { sent: false, skipped: true };
  }

  if (transport === "smtp") {
    try {
      const mailer = await smtp();
      await mailer.sendMail({
        from: env("EMAIL_FROM"),
        to: message.to,
        subject: message.subject,
        text: message.text,
        ...(message.html ? { html: message.html } : {}),
      });
      return { sent: true, skipped: false };
    } catch (error) {
      // Named rather than swallowed: a misconfigured relay is invisible
      // otherwise, and every caller treats a failure as non-fatal.
      console.error("smtp send failed", error);
      return { sent: false, skipped: false, error: "smtp" };
    }
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
