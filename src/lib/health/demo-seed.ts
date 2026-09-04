import { prisma } from "../db";

/**
 * Plausible history for a brand-new account, so the app has something to show.
 *
 * This exists for screenshots, demos and development. An empty Today screen is
 * an honest screen and a useless picture — every capture of it is six dashes
 * and the word "no data", which tells a viewer nothing about the product.
 *
 * **It is off unless explicitly switched on.** Fabricated health data reaching a
 * real member would be indefensible: they would be shown a recovery score for a
 * night they did not sleep, computed from readings that never happened. So it
 * requires `TERRIFIT_DEMO_DATA=true` and refuses outright in production unless
 * that flag is set deliberately. The rows it writes are all stamped with the
 * source `demo`, so they are trivially identifiable and removable, and the
 * dashboard names its sources on screen — a seeded account says "demo" on the
 * Today screen rather than pretending to be an Apple Watch.
 */

export const DEMO_SOURCE = "demo";

export function demoDataEnabled(): boolean {
  return process.env.TERRIFIT_DEMO_DATA === "true";
}

/** Deterministic noise, so a given day always produces the same figure. */
function wobble(seed: number, spread: number): number {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return (x - Math.floor(x) - 0.5) * 2 * spread;
}

/**
 * Ninety days of a real-looking training block.
 *
 * The shape matters more than the numbers: a slow upward drift in HRV and a
 * slow downward drift in resting heart rate, a weekly rhythm where weekends
 * sleep longer and move less, and one deload week where everything recovers.
 * Flat random noise looks fake at a glance; this does not.
 */
export async function seedDemoHistory(userId: string, days = 90): Promise<number> {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const rows = [];

  for (let ago = days - 1; ago >= 0; ago--) {
    const date = new Date(today);
    date.setUTCDate(date.getUTCDate() - ago);

    const progress = (days - ago) / days;
    const weekday = date.getUTCDay();
    const weekend = weekday === 0 || weekday === 6;
    // One deload in the middle of the block, where load drops and everything
    // bounces — the pattern that makes a recovery chart legible.
    const deload = ago >= 34 && ago <= 40;

    const hrv = 58 + progress * 12 + (deload ? 6 : 0) + wobble(ago + 1, 5.5);
    const restingHr = 54 - progress * 4 - (deload ? 2 : 0) + wobble(ago + 2, 2.4);
    const sleep = (weekend ? 470 : 425) + (deload ? 25 : 0) + wobble(ago + 3, 38);
    const steps = (weekend ? 6800 : 10200) - (deload ? 1500 : 0) + wobble(ago + 4, 2600);
    const active = (weekend ? 380 : 620) - (deload ? 190 : 0) + wobble(ago + 5, 150);
    const weight = 84.6 - progress * 1.8 + wobble(ago + 6, 0.45);

    rows.push({
      userId,
      date,
      source: DEMO_SOURCE,
      restingHr: Math.round(restingHr),
      averageHr: Math.round(restingHr + 18 + wobble(ago + 7, 5)),
      hrvMs: Math.round(hrv * 10) / 10,
      sleepMinutes: Math.round(sleep),
      steps: Math.max(0, Math.round(steps)),
      activeKcal: Math.max(0, Math.round(active)),
      weightKg: Math.round(weight * 10) / 10,
      respiratoryRate: Math.round((14.2 + wobble(ago + 8, 0.9)) * 10) / 10,
      spo2: Math.round((96.8 + wobble(ago + 9, 0.9)) * 10) / 10,
    });
  }

  // `createMany` with skipDuplicates so re-seeding an account is harmless —
  // the unique key is (user, day, source).
  const written = await prisma.healthMetric.createMany({ data: rows, skipDuplicates: true });

  // Three body scans across the block, which is what somebody with a gym
  // InBody actually has: not one a week, and not none.
  const scans = [70, 35, 4].map((ago, index) => {
    const takenAt = new Date(today);
    takenAt.setUTCDate(takenAt.getUTCDate() - ago);
    const step = index / 2;
    return {
      userId,
      source: DEMO_SOURCE,
      takenAt,
      weightKg: Math.round((85.1 - step * 1.9) * 10) / 10,
      bodyFatPercent: Math.round((19.4 - step * 2.1) * 10) / 10,
      skeletalMuscleKg: Math.round((38.2 + step * 0.7) * 10) / 10,
      leanMassKg: Math.round((68.6 + step * 0.9) * 10) / 10,
      bodyWaterL: Math.round((50.2 + step * 0.6) * 10) / 10,
      visceralFatLevel: Math.round((8 - step * 1.2) * 10) / 10,
      basalMetabolicRate: Math.round(1780 + step * 22),
      score: Math.round(78 + step * 5),
    };
  });

  await prisma.bodyScan.createMany({ data: scans, skipDuplicates: true });

  return written.count;
}

/** Everything this seeder wrote, and nothing else. */
export async function clearDemoHistory(userId: string): Promise<void> {
  await prisma.healthMetric.deleteMany({ where: { userId, source: DEMO_SOURCE } });
  await prisma.bodyScan.deleteMany({ where: { userId, source: DEMO_SOURCE } });
}
