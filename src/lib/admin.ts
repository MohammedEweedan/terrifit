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

export async function requireAdmin(request?: Request): Promise<AdminUser | null> {
  const current = request ? await getRequestUser(request) : await getCurrentUser();
  if (!current) return null;

  const user = await prisma.user.findUnique({
    where: { id: current.id },
    select: { id: true, email: true, name: true, isAdmin: true },
  });
  if (!user?.isAdmin) return null;

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
