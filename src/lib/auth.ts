import { createHash, randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";

const scryptAsync = promisify(scrypt) as (
  password: string,
  salt: Buffer,
  keylen: number,
) => Promise<Buffer>;

export const SESSION_COOKIE = "terrifit.sid";
const SESSION_DAYS = 30;
const KEY_LENGTH = 64;

/**
 * Password hashing with scrypt from the Node standard library.
 *
 * Stored as `scrypt$<salt-hex>$<hash-hex>` so the algorithm is named in the
 * record. That is what makes a future migration to argon2 possible without a
 * forced password reset: the prefix says how to verify an old hash.
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const derived = await scryptAsync(password, salt, KEY_LENGTH);
  return `scrypt$${salt.toString("hex")}$${derived.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [scheme, saltHex, hashHex] = stored.split("$");
  if (scheme !== "scrypt" || !saltHex || !hashHex) return false;

  const expected = Buffer.from(hashHex, "hex");
  const derived = await scryptAsync(password, Buffer.from(saltHex, "hex"), expected.length);
  // Constant-time: a length-varying or short-circuiting compare leaks the hash
  // one byte at a time.
  return expected.length === derived.length && timingSafeEqual(expected, derived);
}

/* -------------------------------------------------------------------------- */

/** Only the hash is stored, so a database dump cannot be replayed as a login. */
function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function createSession(
  userId: string,
  meta: { userAgent?: string | null; ip?: string | null } = {},
): Promise<{ token: string; expiresAt: Date }> {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);

  await prisma.session.create({
    data: {
      tokenHash: hashToken(token),
      userId,
      userAgent: meta.userAgent?.slice(0, 400) ?? null,
      ip: meta.ip ?? null,
      expiresAt,
    },
  });

  return { token, expiresAt };
}

export async function setSessionCookie(token: string, expiresAt: Date): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

/**
 * The session token carried by a native client.
 *
 * The web uses an httpOnly cookie, which a React Native app cannot read or set
 * — so mobile sends the same opaque token as a bearer instead. It is the same
 * session row either way; only the transport differs, so revoking a session
 * kills it on both.
 */
function bearerToken(request: Request): string | null {
  const header = request.headers.get("authorization");
  if (!header?.toLowerCase().startsWith("bearer ")) return null;
  const token = header.slice(7).trim();
  return token.length > 0 ? token : null;
}

export type CurrentUser = {
  id: string;
  email: string;
  name: string;
  handle: string | null;
  role: string;
  locale: string;
};

/** The signed-in user, or null. Expired sessions are deleted as they are found. */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return userForToken(token);
}

/**
 * The signed-in user for an API request, from either transport.
 *
 * Bearer first so a native client with a stale cookie in its jar still resolves
 * to the account it actually authenticated as.
 */
export async function getRequestUser(request: Request): Promise<CurrentUser | null> {
  const bearer = bearerToken(request);
  if (bearer) return userForToken(bearer);
  return getCurrentUser();
}

async function userForToken(token: string): Promise<CurrentUser | null> {
  const session = await prisma.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: { select: { id: true, email: true, name: true, handle: true, role: true, locale: true } } },
  });

  if (!session) return null;
  if (session.expiresAt.getTime() <= Date.now()) {
    await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
    return null;
  }

  return session.user;
}

export async function destroyCurrentSession(): Promise<void> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) {
    await prisma.session.deleteMany({ where: { tokenHash: hashToken(token) } }).catch(() => {});
  }
  await clearSessionCookie();
}

/** Ends every session for a user — used after a password change. */
export async function destroyAllSessions(userId: string): Promise<void> {
  await prisma.session.deleteMany({ where: { userId } });
}
