import { prisma } from "@/lib/db";
import {
  collapseSources,
  recoveryScore,
  sleepScore,
  strainScore,
  tScore,
  type DailyMetric,
  type Score,
} from "./scores";
import {
  bodyBattery,
  fitnessAge,
  insights,
  sleepQuality,
  stressScore,
  type BodyBattery,
  type FitnessAge,
  type Insight,
  type SleepQuality,
  type Sex,
  type StressReading,
} from "./advanced";
import { FREE_HISTORY_DAYS, isPro, PRO_METRICS, type ProMetric } from "./plan";

/** How far back the trend charts and baselines reach. */
const HISTORY_DAYS = 180;

export type DashboardDay = {
  date: string;
  recovery: Score;
  strain: Score;
  sleep: Score;
  movement: Score;
};

export type Dashboard = {
  /** null when the account has no imported metrics at all. */
  latest: DashboardDay | null;
  /** How many days old the newest reading is. */
  staleDays: number;
  /** Newest first, for the trend charts. */
  history: Array<{
    date: string;
    recovery: number | null;
    /** The T Score for that day, scored only against the days before it. */
    tScore: number | null;
    /** The fitness age estimate on that day, from the days before it. */
    fitnessAge: number | null;
    hrvMs: number | null;
    restingHr: number | null;
    averageHr: number | null;
    sleepMinutes: number | null;
    steps: number | null;
    activeKcal: number | null;
    weightKg: number | null;
  }>;
  dayCount: number;
  sources: string[];
  /** Derived metrics. Null on a free plan — the shape stays the same either way. */
  advanced: {
    fitnessAge: FitnessAge | null;
    sleepQuality: SleepQuality | null;
    stress: StressReading | null;
    bodyBattery: BodyBattery | null;
    insights: Insight[];
  };
  plan: { plan: string; locked: ProMetric[] };
};

function daysBetween(from: Date, to: Date): number {
  return Math.max(0, Math.round((to.getTime() - from.getTime()) / 86_400_000));
}

/**
 * Everything the app needs for one person, computed on the server.
 *
 * Scores are derived on read rather than stored, so improving a formula
 * improves every historical day at once instead of leaving a trail of numbers
 * calculated by whichever version happened to be deployed that week.
 */
export async function loadDashboard(
  userId: string,
  activityLevel?: string | null,
  member?: {
    plan?: string | null;
    trialEndsAt?: Date | null;
    dateOfBirth?: Date | null;
    sex?: string | null;
    heightCm?: number | null;
  },
): Promise<Dashboard> {
  const since = new Date(Date.now() - HISTORY_DAYS * 86_400_000);
  const rows = await prisma.healthMetric.findMany({
    where: { userId, date: { gte: since } },
    orderBy: { date: "desc" },
  });

  const days = collapseSources(
    rows.map((row) => ({
      date: row.date,
      source: row.source,
      restingHr: row.restingHr,
      averageHr: row.averageHr,
      hrvMs: row.hrvMs,
      sleepMinutes: row.sleepMinutes,
      steps: row.steps,
      activeKcal: row.activeKcal,
      weightKg: row.weightKg,
      respiratoryRate: row.respiratoryRate,
      spo2: row.spo2,
    })),
  );

  const sources = [...new Set(rows.map((row) => row.source))];

  const pro = isPro(member?.plan, member?.trialEndsAt ?? null);
  const locked = pro ? [] : [...PRO_METRICS];
  const empty = {
    fitnessAge: null,
    sleepQuality: null,
    stress: null,
    bodyBattery: null,
    insights: [] as Insight[],
  };

  if (days.length === 0) {
    return {
      latest: null,
      staleDays: 0,
      history: [],
      dayCount: 0,
      sources,
      advanced: empty,
      plan: { plan: pro ? "pro" : "free", locked },
    };
  }

  const [today, ...rest] = days;
  const latest: DashboardDay = {
    date: today.date.toISOString(),
    recovery: recoveryScore(today, rest),
    strain: strainScore(today, rest),
    sleep: sleepScore(today, rest),
    movement: tScore(today, rest, activityLevel),
  };

  // Each historical day is scored against the days before it, never after —
  // otherwise a chart would show a recovery score that could not have existed
  // on the morning it claims to describe.
  // A free account sees a month; Pro sees the lot. The cap is applied here
  // rather than in the client so the payload itself is short — a paywall the
  // browser has to honour is not a paywall.
  const window = pro ? 90 : FREE_HISTORY_DAYS;
  const history = days.slice(0, window).map((day, index) => ({
    date: day.date.toISOString(),
    recovery: recoveryScore(day, days.slice(index + 1)).value,
    tScore: tScore(day, days.slice(index + 1), activityLevel).value,
    // Estimated per day so the modal can chart the trend. The member's age on
    // an older day is their age now, which is close enough over 90 days and
    // far better than pretending the series does not exist.
    fitnessAge: fitnessAge(day, days.slice(index + 1), {
      age: ageFrom(member?.dateOfBirth ?? null),
      sex: (member?.sex ?? "undisclosed") as Sex,
      heightCm: member?.heightCm ?? null,
    }).years,
    hrvMs: day.hrvMs,
    restingHr: day.restingHr,
    averageHr: day.averageHr,
    sleepMinutes: day.sleepMinutes,
    steps: day.steps,
    activeKcal: day.activeKcal,
    weightKg: day.weightKg,
  }));

  // The derived metrics are the paid tier, so they are not computed at all on
  // a free plan — no wasted work, and nothing sensitive to leak past the gate.
  const free = {
    ...empty,
    fitnessAge: fitnessAge(today, rest, {
      age: ageFrom(member?.dateOfBirth ?? null),
      sex: (member?.sex ?? "undisclosed") as Sex,
      heightCm: member?.heightCm ?? null,
    }),
  };

  const advanced = pro
    ? {
        ...free,
        sleepQuality: sleepQuality(today, rest),
        stress: stressScore(today, rest),
        bodyBattery: bodyBattery(days.slice(0, 30)),
        insights: insights(days),
      }
    : free;

  return {
    latest,
    staleDays: daysBetween(today.date, new Date()),
    history,
    dayCount: days.length,
    sources,
    advanced,
    plan: { plan: pro ? "pro" : "free", locked },
  };
}

/** Whole years, which is all any of these estimates can use. */
function ageFrom(dateOfBirth: Date | null): number | null {
  if (!dateOfBirth) return null;
  const years = (Date.now() - dateOfBirth.getTime()) / (365.25 * 86_400_000);
  return years >= 13 && years <= 100 ? Math.floor(years) : null;
}

export type { DailyMetric, Score };
