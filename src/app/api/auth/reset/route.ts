import { createHash, randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { hashPassword, destroyAllSessions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email/send";
import { passwordReset } from "@/lib/email/templates";
import { clientKey, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

/** Short enough that a leaked inbox is a small window; long enough to be usable. */
const TTL_MINUTES = 30;

const hash = (token: string) => createHash("sha256").update(token).digest("hex");

function siteOrigin(request: Request): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) return configured.replace(/\/$/, "");
  const origin = request.headers.get("origin");
  if (origin && /^https?:\/\//.test(origin)) return origin.replace(/\/$/, "");
  return "http://localhost:3000";
}

const requestSchema = z.object({
  email: z.string().trim().email().max(200),
  locale: z.string().trim().max(5).default("en"),
});

/**
 * Asks for a reset link.
 *
 * Always answers the same way, whether or not the address has an account. An
 * endpoint that says "no such user" is a free tool for working out who banks,
 * trains or shops somewhere, and the honesty buys the sender nothing they
 * cannot get from the email itself.
 */
export async function POST(request: Request) {
  // Tight, because this endpoint sends email on demand.
  if (!(await rateLimit(`reset:${clientKey(request)}`, 5, 15 * 60_000))) {
    return NextResponse.json({ ok: true });
  }

  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: true });

  const { email, locale } = parsed.data;
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    select: { id: true },
  });

  if (user) {
    // Asking again invalidates whatever was outstanding, so an old link in an
    // old inbox stops working the moment a new one is requested.
    await prisma.passwordReset.deleteMany({ where: { userId: user.id, usedAt: null } });

    const token = randomBytes(32).toString("base64url");
    await prisma.passwordReset.create({
      data: {
        userId: user.id,
        tokenHash: hash(token),
        expiresAt: new Date(Date.now() + TTL_MINUTES * 60_000),
      },
    });

    const link = `${siteOrigin(request)}/${locale}/reset?token=${token}`;
    const message = passwordReset(link, TTL_MINUTES);
    await sendEmail({ to: email, ...message });
  }

  return NextResponse.json({ ok: true });
}

const confirmSchema = z.object({
  token: z.string().trim().min(20).max(200),
  password: z.string().min(10).max(200),
});

/** Sets the new password, if the link is real, unused and unexpired. */
export async function PUT(request: Request) {
  if (!(await rateLimit(`resetconfirm:${clientKey(request)}`, 10, 15 * 60_000))) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const parsed = confirmSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "validation" }, { status: 422 });
  }

  const row = await prisma.passwordReset.findUnique({
    where: { tokenHash: hash(parsed.data.token) },
    select: { id: true, userId: true, expiresAt: true, usedAt: true },
  });

  if (!row || row.usedAt || row.expiresAt < new Date()) {
    return NextResponse.json({ error: "invalid_token" }, { status: 400 });
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: row.userId },
      data: { passwordHash: await hashPassword(parsed.data.password) },
    }),
    prisma.passwordReset.update({ where: { id: row.id }, data: { usedAt: new Date() } }),
  ]);

  // Whoever had the old password is signed out everywhere. If the reset was
  // prompted by somebody else being in the account, this is the part that
  // actually removes them.
  await destroyAllSessions(row.userId);

  return NextResponse.json({ ok: true });
}
