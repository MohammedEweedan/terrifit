import { getRequestUser, getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

/**
 * Staff authorisation.
 *
 * `isAdmin` is a column of its own rather than a value of `role`, because role
 * is chosen at signup — if staff access were a role, anyone could pick it.
 * There is no way to grant it through the API at all: it is set in the
 * database, deliberately, by someone with access to the database.
 */
export type AdminUser = { id: string; email: string; name: string };

/**
 * Accounts that are staff by virtue of who they are.
 *
 * This does not weaken the rule above — the list lives in server configuration,
 * not in the database and not in anything a user can send, so signing up with
 * one of these addresses is only possible for whoever actually controls it. It
 * exists so the founders cannot lock themselves out of their own console, which
 * previously required database access to undo.
 *
 * `SUPERADMIN_EMAILS` overrides the default, comma separated.
 */
const SUPERADMINS = (process.env.SUPERADMIN_EMAILS ?? "mohammedawidan@yahoo.com,moeawidan99@gmail.com")
  .split(",")
  .map((entry) => entry.trim().toLowerCase())
  .filter(Boolean);

export const isSuperadminEmail = (email: string): boolean =>
  SUPERADMINS.includes(email.trim().toLowerCase());

export async function requireAdmin(request?: Request): Promise<AdminUser | null> {
  const current = request ? await getRequestUser(request) : await getCurrentUser();
  if (!current) return null;

  const user = await prisma.user.findUnique({
    where: { id: current.id },
    select: { id: true, email: true, name: true, isAdmin: true },
  });
  if (!user) return null;

  // Self-healing: a superadmin whose column was never set is promoted on first
  // use and the promotion is recorded, rather than being refused access to the
  // console that would let them fix it.
  if (!user.isAdmin) {
    if (!isSuperadminEmail(user.email)) return null;
    await prisma.user.update({ where: { id: user.id }, data: { isAdmin: true } });
    await audit(user.id, "admin.self_promote", user.id, { reason: "superadmin allowlist" });
  }

  return { id: user.id, email: user.email, name: user.name };
}

/**
 * Records an administrative action.
 *
 * Callers pass the same transaction where possible; where that is not
 * practical this runs immediately after the change, and never before — an
 * entry for something that did not happen is worse than none.
 */
export async function audit(
  actorId: string,
  action: string,
  target: string,
  detail: Record<string, unknown> = {},
): Promise<void> {
  await prisma.auditLog.create({
    data: { actorId, action, target, detail: JSON.stringify(detail) },
  });
}

/** 403 rather than 404: staff routes are not secret, they are restricted. */
export const FORBIDDEN = { error: "forbidden" } as const;
