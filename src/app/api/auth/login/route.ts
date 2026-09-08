import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { loginSchema } from "@/lib/validation";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { createSession, setSessionCookie, verifyPassword } from "@/lib/auth";
import { audit, isSuperadminEmail } from "@/lib/admin";

export const runtime = "nodejs";

/** A native client asks for a token explicitly; browsers never do. */
function isNativeClient(body: unknown): boolean {
  return (body as { client?: string } | null)?.client === "native";
}

/**
 * A dummy hash with the same cost as a real one. Verifying against it when the
 * email is unknown keeps the response time flat, so the endpoint cannot be used
 * to find out which addresses have accounts.
 */
const DUMMY_HASH =
  "scrypt$00000000000000000000000000000000$" + "0".repeat(128);

export async function POST(request: Request) {
  if (!(await rateLimit(`login:${clientKey(request)}`, 10, 60_000))) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "validation" }, { status: 422 });
  }

  const { email, password } = parsed.data;
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, name: true, role: true, passwordHash: true, isAdmin: true },
  });

  const ok = await verifyPassword(password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !ok) {
    return NextResponse.json({ error: "invalid_credentials" }, { status: 401 });
  }

  // Accounts that predate the allowlist, or were created before an address
  // was added to it, are promoted on the way in rather than staying locked out
  // until someone edits the database.
  if (!user.isAdmin && isSuperadminEmail(user.email)) {
    await prisma.user.update({ where: { id: user.id }, data: { isAdmin: true } });
    await audit(user.id, "admin.self_promote", user.id, { reason: "superadmin allowlist", at: "login" });
  }

  const session = await createSession(user.id, {
    userAgent: request.headers.get("user-agent"),
    ip: clientKey(request),
  });
  await setSessionCookie(session.token, session.expiresAt);

  return NextResponse.json({
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
    // Only a native client gets the raw token, and only because it cannot use
    // the httpOnly cookie. Handing it to a browser would undo that protection.
    ...(isNativeClient(body) ? { token: session.token, expiresAt: session.expiresAt } : {}),
  });
}
