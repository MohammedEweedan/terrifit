import type { Exercise } from "./catalog";

/**
 * What to put on the bar next time.
 *
 * The app used to carry last week's weights forward unchanged, which is a
 * record, not a programme: somebody who squatted 100 kg in January is still
 * being shown 100 kg in March. Muscle is built by asking for slightly more
 * than last time, so this decides what "slightly more" is.
 *
 * The rule is double progression, which is what most coaches actually use:
 * hold the weight until every prescribed rep is completed, then add the
 * smallest useful increment. It is deliberately conservative — a suggestion
 * that runs ahead of somebody gets them hurt, and a suggestion they have to
 * correct downward every week is worse than no suggestion at all.
 *
 * Nothing here is medical advice and none of it is personalised to a
 * condition. It is arithmetic on the sets the member logged themselves.
 */

export type LoggedSet = { reps: number | null; weightKg: number | null; done: boolean };
export type LoggedEntry = { exercise: string; sets: LoggedSet[] };

/** One past performance of a session, newest first when passed as a list. */
export type SessionHistory = { entries: LoggedEntry[]; completedAt: string };

export type Suggestion = {
  exercise: string;
  /** What to load. Null when there is nothing to go on yet. */
  weightKg: number | null;
  reps: number | null;
  /** Why this number, in one line the member can read. */
  reason: string;
  kind: "first" | "hold" | "increase" | "deload";
};

/**
 * How much to add, by movement.
 *
 * A 2.5 kg jump on a squat is about 2%; the same jump on a lateral raise is
 * 25% and nobody makes it. The smallest plate most gyms have in pairs is
 * 1.25 kg, so that is the floor for barbell work; dumbbells move in bigger
 * steps because that is how racks are built.
 */
const INCREMENTS: { match: RegExp; kg: number }[] = [
  { match: /squat|deadlift|hip thrust|leg press/i, kg: 2.5 },
  { match: /bench|overhead press|press|row|pull-?up|chin-?up/i, kg: 1.25 },
  { match: /dumbbell|db /i, kg: 2 },
  { match: /curl|raise|fly|extension|face pull|calf/i, kg: 1 },
];

/** The default when a movement matches nothing: the smallest common plate pair. */
const DEFAULT_INCREMENT = 1.25;

export function incrementFor(exerciseName: string): number {
  return INCREMENTS.find((rule) => rule.match.test(exerciseName))?.kg ?? DEFAULT_INCREMENT;
}

/** "5×3" → 5 sets. "3×10 each side" → 3. */
export function setCount(scheme: string): number {
  const match = /^(\d+)\s*[×x]/.exec(scheme.trim());
  return match ? Math.min(12, Math.max(1, Number(match[1]))) : 3;
}

/** "5×3" → 3 reps a set. Time-based work has no rep target. */
export function repTarget(scheme: string): number | null {
  const match = /[×x]\s*(\d+)/.exec(scheme);
  return match ? Number(match[1]) : null;
}

/**
 * Did this performance earn a heavier bar?
 *
 * Every prescribed set has to be completed at or above the rep target, at the
 * same weight. Partial credit does not progress: three good sets out of five
 * means the fifth was the one that mattered.
 */
function earnedIncrease(entry: LoggedEntry, target: number | null, prescribedSets: number): boolean {
  const completed = entry.sets.filter((set) => set.done);
  if (completed.length < prescribedSets) return false;
  if (target == null) return false;

  const weights = completed.map((set) => set.weightKg);
  if (weights.some((weight) => weight == null || weight <= 0)) return false;
  // A set logged at a different load is a different exercise for this purpose.
  if (new Set(weights).size !== 1) return false;

  return completed.every((set) => set.reps != null && set.reps >= target);
}

/** The load actually used, when every completed set agreed on one. */
function workingWeight(entry: LoggedEntry): number | null {
  const weights = entry.sets.filter((set) => set.done).map((set) => set.weightKg).filter((w): w is number => w != null && w > 0);
  if (weights.length === 0) return null;
  // The heaviest is the working set on a ramped exercise, and is identical to
  // the others on a straight one.
  return Math.max(...weights);
}

/** Rounds to something that can actually be loaded on a bar. */
function loadable(kg: number): number {
  return Math.round(kg * 4) / 4;
}

/**
 * The number of consecutive recent attempts that fell short at the same load.
 *
 * Two failures at one weight is a stall, not a bad day, and repeating it a
 * third time mostly buys fatigue. Three is where a deload earns its place.
 */
const STALL_LIMIT = 3;

/** The proportion of the bar to strip when stalled. Enough to feel easy again. */
const DELOAD = 0.9;

export function suggestNext(
  exercise: Exercise,
  history: SessionHistory[],
): Suggestion {
  const target = repTarget(exercise.scheme);
  const prescribed = setCount(exercise.scheme);
  const attempts = history
    .map((log) => log.entries.find((entry) => entry.exercise === exercise.name))
    .filter((entry): entry is LoggedEntry => entry != null);

  const last = attempts[0];
  const lastWeight = last ? workingWeight(last) : null;

  if (!last || lastWeight == null) {
    return {
      exercise: exercise.name,
      weightKg: null,
      reps: target,
      kind: "first",
      reason: "First time through. Pick a weight you could do two more reps with.",
    };
  }

  if (earnedIncrease(last, target, prescribed)) {
    const step = incrementFor(exercise.name);
    return {
      exercise: exercise.name,
      weightKg: loadable(lastWeight + step),
      reps: target,
      kind: "increase",
      reason: `All ${prescribed} sets at ${lastWeight} kg last time. Up ${step} kg.`,
    };
  }

  // A stall is the same weight missed repeatedly, not merely a run of misses:
  // somebody who dropped the weight and is building back has not stalled.
  const stalled = attempts
    .slice(0, STALL_LIMIT)
    .filter((entry) => workingWeight(entry) === lastWeight && !earnedIncrease(entry, target, prescribed));

  if (stalled.length >= STALL_LIMIT) {
    return {
      exercise: exercise.name,
      weightKg: loadable(lastWeight * DELOAD),
      reps: target,
      kind: "deload",
      reason: `${STALL_LIMIT} sessions stuck at ${lastWeight} kg. Drop 10% and build back.`,
    };
  }

  return {
    exercise: exercise.name,
    weightKg: loadable(lastWeight),
    reps: target,
    kind: "hold",
    reason: `Stay at ${lastWeight} kg until all ${prescribed} sets are complete.`,
  };
}

/** Every exercise in a session, in prescription order. */
export function suggestSession(exercises: Exercise[], history: SessionHistory[]): Suggestion[] {
  return exercises.map((exercise) => suggestNext(exercise, history));
}
