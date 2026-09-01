/**
 * The scoring engine.
 *
 * WHOOP's numbers are good and completely opaque: you get a recovery
 * percentage and no way to see why. Every score here carries the inputs that
 * produced it, the weight each one had, and what is missing — so the app can
 * always answer "why is it that number", which is the whole point of the thing.
 *
 * Nothing here invents data. A score with no inputs returns null and the UI
 * says so rather than drawing an encouraging ring around a guess.
 */

export type DailyMetric = {
  date: Date;
  restingHr: number | null;
  averageHr: number | null;
  hrvMs: number | null;
  sleepMinutes: number | null;
  steps: number | null;
  activeKcal: number | null;
  weightKg: number | null;
  respiratoryRate: number | null;
  spo2: number | null;
};

export type ScoreBand = "good" | "fair" | "poor" | "unknown";

export type ScoreInput = {
  label: string;
  /** Today's reading, already formatted. */
  value: string;
  /** What it is being compared against, formatted. */
  baseline: string | null;
  /** Share of the final score this input carried, 0–1 after redistribution. */
  weight: number;
  /** This input's own 0–100 sub-score. */
  contribution: number;
  /** Which way is better, for the arrow the UI draws. */
  direction: "higher" | "lower" | "target";
};

export type Score = {
  /** null when there is not enough data to say anything honest. */
  value: number | null;
  band: ScoreBand;
  inputs: ScoreInput[];
  /** Metrics that would sharpen the score if they were present. */
  missing: string[];
  /** Where the number genuinely cannot be as good as the hardware version. */
  caveat?: string;
};

/* -------------------------------------------------------------------------- */
/* Baselines                                                                  */

export type Baseline = { mean: number; sd: number; n: number };

/** At least this many days before a personal baseline means anything. */
const MIN_BASELINE_DAYS = 5;
const BASELINE_WINDOW = 30;

/**
 * A rolling personal baseline. Population norms are useless here — a resting
 * heart rate of 58 is unremarkable for one person and a red flag for another,
 * so everything is scored against the person's own recent history.
 */
export function baselineFor(
  history: DailyMetric[],
  field: keyof DailyMetric,
  window = BASELINE_WINDOW,
): Baseline | null {
  const values = history
    .slice(0, window)
    .map((day) => day[field])
    .filter((value): value is number => typeof value === "number" && Number.isFinite(value));

  if (values.length < MIN_BASELINE_DAYS) return null;

  const mean = values.reduce((total, value) => total + value, 0) / values.length;
  const variance =
    values.reduce((total, value) => total + (value - mean) ** 2, 0) / values.length;
  // A floor on the deviation stops a freakishly consistent fortnight turning
  // every ordinary reading into a ±3σ event.
  return { mean, sd: Math.max(Math.sqrt(variance), Math.abs(mean) * 0.02, 0.5), n: values.length };
}

const clamp = (value: number, min = 0, max = 100) => Math.min(max, Math.max(min, value));

/** Maps a z-score onto 0–100, where ±2σ lands near the ends. */
function fromZ(z: number): number {
  return clamp(50 + z * 22);
}

/* -------------------------------------------------------------------------- */
/* Recovery                                                                   */

type Weighted = { input: ScoreInput; raw: number };

/**
 * Combines whatever inputs are present, redistributing the weight of the ones
 * that are not. A recovery score built from HRV and sleep alone is worth
 * showing; it is just worth showing as such, which is what `missing` is for.
 */
function combine(parts: Weighted[], missing: string[]): Score {
  if (parts.length === 0) {
    return { value: null, band: "unknown", inputs: [], missing };
  }

  const declared = parts.reduce((total, part) => total + part.input.weight, 0);
  const inputs = parts.map((part) => ({
    ...part.input,
    weight: part.input.weight / declared,
  }));
  const value = Math.round(
    inputs.reduce((total, input) => total + input.contribution * input.weight, 0),
  );

  return { value, band: bandFor(value), inputs, missing };
}

export function bandFor(value: number): ScoreBand {
  if (value >= 67) return "good";
  if (value >= 34) return "fair";
  return "poor";
}

/**
 * Recovery: how ready the body is today, against its own recent normal.
 *
 * Weights follow the physiology rather than what is easiest to measure — HRV
 * carries the most because it moves first and moves most.
 */
export function recoveryScore(today: DailyMetric, history: DailyMetric[]): Score {
  const parts: Weighted[] = [];
  const missing: string[] = [];

  const hrvBase = baselineFor(history, "hrvMs");
  if (today.hrvMs !== null && hrvBase) {
    const z = (today.hrvMs - hrvBase.mean) / hrvBase.sd;
    parts.push({
      raw: today.hrvMs,
      input: {
        label: "Heart-rate variability",
        value: `${Math.round(today.hrvMs)} ms`,
        baseline: `${Math.round(hrvBase.mean)} ms average`,
        weight: 0.45,
        contribution: fromZ(z),
        direction: "higher",
      },
    });
  } else missing.push("Heart-rate variability");

  const rhrBase = baselineFor(history, "restingHr");
  if (today.restingHr !== null && rhrBase) {
    // Inverted: a resting heart rate below your own normal is the good side.
    const z = (rhrBase.mean - today.restingHr) / rhrBase.sd;
    parts.push({
      raw: today.restingHr,
      input: {
        label: "Resting heart rate",
        value: `${Math.round(today.restingHr)} bpm`,
        baseline: `${Math.round(rhrBase.mean)} bpm average`,
        weight: 0.25,
        contribution: fromZ(z),
        direction: "lower",
      },
    });
  } else missing.push("Resting heart rate");

  if (today.sleepMinutes !== null) {
    const performance = clamp((today.sleepMinutes / SLEEP_NEED_MINUTES) * 100);
    parts.push({
      raw: today.sleepMinutes,
      input: {
        label: "Sleep",
        value: formatDuration(today.sleepMinutes),
        baseline: `${formatDuration(SLEEP_NEED_MINUTES)} needed`,
        weight: 0.2,
        contribution: performance,
        direction: "higher",
      },
    });
  } else missing.push("Sleep");

  const rrBase = baselineFor(history, "respiratoryRate");
  if (today.respiratoryRate !== null && rrBase) {
    // Deviation in either direction is the signal here, not the direction.
    const drift = Math.abs(today.respiratoryRate - rrBase.mean) / rrBase.sd;
    parts.push({
      raw: today.respiratoryRate,
      input: {
        label: "Respiratory rate",
        value: `${today.respiratoryRate.toFixed(1)} /min`,
        baseline: `${rrBase.mean.toFixed(1)} /min average`,
        weight: 0.1,
        contribution: clamp(100 - drift * 30),
        direction: "target",
      },
    });
  } else missing.push("Respiratory rate");

  return combine(parts, missing);
}

/* -------------------------------------------------------------------------- */
/* Sleep                                                                      */

/** Eight hours. Personalised sleep need needs the band's stage data. */
export const SLEEP_NEED_MINUTES = 480;

export function sleepScore(today: DailyMetric, history: DailyMetric[]): Score {
  if (today.sleepMinutes === null) {
    return { value: null, band: "unknown", inputs: [], missing: ["Sleep"] };
  }

  const parts: Weighted[] = [
    {
      raw: today.sleepMinutes,
      input: {
        label: "Time asleep",
        value: formatDuration(today.sleepMinutes),
        baseline: `${formatDuration(SLEEP_NEED_MINUTES)} needed`,
        weight: 0.75,
        contribution: clamp((today.sleepMinutes / SLEEP_NEED_MINUTES) * 100),
        direction: "higher",
      },
    },
  ];

  // Consistency matters nearly as much as duration, and it is measurable from
  // daily totals alone — unlike stages, which need the band.
  const sleepBase = baselineFor(history, "sleepMinutes");
  if (sleepBase) {
    const drift = Math.abs(today.sleepMinutes - sleepBase.mean) / sleepBase.sd;
    parts.push({
      raw: today.sleepMinutes,
      input: {
        label: "Consistency",
        value: `${drift < 1 ? "In" : "Outside"} your usual range`,
        baseline: `${formatDuration(Math.round(sleepBase.mean))} average`,
        weight: 0.25,
        contribution: clamp(100 - drift * 25),
        direction: "target",
      },
    });
  }

  const score = combine(parts, sleepBase ? [] : ["Sleep history"]);
  return { ...score, caveat: "Stages, and a sleep need that adapts to your day, need a V1." };
}

/* -------------------------------------------------------------------------- */
/* Strain                                                                     */

/** Strain runs 0–21, like the rest of the category, so numbers are comparable. */
export const STRAIN_MAX = 21;

/**
 * Cardiovascular load for the day.
 *
 * Real strain integrates heart rate against your reserve, second by second.
 * Without a band on the wrist there is no heart rate to integrate, so this is
 * derived from active energy against your own normal day — a decent proxy for
 * how hard the day was, and labelled as a proxy everywhere it appears.
 */
export function strainScore(today: DailyMetric, history: DailyMetric[]): Score {
  if (today.activeKcal === null) {
    return {
      value: null,
      band: "unknown",
      inputs: [],
      missing: ["Active energy"],
      caveat: "Continuous strain needs a V1 on your wrist.",
    };
  }

  const base = baselineFor(history, "activeKcal");
  const reference = Math.max(150, base?.mean ?? 350);
  const ratio = today.activeKcal / reference;
  // Logarithmic, so the top of the scale is genuinely hard to reach: an
  // ordinary day lands near 11 and three times your normal load hits 21.
  const strain = STRAIN_MAX * (Math.log(1 + 1.4 * ratio) / Math.log(1 + 1.4 * 3));

  const inputs: ScoreInput[] = [
    {
      label: "Active energy",
      value: `${Math.round(today.activeKcal)} kcal`,
      baseline: base ? `${Math.round(base.mean)} kcal average` : "no baseline yet",
      weight: 1,
      contribution: clamp((strain / STRAIN_MAX) * 100),
      direction: "higher",
    },
  ];

  if (today.steps !== null) {
    inputs.push({
      label: "Steps",
      value: today.steps.toLocaleString(),
      baseline: null,
      weight: 0,
      contribution: 0,
      direction: "higher",
    });
  }

  return {
    value: Math.round(Math.min(STRAIN_MAX, strain) * 10) / 10,
    band: "unknown",
    inputs,
    missing: base ? [] : ["Two weeks of history"],
    caveat: "Estimated from active energy. Continuous strain needs a V1 on your wrist.",
  };
}

/* -------------------------------------------------------------------------- */
/* T Score                                                                    */

type ActivityLevel = "sedentary" | "light" | "moderate" | "high" | "athlete";

/**
 * Daily movement targets by self-reported activity level.
 *
 * Deliberately absolute rather than personal: a T Score measured against your
 * own average would hand a sedentary week a perfect hundred, which is the
 * opposite of useful.
 */
const T_TARGETS: Record<ActivityLevel, { steps: number; kcal: number }> = {
  sedentary: { steps: 6000, kcal: 300 },
  light: { steps: 8000, kcal: 400 },
  moderate: { steps: 10000, kcal: 500 },
  high: { steps: 12000, kcal: 650 },
  athlete: { steps: 14000, kcal: 800 },
};

/**
 * The T Score: how active you were today, read three ways.
 *
 * A single absolute target treats everybody the same and tells a marathoner
 * nothing. A purely personal comparison hands a sedentary week a perfect
 * hundred, which is worse. So the score is a blend, and the absolute rate keeps
 * the largest share so it stays honest:
 *
 *   55%  Rate — steps and active energy against the target for your level.
 *   30%  History — today against your own last 30 days.
 *   15%  Trend — whether the last week is climbing or sliding.
 *
 * Any component without enough data drops out and its weight is redistributed
 * across the rest, so a new account still gets a real number from the rate
 * alone rather than a number that is 45% guesswork.
 */
export function tScore(today: DailyMetric, history: DailyMetric[] = [], activityLevel?: string | null): Score {
  const target = T_TARGETS[(activityLevel as ActivityLevel) ?? "moderate"] ?? T_TARGETS.moderate;
  const parts: Weighted[] = [];
  const missing: string[] = [];

  if (today.steps !== null) {
    parts.push({
      raw: today.steps,
      input: {
        label: "Steps",
        value: today.steps.toLocaleString(),
        baseline: `${target.steps.toLocaleString()} target`,
        weight: 0.32,
        contribution: clamp((today.steps / target.steps) * 100),
        direction: "higher",
      },
    });
  } else missing.push("Steps");

  if (today.activeKcal !== null) {
    parts.push({
      raw: today.activeKcal,
      input: {
        label: "Active energy",
        value: `${Math.round(today.activeKcal)} kcal`,
        baseline: `${target.kcal} kcal target`,
        weight: 0.23,
        contribution: clamp((today.activeKcal / target.kcal) * 100),
        direction: "higher",
      },
    });
  } else missing.push("Active energy");

  // Load is the one number that combines the two: steps carry duration and
  // active energy carries intensity, and either alone is easy to game.
  const load = (day: DailyMetric): number | null => {
    if (day.steps === null && day.activeKcal === null) return null;
    return (day.steps ?? 0) / target.steps + (day.activeKcal ?? 0) / target.kcal;
  };

  const todayLoad = load(today);
  const recent = history.slice(0, 30).map(load).filter((value): value is number => value !== null);

  if (todayLoad !== null && recent.length >= 7) {
    const usual = recent.reduce((sum, value) => sum + value, 0) / recent.length;
    // 50 is "exactly your usual day". Doubling it reads 100; half reads 0.
    const ratio = usual > 0 ? todayLoad / usual : 1;
    parts.push({
      raw: ratio,
      input: {
        label: "Against your usual",
        value: `${Math.round(ratio * 100)}% of a normal day`,
        baseline: `${recent.length}-day average`,
        weight: 0.3,
        contribution: clamp(50 + (ratio - 1) * 50),
        direction: "higher",
      },
    });
  } else missing.push("Against your usual");

  const week = recent.slice(0, 7);
  const prior = recent.slice(7, 28);
  if (week.length >= 4 && prior.length >= 7) {
    const weekMean = week.reduce((sum, value) => sum + value, 0) / week.length;
    const priorMean = prior.reduce((sum, value) => sum + value, 0) / prior.length;
    const drift = priorMean > 0 ? weekMean / priorMean : 1;
    const percent = Math.round((drift - 1) * 100);
    parts.push({
      raw: drift,
      input: {
        label: "Direction",
        value:
          Math.abs(percent) < 3
            ? "Holding steady"
            : `${Math.abs(percent)}% ${percent > 0 ? "up" : "down"} on the fortnight before`,
        baseline: "Last 7 days vs the 3 weeks before",
        weight: 0.15,
        // A 25% swing either way is as far as this component moves the score;
        // beyond that it is a training block, not a daily signal.
        contribution: clamp(50 + (drift - 1) * 200),
        direction: "higher",
      },
    });
  } else missing.push("Direction");

  return combine(parts, missing);
}

/* -------------------------------------------------------------------------- */

export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const rest = Math.round(minutes % 60);
  return hours > 0 ? `${hours}h ${String(rest).padStart(2, "0")}m` : `${rest}m`;
}

/** Picks one reading per day, preferring the source with the most fields filled. */
export function collapseSources(rows: Array<DailyMetric & { source: string }>): DailyMetric[] {
  const byDay = new Map<string, DailyMetric>();
  const fieldCount = (row: DailyMetric) =>
    (["restingHr", "averageHr", "hrvMs", "sleepMinutes", "steps", "activeKcal", "respiratoryRate", "spo2"] as const)
      .filter((key) => row[key] !== null && row[key] !== undefined).length;

  for (const row of rows) {
    const key = row.date.toISOString().slice(0, 10);
    const existing = byDay.get(key);
    if (!existing) {
      byDay.set(key, row);
      continue;
    }
    // Merge field by field so two partial sources make one complete day.
    const merged: DailyMetric = { ...existing };
    for (const key2 of ["restingHr", "averageHr", "hrvMs", "sleepMinutes", "steps", "activeKcal", "weightKg", "respiratoryRate", "spo2"] as const) {
      if (merged[key2] === null || merged[key2] === undefined) {
        (merged[key2] as number | null) = row[key2];
      }
    }
    byDay.set(key, fieldCount(row) > fieldCount(existing) ? { ...row, ...stripNulls(merged) } : merged);
  }

  return [...byDay.values()].sort((a, b) => b.date.getTime() - a.date.getTime());
}

function stripNulls(row: DailyMetric): Partial<DailyMetric> {
  return Object.fromEntries(
    Object.entries(row).filter(([, value]) => value !== null && value !== undefined),
  ) as Partial<DailyMetric>;
}
