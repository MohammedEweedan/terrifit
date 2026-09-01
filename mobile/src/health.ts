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

/** Prompts once. iOS never reveals what was denied, only that the sheet closed. */
export async function requestHealthAccess(): Promise<boolean> {
  if (!healthAvailable()) return false;
  if (!(await isHealthDataAvailable())) return false;
  // The types are generated per-identifier; the array is checked at runtime by
  // HealthKit itself, which is the only authority on what it will grant.
  return requestAuthorization(READ as unknown as Parameters<typeof requestAuthorization>[0]);
}

function dayKey(date: Date): string {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())).toISOString();
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

  const totals = new Map<string, number>();
  for (const sample of samples) {
    const record = sample as unknown as { startDate: string | Date; endDate: string | Date; value: number };
    // 0 is "in bed"; 1 and above are the asleep stages.
    if (record.value === 0) continue;
    const end = new Date(record.endDate);
    const minutes = (end.getTime() - new Date(record.startDate).getTime()) / 60_000;
    if (minutes <= 0) continue;
    const key = dayKey(end);
    totals.set(key, (totals.get(key) ?? 0) + minutes);
  }

  for (const [key, minutes] of totals) {
    put(days, new Date(key), { sleepMinutes: Math.round(minutes) });
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
