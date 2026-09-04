import { prisma } from "@/lib/db";

/**
 * Fixed-window rate limiting, shared across instances.
 *
 * The window lives in Postgres rather than in process memory, because a limit
 * held per process does not mean what it says: three instances each keep their
 * own counter, so the real allowance is three times the intended one, and a
 * deploy resets every counter at once. Both are exactly the conditions under
 * which somebody is likely to be probing the login endpoint.
 *
 * The counter is advanced by one statement that both resets an expired window
 * and increments a live one, so two concurrent requests cannot each read the
 * same count and each conclude they are under the limit.
 */

/** Rows are only written on a miss; a hot key still costs one statement. */
type Row = { count: number };

export async function rateLimit(key: string, limit: number, windowMs: number): Promise<boolean> {
  // Both bounds are passed as parameters rather than compared against SQL
  // `NOW()`. Prisma maps DateTime to `timestamp` without a time zone, so a
  // comparison against `NOW()` — which is `timestamptz` — is silently shifted
  // by the server's UTC offset, and every window read as already expired.
  const now = new Date();
  const resetAt = new Date(now.getTime() + windowMs);

  try {
    const rows = await prisma.$queryRaw<Row[]>`
      INSERT INTO "RateLimit" ("key", "count", "resetAt")
      VALUES (${key}, 1, ${resetAt})
      ON CONFLICT ("key") DO UPDATE SET
        "count"   = CASE WHEN "RateLimit"."resetAt" <= ${now} THEN 1 ELSE "RateLimit"."count" + 1 END,
        "resetAt" = CASE WHEN "RateLimit"."resetAt" <= ${now} THEN ${resetAt} ELSE "RateLimit"."resetAt" END
      RETURNING "count"
    `;

    const count = rows[0]?.count ?? 1;
    void sweep();
    return count <= limit;
  } catch {
    // The database being unreachable must not turn every limited endpoint into
    // an unlimited one. The in-process window is weaker — per instance, lost on
    // restart — but it is the difference between degraded and absent.
    return memoryLimit(key, limit, windowMs);
  }
}

/* -------------------------------------------------------------------------- */
/* Housekeeping                                                               */

let lastSweep = 0;
const SWEEP_EVERY = 5 * 60_000;

/** Expired rows are harmless but unbounded, so they are cleared occasionally. */
async function sweep(): Promise<void> {
  const now = Date.now();
  if (now - lastSweep < SWEEP_EVERY) return;
  lastSweep = now;
  await prisma.rateLimit.deleteMany({ where: { resetAt: { lte: new Date(now) } } }).catch(() => {});
}

/* -------------------------------------------------------------------------- */
/* Fallback                                                                   */

type Window = { count: number; resetAt: number };
const windows = new Map<string, Window>();

function memoryLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const existing = windows.get(key);

  if (!existing || existing.resetAt <= now) {
    windows.set(key, { count: 1, resetAt: now + windowMs });
    if (windows.size > 10_000) {
      for (const [entry, window] of windows) if (window.resetAt <= now) windows.delete(entry);
    }
    return true;
  }

  if (existing.count >= limit) return false;
  existing.count += 1;
  return true;
}

/* -------------------------------------------------------------------------- */

export function clientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
}
