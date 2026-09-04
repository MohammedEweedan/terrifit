/**
 * Derived health metrics.
 *
 * Everything here is an *estimate* built from what a wrist sensor and a phone
 * can actually see — resting heart rate, heart-rate variability, sleep
 * duration, movement and weight. None of it is a clinical measurement, and the
 * copy that renders it must never imply otherwise.
 *
 * Where an established method exists, it is used and cited rather than
 * invented, because a number nobody can trace is a number nobody should trust:
 *
 *   - VO₂max from resting heart rate — Uth, Sørensen, Overgaard & Pedersen
 *     (2004), "Estimation of VO2max from the ratio between HRmax and HRrest".
 *   - Maximum heart rate — Tanaka, Monahan & Seals (2001), 208 − 0.7 × age,
 *     which is materially better than the folk 220 − age.
 *   - Fitness age — the HUNT Fitness Study approach (Nes et al., 2011): the age
 *     at which your estimated VO₂max would be the population median.
 *   - Stress and body battery follow the published shape of Firstbeat's
 *     analytics — HRV suppressed against a personal baseline as the stress
 *     signal, and a reservoir charged by sleep and drained by load.
 */

import { baselineFor, bandFor, formatDuration, SLEEP_NEED_MINUTES, type DailyMetric, type ScoreBand } from "./scores";

export type Sex = "female" | "male" | "other" | "undisclosed";

const clamp = (value: number, min = 0, max = 100) => Math.min(max, Math.max(min, value));

function mean(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((total, value) => total + value, 0) / values.length;
}

function pick(history: DailyMetric[], field: keyof DailyMetric, days: number): number[] {
  return history
    .slice(0, days)
    .map((day) => day[field])
    .filter((value): value is number => typeof value === "number" && Number.isFinite(value));
}

/* -------------------------------------------------------------------------- */
/* Fitness age                                                                */

export type FitnessAge = {
  /** Estimated years. Null when there is not enough to say. */
  years: number | null;
  chronological: number | null;
  /** Negative is younger than your birthday says. Always `years − chronological`. */
  delta: number | null;
  /**
   * True when the estimate ran past what this method can resolve and was
   * pinned to the limit. The number is then a bound, not a reading, and the UI
   * has to say so — otherwise "18" looks like a measurement.
   */
  capped: boolean;
  vo2max: number | null;
  /** Everything the estimate leaned on, for the "why this number" panel. */
  basis: string[];
  /**
   * The same inputs, structured, so the app can plot each one rather than
   * printing a bullet list. `position` is 0–1 across the range this input can
   * meaningfully take, and `effect` is the direction it pushed the estimate.
   */
  factors: FitnessFactor[];
  caveat: string;
};

export type FitnessFactor = {
  label: string;
  /** Already formatted, with its unit. */
  value: string;
  /** Where this reading sits in its own range, 0–1. */
  position: number;
  /** What it did to the number: younger, older, or nothing either way. */
  effect: "younger" | "older" | "neutral";
  /** A few words on why it counts. */
  note: string;
};

/**
 * The furthest this method claims in either direction.
 *
 * Ten years is already generous for an estimate built on one signal. Published
 * fitness-age tools land inside that for almost everybody.
 */
export const MAX_SWING = 10;

/**
 * How sharply a resting heart rate moves the answer.
 *
 * Applied to a z-score and passed through `tanh`, so the curve is steep near
 * the median — where most people are, and where a few beats genuinely mean
 * something — and flattens at the tails instead of running away.
 */
export const SENSITIVITY = 0.5;

/** Population spread of resting heart rate, in beats. */
const RESTING_HR_SD = 9.5;

/** Tanaka et al. (2001). Population estimate; individuals vary by ±10 bpm. */
export function maxHeartRate(age: number): number {
  return 208 - 0.7 * age;
}

/**
 * Uth–Sørensen–Overgaard–Pedersen (2004).
 *
 * Validated in trained and untrained adults, and the only VO₂max estimate that
 * needs nothing but two heart rates — which is all a screenless band has.
 */
export function estimateVo2Max(age: number, restingHr: number): number {
  return 15.3 * (maxHeartRate(age) / restingHr);
}

/**
 * Median resting heart rate, by sex.
 *
 * Population resting heart rate is close to flat across adult ages — it is
 * fitness, not birthdays, that moves it — so these are constants rather than
 * curves. Men sit a few beats below women.
 */
export function medianRestingHr(sex: Sex): number {
  if (sex === "female") return 74;
  if (sex === "male") return 70;
  return 72;
}

/**
 * Median VO₂max for an age and sex, linearised from the ACSM/Cooper Institute
 * normative tables. Retained for the displayed VO₂max estimate.
 *
 * The slope matters as much as the intercept. Cardiorespiratory fitness falls
 * roughly ten per cent a decade in adults — about 0.45 ml/kg/min a year for
 * men and 0.37 for women. A shallower curve makes the inversion wildly
 * over-sensitive: with a 0.28 slope, ten beats off a resting heart rate took
 * twenty-two years off the answer, which is not a thing ten beats can do.
 *
 * Checks against the ACSM 50th percentile: men 25 → 45.8 (table ~43), 45 →
 * 36.8 (~36), 65 → 27.8 (~28). Women 25 → 37.8 (~37), 45 → 30.4 (~30).
 */
export function slopeFor(sex: Sex): number {
  if (sex === "female") return 0.37;
  if (sex === "male") return 0.45;
  // Anyone who has not told us is scored on the midpoint rather than assumed male.
  return 0.41;
}

export function interceptFor(sex: Sex): number {
  if (sex === "female") return 47;
  if (sex === "male") return 57;
  return 52;
}

/**
 * The age at which this fitness would be unremarkable.
 *
 * BMI and training volume shift the result because both independently predict
 * cardiorespiratory fitness in the HUNT model; neither is allowed to dominate,
 * because the heart-rate signal is the measured part and these are context.
 */
export function fitnessAge(
  today: DailyMetric,
  history: DailyMetric[],
  profile: { age: number | null; sex: Sex; heightCm: number | null },
): FitnessAge {
  const caveat =
    "Estimated from resting heart rate, not measured in a lab, and deliberately conservative — one signal cannot resolve more than about a decade either way. Treat the direction it moves over months as the signal, not the number on any one day.";

  const restingValues = [today.restingHr, ...pick(history, "restingHr", 30)].filter(
    (value): value is number => typeof value === "number",
  );
  const restingHr = mean(restingValues.slice(0, 14));

  if (profile.age == null || restingHr == null || restingValues.length < 5) {
    return { years: null, chronological: profile.age, delta: null, capped: false, vo2max: null, basis: [], factors: [], caveat };
  }

  const basis: string[] = [
    `Resting heart rate ${Math.round(restingHr)} bpm, averaged over ${Math.min(14, restingValues.length)} days`,
    `Estimated maximum heart rate ${Math.round(maxHeartRate(profile.age))} bpm`,
  ];

  const factors: FitnessFactor[] = [];

  // Resting heart rate is the input that actually moves the number, so it is
  // plotted against the population spread rather than an arbitrary scale:
  // 40 bpm is athletic, 90 is high, and the bar reads left-to-right as better.
  const restingPosition = Math.max(0, Math.min(1, (90 - restingHr) / 50));
  factors.push({
    label: "Resting heart rate",
    value: `${Math.round(restingHr)} bpm`,
    position: restingPosition,
    effect: restingHr < medianRestingHr(profile.sex) ? "younger" : restingHr > medianRestingHr(profile.sex) ? "older" : "neutral",
    note: `Averaged over ${Math.min(14, restingValues.length)} days`,
  });

  let vo2 = estimateVo2Max(profile.age, restingHr);

  // Body composition and training volume are context, not measurement: each
  // can move the answer by at most about a year and a half.
  let adjustment = 0;

  const weight = today.weightKg ?? mean(pick(history, "weightKg", 30));
  if (weight != null && profile.heightCm) {
    const bmi = weight / (profile.heightCm / 100) ** 2;
    if (bmi > 25) {
      adjustment += Math.min(1.5, (bmi - 25) * 0.15);
      basis.push(`BMI ${bmi.toFixed(1)}, which the estimate adjusts for`);
    } else if (bmi < 18.5) {
      adjustment += Math.min(1, (18.5 - bmi) * 0.15);
      basis.push(`BMI ${bmi.toFixed(1)}, below the healthy range`);
    } else {
      basis.push(`BMI ${bmi.toFixed(1)}, inside the healthy range`);
    }

    // Plotted so the middle of the bar is the middle of the healthy range,
    // because both ends of BMI count against the estimate.
    factors.push({
      label: "Body mass index",
      value: bmi.toFixed(1),
      position: Math.max(0, Math.min(1, 1 - Math.abs(bmi - 21.75) / 10)),
      effect: bmi > 25 || bmi < 18.5 ? "older" : "neutral",
      note: bmi > 25 ? "Above the healthy range" : bmi < 18.5 ? "Below the healthy range" : "Inside the healthy range",
    });
  }

  // Training volume. The HUNT model asks how often and how hard you exercise;
  // active energy is the closest thing we measure.
  const kcal = mean(pick(history, "activeKcal", 28));
  if (kcal != null) {
    if (kcal >= 600) {
      adjustment -= 1;
      basis.push(`${Math.round(kcal)} kcal a day of activity on average`);
    } else if (kcal < 200) {
      adjustment += 1;
      basis.push(`${Math.round(kcal)} kcal a day of activity, which is light`);
    } else {
      basis.push(`${Math.round(kcal)} kcal a day of activity on average`);
    }

    factors.push({
      label: "Daily activity",
      value: `${Math.round(kcal)} kcal`,
      // 800 kcal a day of active energy is where the benefit plateaus here.
      position: Math.max(0, Math.min(1, kcal / 800)),
      effect: kcal >= 600 ? "younger" : kcal < 200 ? "older" : "neutral",
      note: "Active energy, 28-day average",
    });
  }

  // Still reported, because it is a recognisable figure — but it no longer
  // drives the answer.
  vo2 = Math.max(15, Math.min(75, vo2));

  // Map the resting heart rate onto an age offset through a compressive curve.
  //
  // Inverting a VO₂max estimate against an age curve is linear in the *ratio*
  // of heart rates, and that ratio is savage: a resting rate of 50 against a
  // median of 70 is 29% lower, which the linear form turned into forty years
  // and then clamped. A 32-year-old came out as 20, which is not a claim a
  // single number can support.
  //
  // A z-score through `tanh` behaves the way the underlying biology does:
  // steep near the median, where a few beats genuinely separate people, and
  // flattening at the tails where the estimate stops being able to tell a very
  // fit person from an extremely fit one. It cannot exceed MAX_SWING by
  // construction, so nothing has to be clamped after the fact, and a median
  // reading still returns exactly the person's real age.
  const median = medianRestingHr(profile.sex);
  const z = (restingHr - median) / RESTING_HR_SD;
  const offset = MAX_SWING * Math.tanh(z * SENSITIVITY);

  // Damp it, hard, and say why.
  //
  // The Uth ratio is extremely sensitive to resting heart rate: a reading 15%
  // below average implies a VO₂max 15% above average, which against a decline
  // of roughly half a point a year lands thirty years off. That is arithmetic,
  // not physiology. Undamped, a 45-year-old woman with a resting rate of 62 —
  // an ordinary reading — came out as 25, and a number that silly discredits
  // every honest number beside it.
  //
  // Every serious implementation of fitness age (Garmin, the HUNT model) uses
  // more inputs than we have here: waist circumference, training frequency,
  // sometimes a submaximal test. With one signal doing the work, the estimate
  // gets scaled toward the person's real age and capped tighter.
  // Body composition and training volume nudge the offset rather than the
  // VO₂max, so they can never dominate the measured signal.
  const adjusted = offset + adjustment;
  const bounded = Math.max(-MAX_SWING, Math.min(MAX_SWING, adjusted));

  // The floor moves the whole answer, so `delta` is always exactly
  // `years − age` — it used to leak and report one year fewer than the limit
  // actually applied.
  const years = Math.round(Math.max(18, Math.min(85, profile.age + bounded)));

  // Flat enough that more fitness would barely move it: the number is a bound.
  const capped = Math.abs(bounded) >= MAX_SWING * 0.9;

  // VO₂max last: it is a recognisable figure and worth plotting, but it is
  // derived from the same resting heart rate as the first factor, so it is
  // shown as a result rather than an input that pushed anything.
  factors.push({
    label: "VO₂max",
    value: `${Math.round(vo2 * 10) / 10} ml/kg/min`,
    // 15–75 is the range this estimate is clamped to.
    position: Math.max(0, Math.min(1, (vo2 - 15) / 60)),
    effect: "neutral",
    note: "Estimated aerobic capacity",
  });

  return {
    years,
    factors,
    chronological: profile.age,
    delta: years - profile.age,
    capped,
    vo2max: Math.round(vo2 * 10) / 10,
    basis,
    caveat,
  };
}

/* -------------------------------------------------------------------------- */
/* Sleep quality                                                              */

export type SleepQuality = {
  value: number | null;
  band: ScoreBand;
  parts: Array<{ label: string; value: number; weight: number; detail: string }>;
  missing: string[];
};

/**
 * How good the sleep was, not just how long it lasted.
 *
 * Duration is the least interesting third. What separates a good night from a
 * long one is whether the body actually recovered during it — which shows up
 * the next morning as higher HRV and a lower resting heart rate — and whether
 * the pattern is regular, because irregular sleep predicts poor outcomes
 * independently of how much of it you get (Huang & Redline, 2019).
 *
 * True sleep efficiency needs time-in-bed, which HealthKit gives only when the
 * source records it. It is deliberately not guessed at here.
 */
export function sleepQuality(today: DailyMetric, history: DailyMetric[]): SleepQuality {
  const parts: SleepQuality["parts"] = [];
  const missing: string[] = [];

  if (today.sleepMinutes != null) {
    const ratio = today.sleepMinutes / SLEEP_NEED_MINUTES;
    // Oversleeping is not scored as a failure, but it stops adding credit.
    const value = clamp(ratio >= 1 ? 100 - Math.min(15, (ratio - 1) * 40) : ratio * 100);
    parts.push({
      label: "Duration",
      value,
      weight: 0.4,
      detail: `${Math.floor(today.sleepMinutes / 60)}h ${String(today.sleepMinutes % 60).padStart(2, "0")}m against a ${SLEEP_NEED_MINUTES / 60}h need`,
    });
  } else {
    missing.push("Sleep duration");
  }

  // Restoration: did the night actually put something back?
  const hrvBase = baselineFor(history, "hrvMs");
  const rhrBase = baselineFor(history, "restingHr");
  const restoration: number[] = [];
  if (today.hrvMs != null && hrvBase) {
    restoration.push(clamp(50 + ((today.hrvMs - hrvBase.mean) / hrvBase.sd) * 20));
  }
  if (today.restingHr != null && rhrBase) {
    restoration.push(clamp(50 - ((today.restingHr - rhrBase.mean) / rhrBase.sd) * 20));
  }
  const restorationValue = mean(restoration);
  if (restorationValue != null) {
    parts.push({
      label: "Restoration",
      value: restorationValue,
      weight: 0.35,
      detail: "Overnight HRV and resting heart rate against your own baseline",
    });
  } else {
    missing.push("Overnight HRV or resting heart rate");
  }

  // Regularity. Duration variance is a proxy for the Sleep Regularity Index —
  // the real thing needs bed and wake times, which most sources do not export.
  const recent = pick(history, "sleepMinutes", 14);
  if (recent.length >= 5) {
    const avg = mean(recent) as number;
    const sd = Math.sqrt(recent.reduce((total, value) => total + (value - avg) ** 2, 0) / recent.length);
    // An hour of night-to-night swing is where regularity stops being good.
    const value = clamp(100 - (sd / 60) * 55);
    parts.push({
      label: "Regularity",
      value,
      weight: 0.25,
      detail: `${Math.round(sd)} minutes of night-to-night variation over ${recent.length} nights`,
    });
  } else {
    missing.push("Two weeks of nights for regularity");
  }

  if (parts.length === 0) return { value: null, band: "unknown", parts: [], missing };

  const declared = parts.reduce((total, part) => total + part.weight, 0);
  const normalised = parts.map((part) => ({ ...part, weight: part.weight / declared }));
  const value = Math.round(normalised.reduce((total, part) => total + part.value * part.weight, 0));

  return { value, band: bandFor(value), parts: normalised, missing };
}

/* -------------------------------------------------------------------------- */
/* Stress                                                                     */

export type StressReading = {
  /** 0–100 where high means more load. The inverse of the other scores. */
  value: number | null;
  band: "calm" | "steady" | "elevated" | "high" | "unknown";
  drivers: string[];
  caveat: string;
};

/**
 * Physiological load, from autonomic signals.
 *
 * Suppressed HRV alongside an elevated resting heart rate is the classic
 * sympathetic-dominance picture, and it is what every consumer stress score is
 * built on. It cannot tell the difference between a hard week at work, a hard
 * week of training, and the beginning of a cold — which is exactly why the
 * copy calls it load rather than stress in the psychological sense.
 */
export function stressScore(today: DailyMetric, history: DailyMetric[]): StressReading {
  const caveat =
    "Physiological load, not mood. Training, illness, alcohol and a bad week all push this the same way.";

  const hrvBase = baselineFor(history, "hrvMs");
  const rhrBase = baselineFor(history, "restingHr");
  const respBase = baselineFor(history, "respiratoryRate");

  const parts: Array<{ z: number; weight: number; driver: string }> = [];

  if (today.hrvMs != null && hrvBase) {
    // Below baseline HRV raises the score, hence the sign flip.
    const z = (hrvBase.mean - today.hrvMs) / hrvBase.sd;
    parts.push({
      z,
      weight: 0.5,
      driver: z > 0.5 ? `HRV ${Math.round(hrvBase.mean - today.hrvMs)} ms below your usual` : "HRV holding at your usual",
    });
  }
  if (today.restingHr != null && rhrBase) {
    const z = (today.restingHr - rhrBase.mean) / rhrBase.sd;
    parts.push({
      z,
      weight: 0.35,
      driver: z > 0.5 ? `Resting heart rate ${Math.round(today.restingHr - rhrBase.mean)} bpm above your usual` : "Resting heart rate normal",
    });
  }
  if (today.respiratoryRate != null && respBase) {
    const z = (today.respiratoryRate - respBase.mean) / respBase.sd;
    parts.push({
      z,
      weight: 0.15,
      driver: z > 0.8 ? "Breathing rate up overnight, which often precedes illness" : "Breathing rate normal",
    });
  }

  if (parts.length === 0) {
    return { value: null, band: "unknown", drivers: [], caveat };
  }

  const declared = parts.reduce((total, part) => total + part.weight, 0);
  const z = parts.reduce((total, part) => total + part.z * (part.weight / declared), 0);
  const value = Math.round(clamp(35 + z * 22));

  return {
    value,
    band: value >= 75 ? "high" : value >= 55 ? "elevated" : value >= 30 ? "steady" : "calm",
    drivers: parts.map((part) => part.driver),
    caveat,
  };
}

/* -------------------------------------------------------------------------- */
/* Body battery                                                               */

export type BodyBattery = {
  /** Where the reservoir sat when you woke. */
  charged: number | null;
  /** Where it sits now, after the day's load. */
  current: number | null;
  drained: number | null;
  gained: number | null;
  narrative: string;
};

const BATTERY_START = 50;

/**
 * A reservoir charged by sleep and drained by load.
 *
 * Modelled day by day rather than minute by minute, because daily aggregates
 * are what a phone export gives us. It carries over: a run of short nights
 * digs a hole that one good night does not fill, which is the whole reason a
 * battery is a more useful shape than a daily score.
 */
export function bodyBattery(days: DailyMetric[]): BodyBattery {
  // Oldest first, so the reservoir can accumulate through time.
  const ordered = [...days].reverse();
  if (ordered.length === 0) {
    return { charged: null, current: null, drained: null, gained: null, narrative: "No data yet." };
  }

  let level = BATTERY_START;
  let lastGain = 0;
  let lastDrain = 0;
  let charged: number | null = null;

  ordered.forEach((day, index) => {
    const history = ordered.slice(0, index).reverse();

    // Overnight charge. A full night against need is worth most of a battery;
    // quality decides how much of that is actually banked.
    const quality = sleepQuality(day, history);
    const minutes = day.sleepMinutes;
    let gain = 0;
    if (minutes != null) {
      const duration = Math.min(1, minutes / SLEEP_NEED_MINUTES);
      const efficiency = quality.value == null ? 0.7 : 0.4 + (quality.value / 100) * 0.6;
      gain = duration * efficiency * 65;
    } else {
      // No sleep record is not the same as no sleep; assume an ordinary night
      // rather than punishing someone for taking the band off.
      gain = 30;
    }

    level = clamp(level + gain);
    charged = Math.round(level);

    // Daytime drain, from movement and from load.
    const kcalBase = mean(pick(history, "activeKcal", 28)) ?? day.activeKcal ?? 0;
    const kcal = day.activeKcal ?? kcalBase;
    const effort = kcalBase > 0 ? kcal / kcalBase : 1;
    const stress = stressScore(day, history);
    const stressDrain = stress.value == null ? 12 : (stress.value / 100) * 30;
    const activityDrain = Math.min(45, effort * 22);
    // Being awake costs something even on a rest day.
    const drain = 12 + activityDrain + stressDrain;

    level = clamp(level - drain);
    lastGain = Math.round(gain);
    lastDrain = Math.round(drain);
  });

  const current = Math.round(level);
  const narrative =
    current >= 70
      ? "You have plenty in reserve. This is the day to spend it."
      : current >= 40
        ? "Enough for a normal day. A hard session will cost you tomorrow."
        : current >= 20
          ? "Running low. Keep it easy and protect tonight's sleep."
          : "Empty. Today is for eating, walking and going to bed early.";

  return { charged, current, drained: lastDrain, gained: lastGain, narrative };
}

/* -------------------------------------------------------------------------- */
/* Insights                                                                   */

export type Insight = {
  id: string;
  title: string;
  /** What the data says. */
  body: string;
  /** What to actually do about it. The half that makes this worth paying for. */
  action: string;
  /** The numbers behind the claim, so it can be checked rather than believed. */
  evidence: string;
  /** How much history the claim rests on. */
  confidence: "low" | "medium" | "high";
  kind: "sleep" | "recovery" | "activity" | "load" | "weight" | "pattern" | "record";
  /** Ordering: the most actionable first. */
  priority: number;
};

/** Pearson correlation. Null when there is not enough overlap to bother. */
export function correlate(pairs: Array<[number, number]>): number | null {
  if (pairs.length < 8) return null;
  const xs = pairs.map(([x]) => x);
  const ys = pairs.map(([, y]) => y);
  const mx = mean(xs) as number;
  const my = mean(ys) as number;
  const num = pairs.reduce((total, [x, y]) => total + (x - mx) * (y - my), 0);
  const dx = Math.sqrt(xs.reduce((total, x) => total + (x - mx) ** 2, 0));
  const dy = Math.sqrt(ys.reduce((total, y) => total + (y - my) ** 2, 0));
  if (dx === 0 || dy === 0) return null;
  return num / (dx * dy);
}

function confidenceFor(n: number): Insight["confidence"] {
  if (n >= 45) return "high";
  if (n >= 21) return "medium";
  return "low";
}

/**
 * Findings from someone's own history.
 *
 * Every insight has to earn its place by carrying three things: what the data
 * says, the numbers behind it so it can be checked, and something to actually
 * do. An observation without an action is a horoscope with a chart attached,
 * and that is what people cancel subscriptions over.
 *
 * Only relationships strong enough to act on are reported, and every one says
 * how much history it rests on.
 */
export function insights(history: DailyMetric[]): Insight[] {
  const found: Insight[] = [];
  // Oldest first makes "the night before" unambiguous.
  const ordered = [...history].reverse();

  /** Pairs a night with the following morning's reading. */
  function lagged(
    from: keyof DailyMetric,
    to: keyof DailyMetric,
  ): Array<[number, number]> {
    const pairs: Array<[number, number]> = [];
    for (let index = 1; index < ordered.length; index += 1) {
      const before = ordered[index - 1][from];
      const after = ordered[index][to];
      if (typeof before === "number" && typeof after === "number") pairs.push([before, after]);
    }
    return pairs;
  }

  /* ---- Sleep drives recovery ------------------------------------------- */

  const sleepToHrv = lagged("sleepMinutes", "hrvMs");
  const rSleepHrv = correlate(sleepToHrv);
  if (rSleepHrv != null && rSleepHrv > 0.28) {
    const long = sleepToHrv.filter(([night]) => night >= SLEEP_NEED_MINUTES);
    const short = sleepToHrv.filter(([night]) => night < SLEEP_NEED_MINUTES - 60);
    const longMean = mean(long.map(([, hrv]) => hrv));
    const shortMean = mean(short.map(([, hrv]) => hrv));
    if (longMean != null && shortMean != null && longMean > shortMean) {
      const gap = Math.round(longMean - shortMean);
      found.push({
        id: "sleep-hrv",
        title: "Sleep is your biggest lever",
        body: `Eight hours or more and your HRV the next morning averages ${Math.round(longMean)} ms. Under seven and it averages ${Math.round(shortMean)} ms.`,
        action: `That ${gap} ms gap is larger than most training changes will buy you. Protecting eight hours is the highest-return thing on this list — start with a fixed wake time rather than a fixed bedtime, which is the half people can actually control.`,
        evidence: `${sleepToHrv.length} nights paired with the following morning · r = ${rSleepHrv.toFixed(2)}`,
        confidence: confidenceFor(sleepToHrv.length),
        kind: "sleep",
        priority: 1,
      });
    }
  }

  /* ---- Load costs you the next morning --------------------------------- */

  const loadToRhr = lagged("activeKcal", "restingHr");
  const rLoadRhr = correlate(loadToRhr);
  if (rLoadRhr != null && rLoadRhr > 0.28) {
    const hard = loadToRhr.filter(([load]) => load >= (mean(loadToRhr.map(([l]) => l)) ?? 0) * 1.3);
    const hardMean = mean(hard.map(([, rhr]) => rhr));
    const allMean = mean(loadToRhr.map(([, rhr]) => rhr));
    found.push({
      id: "load-rhr",
      title: "Hard days show up the next morning",
      body:
        hardMean != null && allMean != null
          ? `After your heaviest days your resting heart rate averages ${Math.round(hardMean)} bpm against ${Math.round(allMean)} bpm otherwise.`
          : "Your resting heart rate tracks the previous day's training load.",
      action:
        "That is exactly what should happen. What matters is how fast it comes back — if it is still elevated two mornings later, the session was bigger than you had recovery for, and the next one should be lighter rather than the same again.",
      evidence: `${loadToRhr.length} days paired with the following morning · r = ${rLoadRhr.toFixed(2)}`,
      confidence: confidenceFor(loadToRhr.length),
      kind: "load",
      priority: 2,
    });
  }

  /* ---- The best and worst day of your week ----------------------------- */

  const byWeekday = new Map<number, number[]>();
  for (const day of ordered) {
    if (day.sleepMinutes == null) continue;
    const weekday = day.date.getUTCDay();
    byWeekday.set(weekday, [...(byWeekday.get(weekday) ?? []), day.sleepMinutes]);
  }
  const weekdayMeans = [...byWeekday.entries()]
    .filter(([, values]) => values.length >= 3)
    .map(([weekday, values]) => ({ weekday, mean: mean(values) as number, n: values.length }));

  if (weekdayMeans.length >= 5) {
    const best = weekdayMeans.reduce((a, b) => (b.mean > a.mean ? b : a));
    const worst = weekdayMeans.reduce((a, b) => (b.mean < a.mean ? b : a));
    const gap = best.mean - worst.mean;
    if (gap >= 40) {
      const names = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      found.push({
        id: "weekday-sleep",
        title: `${names[worst.weekday]} is your worst night`,
        body: `You average ${formatDuration(Math.round(worst.mean))} on a ${names[worst.weekday]} against ${formatDuration(Math.round(best.mean))} on a ${names[best.weekday]} — ${Math.round(gap)} minutes apart.`,
        action: `Put your easiest session the morning after a ${names[worst.weekday]}, not your hardest. Most people schedule by the calendar; the calendar does not know when you slept badly.`,
        evidence: `${worst.n} ${names[worst.weekday]}s and ${best.n} ${names[best.weekday]}s on record`,
        confidence: confidenceFor(worst.n + best.n),
        kind: "pattern",
        priority: 3,
      });
    }
  }

  /* ---- Consistency beats volume ---------------------------------------- */

  const steps = pick(history, "steps", 28);
  if (steps.length >= 14) {
    const avg = mean(steps) as number;
    const sd = Math.sqrt(steps.reduce((total, value) => total + (value - avg) ** 2, 0) / steps.length);
    if (sd / avg > 0.45) {
      const quiet = steps.filter((value) => value < avg * 0.6).length;
      found.push({
        id: "steps-variance",
        title: "Your weeks look nothing like each other",
        body: `Daily steps swing by about ${Math.round(sd).toLocaleString()} around an average of ${Math.round(avg).toLocaleString()}, with ${quiet} near-still days in the last four weeks.`,
        action: `Raising the floor beats raising the ceiling. A twenty-minute walk on your ${quiet} quietest days would add more to your aerobic base this month than another hard session, and cost you nothing in recovery.`,
        evidence: `${steps.length} days · standard deviation ${Math.round(sd).toLocaleString()} steps`,
        confidence: confidenceFor(steps.length),
        kind: "activity",
        priority: 4,
      });
    }
  }

  /* ---- Weight trend ----------------------------------------------------- */

  const weights = pick(history, "weightKg", 28);
  if (weights.length >= 10) {
    const recent = mean(weights.slice(0, 7));
    const prior = mean(weights.slice(7, 21));
    if (recent != null && prior != null && Math.abs(recent - prior) >= 0.4) {
      const up = recent > prior;
      const change = Math.abs(recent - prior);
      // Roughly 7,700 kcal a kilo; over a fortnight that is a daily figure.
      const daily = Math.round((change * 7700) / 14);
      found.push({
        id: "weight-trend",
        title: `Weight is trending ${up ? "up" : "down"}`,
        body: `The last week averages ${recent.toFixed(1)} kg against ${prior.toFixed(1)} kg for the fortnight before.`,
        action: `That pace is roughly ${daily} kcal a day ${up ? "above" : "below"} what you are burning. If it is deliberate, it is on track; if it is not, that is one ${up ? "extra" : "missing"} snack a day rather than anything dramatic.`,
        evidence: `${weights.length} weigh-ins over four weeks · ${change.toFixed(1)} kg change`,
        confidence: confidenceFor(weights.length),
        kind: "weight",
        priority: 5,
      });
    }
  }

  /* ---- Where you are against your own baseline -------------------------- */

  const hrvRecent = pick(history, "hrvMs", 7);
  const hrvBase = baselineFor(history.slice(7), "hrvMs");
  if (hrvRecent.length >= 5 && hrvBase) {
    const recent = mean(hrvRecent) as number;
    if (recent > hrvBase.mean + hrvBase.sd * 0.6) {
      found.push({
        id: "hrv-rising",
        title: "You are absorbing the work",
        body: `HRV has averaged ${Math.round(recent)} ms this week against a baseline of ${Math.round(hrvBase.mean)} ms.`,
        action: "This is the window to add load, not hold it. Take the harder option on your next two sessions — a rising baseline is the clearest permission slip your body gives you.",
        evidence: `${hrvRecent.length} days this week against ${hrvBase.n} days of baseline`,
        confidence: confidenceFor(hrvRecent.length + hrvBase.n),
        kind: "recovery",
        priority: 1,
      });
    } else if (recent < hrvBase.mean - hrvBase.sd * 0.8) {
      found.push({
        id: "hrv-falling",
        title: "Something is taking it out of you",
        body: `HRV has averaged ${Math.round(recent)} ms this week against a baseline of ${Math.round(hrvBase.mean)} ms.`,
        action: "A week of this is load, sleep or illness — and the three are hard to tell apart from the outside. Hold your volume where it is for a week rather than pushing through, and see whether it comes back on its own.",
        evidence: `${hrvRecent.length} days this week against ${hrvBase.n} days of baseline`,
        confidence: confidenceFor(hrvRecent.length + hrvBase.n),
        kind: "recovery",
        priority: 1,
      });
    }
  }

  /* ---- A record worth knowing about ------------------------------------- */

  const allHrv = pick(history, "hrvMs", 400);
  if (allHrv.length >= 21) {
    const latest = allHrv[0];
    const rest = allHrv.slice(1);
    const best = Math.max(...rest);
    // A genuine record: today beats every prior day, and beats it by enough to
    // be a reading rather than noise. Without the second clause a perfectly
    // flat series congratulated somebody every single morning.
    if (latest > best * 1.01) {
      found.push({
        id: "hrv-record",
        title: "That is your best HRV on record",
        body: `${Math.round(latest)} ms, against a previous best of ${Math.round(best)} ms across ${allHrv.length} days.`,
        action: "Worth noting what preceded it — the sleep, the food, the day off. Records are the cheapest experiment you will ever run, because the conditions already happened.",
        evidence: `${allHrv.length} days on file`,
        confidence: confidenceFor(allHrv.length),
        kind: "record",
        priority: 6,
      });
    }
  }

  return found.sort((a, b) => a.priority - b.priority);
}
