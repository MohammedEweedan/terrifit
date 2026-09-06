import { sleepTotals, type SleepSample } from "./health-utils/sleep";
export { hasAnyReading } from "./health-utils/readings";
import { Platform } from "react-native";
import {
  isHealthDataAvailable,
  queryCategorySamples,
  queryStatisticsCollectionForQuantity,
  requestAuthorization,
} from "@kingstinct/react-native-healthkit";

/**
 * Reading Apple Health directly.
 *
 * The band ships in November 2027, so until then this is where somebody's
 * numbers actually come from — asking people to export a file on a desktop and
 * upload it is a wall almost nobody walks through. Everything is aggregated to
 * one row per day, in SI, which is exactly the shape the existing importer on
 * the server already accepts.
 *
 * Read-only. Terrifit never writes to Health.
 */

/** Read scopes, kept to what the scores actually use. */
const READ = [
  "HKQuantityTypeIdentifierHeartRateVariabilitySDNN",
  "HKQuantityTypeIdentifierRestingHeartRate",
  "HKQuantityTypeIdentifierHeartRate",
  "HKQuantityTypeIdentifierStepCount",
  "HKQuantityTypeIdentifierActiveEnergyBurned",
  "HKQuantityTypeIdentifierBodyMass",
  "HKQuantityTypeIdentifierRespiratoryRate",
  "HKQuantityTypeIdentifierOxygenSaturation",
  "HKCategoryTypeIdentifierSleepAnalysis",
] as const;

export type DayMetrics = {
  /** Midnight UTC of the day being described, ISO. */
  date: string;
  hrvMs?: number;
  restingHr?: number;
  averageHr?: number;
  sleepMinutes?: number;
  steps?: number;
  activeKcal?: number;
  weightKg?: number;
  respiratoryRate?: number;
  spo2?: number;
};

export function healthAvailable(): boolean {
  return Platform.OS === "ios";
}

export type HealthAccess =
  /** The sheet was shown and dismissed. Says nothing about what was granted. */
  | { ok: true }
  | { ok: false; reason: "unsupported" | "unavailable" | "failed"; detail?: string };

/**
 * Shows the Health permission sheet.
 *
 * Two things about Apple's API drive the shape of this.
 *
 * First, `requestAuthorization` takes `{ toShare, toRead }`, not a bare array.
 * An earlier version passed the array straight in behind an `as unknown as`
 * cast, so the native side read `toRead` off an Array, got `undefined`, and
 * the Nitro bridge raised a native exception that no JS `catch` can see — the
 * app hard-crashed the instant anybody tapped Connect Apple Health.
 *
 * Second — and this is the one that made "Apple couldn't connect to Health"
 * so confusing — the boolean it resolves with is Apple's `success` flag,
 * meaning *the request completed*. It is not a grant. Apple deliberately never
 * reports read authorisation, because telling an app "denied" would leak that
 * the person has data for that type. Treating `false` as "the user said no"
 * therefore sent people to Settings to fix a permission that was already on.
 *
 * So this reports whether the *request* worked, and carries the real error
 * when it did not. Whether we can actually read is answered by reading.
 *
 * `toShare` is deliberately absent rather than empty. Terrifit never writes to
 * Health, and asking for write scope would put a second, dishonest column in
 * the permission sheet.
 */
export async function requestHealthAccess(): Promise<HealthAccess> {
  if (!healthAvailable()) return { ok: false, reason: "unsupported" };
  if (!(await isHealthDataAvailable())) return { ok: false, reason: "unavailable" };
  try {
    await requestAuthorization({ toRead: READ });
    return { ok: true };
  } catch (caught) {
    // Swallowing this is what turned every cause — a missing entitlement, an
    // unknown type identifier, a locked device — into the same wrong sentence.
    return {
      ok: false,
      reason: "failed",
      detail: caught instanceof Error ? caught.message : String(caught),
    };
  }
}



function dayKey(date: Date): string {
  return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())).toISOString();
}

type Collector = Map<string, DayMetrics>;

function put(days: Collector, date: Date, patch: Partial<DayMetrics>): void {
  const key = dayKey(date);
  const existing = days.get(key) ?? { date: key };
  days.set(key, { ...existing, ...patch });
}

/** One statistic per day for a quantity type, folded into the collector. */
async function collectDaily(
  days: Collector,
  identifier: string,
  statistic: "discreteAverage" | "cumulativeSum",
  since: Date,
  assign: (value: number) => Partial<DayMetrics>,
): Promise<void> {
  const rows = await queryStatisticsCollectionForQuantity(
    identifier as Parameters<typeof queryStatisticsCollectionForQuantity>[0],
    [statistic] as unknown as Parameters<typeof queryStatisticsCollectionForQuantity>[1],
    since,
    { day: 1 } as unknown as Parameters<typeof queryStatisticsCollectionForQuantity>[3],
    { filter: { startDate: since } } as unknown as Parameters<typeof queryStatisticsCollectionForQuantity>[4],
  ).catch(() => [] as never[]);

  for (const row of rows) {
    const record = row as unknown as {
      startDate: string | Date;
      averageQuantity?: { quantity: number };
      sumQuantity?: { quantity: number };
    };
    const value = statistic === "cumulativeSum" ? record.sumQuantity?.quantity : record.averageQuantity?.quantity;
    if (value == null || Number.isNaN(value)) continue;
    put(days, new Date(record.startDate), assign(value));
  }
}

/**
 * Sleep is a category type, not a quantity: it arrives as intervals with a
 * stage value. Only the asleep stages count — time in bed is not sleep — and
 * a night is attributed to the day it ends on, which is how everybody reads it.
 */
async function collectSleep(days: Collector, since: Date): Promise<void> {
  const samples = await queryCategorySamples(
    "HKCategoryTypeIdentifierSleepAnalysis" as Parameters<typeof queryCategorySamples>[0],
    { filter: { startDate: since }, ascending: true } as unknown as Parameters<typeof queryCategorySamples>[1],
  ).catch(() => [] as never[]);

  const totals = sleepTotals(samples as unknown as SleepSample[], Intl.DateTimeFormat().resolvedOptions().timeZone);
  for (const [key, minutes] of totals) {
    const existing = days.get(key) ?? { date: key };
    days.set(key, { ...existing, sleepMinutes: Math.round(minutes) });
  }
}

/** Everything the scores need, one row per day, newest last. */
export async function readHealth(daysBack = 90): Promise<DayMetrics[]> {
  if (!healthAvailable()) return [];
  const since = new Date(Date.now() - daysBack * 86_400_000);
  const days: Collector = new Map();

  await Promise.all([
    collectDaily(days, "HKQuantityTypeIdentifierHeartRateVariabilitySDNN", "discreteAverage", since, (v) => ({
      // HealthKit reports SDNN in seconds; the rest of Terrifit uses ms.
      hrvMs: v < 5 ? v * 1000 : v,
    })),
    collectDaily(days, "HKQuantityTypeIdentifierRestingHeartRate", "discreteAverage", since, (v) => ({
      restingHr: Math.round(v),
    })),
    collectDaily(days, "HKQuantityTypeIdentifierHeartRate", "discreteAverage", since, (v) => ({
      // The whole day's mean, not the resting floor: it carries training load,
      // caffeine and stress in a way the resting figure deliberately does not.
      averageHr: Math.round(v),
    })),
    collectDaily(days, "HKQuantityTypeIdentifierStepCount", "cumulativeSum", since, (v) => ({
      steps: Math.round(v),
    })),
    collectDaily(days, "HKQuantityTypeIdentifierActiveEnergyBurned", "cumulativeSum", since, (v) => ({
      activeKcal: Math.round(v),
    })),
    collectDaily(days, "HKQuantityTypeIdentifierBodyMass", "discreteAverage", since, (v) => ({ weightKg: v })),
    collectDaily(days, "HKQuantityTypeIdentifierRespiratoryRate", "discreteAverage", since, (v) => ({
      respiratoryRate: v,
    })),
    collectDaily(days, "HKQuantityTypeIdentifierOxygenSaturation", "discreteAverage", since, (v) => ({
      // Reported 0–1; stored as a percentage.
      spo2: v <= 1 ? v * 100 : v,
    })),
    collectSleep(days, since),
  ]);

  return [...days.values()].sort((a, b) => a.date.localeCompare(b.date));
}
