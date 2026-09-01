import { prisma } from "./db";

/** Founding creator places allocated before public launch. */
export const FOUNDING_PLACES = 500;

export type WaitlistStats = {
  total: number;
  markets: number;
  foundingLeft: number;
};

export async function getWaitlistStats(): Promise<WaitlistStats> {
  try {
    const [total, markets, professionals] = await Promise.all([
      prisma.waitlistEntry.count(),
      prisma.waitlistEntry.findMany({ distinct: ["country"], select: { country: true } }),
      prisma.waitlistEntry.count({
        where: { role: { in: ["coach", "nutritionist", "creator"] } },
      }),
    ]);

    return {
      total,
      markets: markets.length,
      foundingLeft: Math.max(0, FOUNDING_PLACES - professionals),
    };
  } catch {
    // The landing page must render even if the database is unreachable.
    return { total: 0, markets: 0, foundingLeft: FOUNDING_PLACES };
  }
}
