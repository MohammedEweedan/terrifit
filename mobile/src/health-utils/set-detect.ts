/**
 * Finding sets in a heart-rate stream.
 *
 * What the V1 actually gives us over the standard BLE heart-rate service is
 * one number a second. That is enough to tell work from rest — a set drives
 * the heart up and it falls back during the rest interval — and it is *not*
 * enough to count reps or judge bar speed. Nothing here claims to.
 *
 * The shape being detected is deliberately simple: a rise above the member's
 * own resting baseline, held long enough to be a working set, followed by a
 * fall. Everything is relative to a baseline measured at the start of the
 * session rather than to absolute BPM, because a threshold that works for a
 * 22-year-old is nonsense for a 55-year-old on beta blockers.
 */

export type Reading = { bpm: number; at: number };

/** How far above baseline counts as working. */
const RISE_FRACTION = 0.18;
/** Coming back down to within this of baseline ends the bout. */
const FALL_FRACTION = 0.08;
/** Shorter than this is a movement, not a set. */
const MIN_WORK_MS = 12_000;
/**
 * Longer than this and the member is doing cardio, not a set of five.
 *
 * A bout that runs past it is abandoned rather than recorded, and no new bout
 * may open until the heart rate has actually come back down. Without that
 * second half, a twenty-minute row was chopped into five-minute "sets" and
 * ticked off a lifting session that never happened.
 */
const MAX_WORK_MS = 240_000;
/** Readings older than this are not evidence about right now. */
export const WINDOW_MS = 600_000;

export type Bout = { startedAt: number; endedAt: number; peakBpm: number; meanBpm: number };

export type DetectorState = {
  /** Null until enough quiet readings have established one. */
  baselineBpm: number | null;
  /** Set while a bout is open. */
  openedAt: number | null;
  /**
   * True after an over-long effort, until the heart rate returns to baseline.
   * Stops continuous work from being read as a run of back-to-back sets.
   */
  awaitingRecovery: boolean;
  bouts: Bout[];
};

export const initialState: DetectorState = {
  baselineBpm: null, openedAt: null, awaitingRecovery: false, bouts: [],
};

/**
 * How many readings at the start of a session settle the baseline.
 *
 * About a minute of standing around before the first working set, which is
 * what warming up and finding a rack actually looks like.
 */
const BASELINE_SAMPLES = 60;

/**
 * The member's quiet heart rate for this session.
 *
 * Measured from the *opening* readings only, and frozen once taken. An earlier
 * version took a percentile across the whole rolling window, which inverted
 * during long efforts: if most of the window is work, work becomes the
 * baseline and the detector goes blind exactly when it matters.
 */
export function baselineFrom(readings: Reading[]): number | null {
  if (readings.length < 8) return null;
  const opening = readings.slice(0, BASELINE_SAMPLES);
  const sorted = opening.map((r) => r.bpm).sort((a, b) => a - b);
  // The 20th percentile rather than the minimum: one dropped reading should
  // not define the floor for the whole session.
  return sorted[Math.floor(sorted.length * 0.2)];
}

/**
 * Advances the detector by one window of readings.
 *
 * Pure, and takes the whole window rather than one reading, so the same
 * function can be replayed over a recorded session in a test.
 */
export function detect(readings: Reading[], previous: DetectorState = initialState): DetectorState {
  if (readings.length === 0) return previous;

  const recent = readings.filter((r) => r.at >= readings[readings.length - 1].at - WINDOW_MS);
  // The baseline comes from the opening of the session, not the rolling
  // window, so it is taken from `readings` rather than `recent`.
  const baseline = previous.baselineBpm ?? baselineFrom(readings);
  if (baseline == null) return { ...previous, baselineBpm: null };

  const riseAt = baseline * (1 + RISE_FRACTION);
  const fallAt = baseline * (1 + FALL_FRACTION);

  let openedAt = previous.openedAt;
  let awaitingRecovery = previous.awaitingRecovery;
  const bouts = [...previous.bouts];
  const seen = new Set(bouts.map((bout) => bout.startedAt));

  for (const reading of recent) {
    if (awaitingRecovery) {
      // Nothing counts until the effort genuinely ends.
      if (reading.bpm <= fallAt) awaitingRecovery = false;
      continue;
    }

    if (openedAt == null) {
      if (reading.bpm >= riseAt) openedAt = reading.at;
      continue;
    }

    const elapsed = reading.at - openedAt;

    if (elapsed >= MAX_WORK_MS) {
      // Continuous work. Not a set, and not several sets either.
      openedAt = null;
      awaitingRecovery = true;
      continue;
    }

    if (reading.bpm > fallAt) continue;

    if (elapsed >= MIN_WORK_MS && !seen.has(openedAt)) {
      const inBout = recent.filter((r) => r.at >= (openedAt as number) && r.at <= reading.at);
      bouts.push({
        startedAt: openedAt,
        endedAt: reading.at,
        peakBpm: Math.max(...inBout.map((r) => r.bpm)),
        meanBpm: Math.round(inBout.reduce((sum, r) => sum + r.bpm, 0) / inBout.length),
      });
      seen.add(openedAt);
    }
    openedAt = null;
  }

  return { baselineBpm: baseline, openedAt, awaitingRecovery, bouts };
}

/**
 * Effort right now, 0–1, against this session's own baseline and peak.
 *
 * Used for the live ring during a session. It is a display value, not a
 * physiological measure, and is named accordingly wherever it is shown.
 */
export function effort(current: number, baseline: number | null, peak: number | null): number {
  if (baseline == null || peak == null || peak <= baseline) return 0;
  return Math.max(0, Math.min(1, (current - baseline) / (peak - baseline)));
}
