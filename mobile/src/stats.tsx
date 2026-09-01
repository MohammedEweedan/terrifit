import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import * as SecureStore from "expo-secure-store";
import { theme } from "./theme";
import type { Dashboard } from "./api";

/**
 * Everything the daily signal can show.
 *
 * The catalogue is fixed and the *selection* is the member's, so adding a
 * metric here makes it available to everyone without touching the card.
 */
export const STAT_IDS = [
  "tScore",
  "hrv",
  "restingHr",
  "heartRate",
  "sleep",
  "steps",
  "active",
  "consistency",
  "weight",
  "readiness",
] as const;

export type StatId = (typeof STAT_IDS)[number];

/**
 * Metrics that only appear on a paid plan.
 *
 * The T Score is the one number that reads the member's whole history rather
 * than one morning, and average heart rate is the reading that only makes
 * sense against thirty days of context — both are what people are paying for.
 * A free account never sees them in the picker, so nothing is dangled.
 */
export const PRO_STATS: StatId[] = ["tScore", "heartRate"];

export type Stat = {
  id: StatId;
  label: string;
  value: number | null;
  format: (value: number) => string;
  /** 0–1, how full the tile's underline reads. */
  fill: number;
  delta: string;
  tone: string;
};

const ORDER_KEY = "terrifit.stats.order";
const HIDDEN_KEY = "terrifit.stats.hidden";

/** A sensible opening grid. Everything else is one tap away in Customise. */
const DEFAULT_HIDDEN: StatId[] = ["weight", "readiness", "heartRate"];

export const STAT_LABELS: Record<StatId, string> = {
  tScore: "T Score",
  hrv: "HRV",
  restingHr: "Resting HR",
  heartRate: "Heart rate",
  sleep: "Sleep",
  steps: "Steps",
  active: "Active",
  consistency: "Consistency",
  weight: "Weight",
  readiness: "Readiness",
};

export const STAT_BLURBS: Record<StatId, string> = {
  tScore: "How today's movement reads against your own history",
  hrv: "Overnight heart-rate variability",
  restingHr: "Your lowest heart rate of the night",
  heartRate: "Your average across the whole day",
  sleep: "Time actually asleep",
  steps: "Movement across the whole day",
  active: "Energy above resting",
  consistency: "Days in a row with data",
  weight: "Latest weigh-in",
  readiness: "This morning's recovery score",
};

/**
 * Builds every tile from one dashboard payload. Selection is applied later.
 *
 * Both the trend line and the bar are derived from the member's own history —
 * nothing here is invented. A metric with fewer than two readings gets no
 * comparison rather than a made-up one, because a confident "+8% on your
 * baseline" that nobody measured is worse than an empty tile.
 */
export function buildStats(data: Dashboard | null): Record<StatId, Stat> {
  const history = data?.history ?? [];
  const latest = history[0];

  /** Mean of the readings before today, which is what "usual" means here. */
  function baseline(read: (row: Dashboard["history"][number]) => number | null): number | null {
    const values = history.slice(1, 31).map(read).filter((value): value is number => value != null);
    if (values.length < 2) return null;
    return values.reduce((sum, value) => sum + value, 0) / values.length;
  }

  /** Where today sits in the range this metric has actually covered, 0–1. */
  function position(read: (row: Dashboard["history"][number]) => number | null, value: number | null): number {
    if (value == null) return 0;
    const values = history.slice(0, 60).map(read).filter((item): item is number => item != null);
    if (values.length < 2) return 0.5;
    const low = Math.min(...values);
    const high = Math.max(...values);
    if (high === low) return 0.5;
    return Math.max(0, Math.min(1, (value - low) / (high - low)));
  }

  function describe(
    value: number | null,
    mean: number | null,
    format: (value: number) => string,
    better: "higher" | "lower" | "neutral",
  ): string {
    if (value == null) return "No reading yet";
    if (mean == null) return "Not enough history to compare";
    const change = value - mean;
    if (Math.abs(change) < Math.abs(mean) * 0.02) return `In line with your usual ${format(mean)}`;
    const word = better === "neutral" ? (change > 0 ? "above" : "below") : (better === "higher") === change > 0 ? "better than" : "below";
    return `${format(Math.abs(change))} ${word} your usual ${format(mean)}`;
  }

  function build(
    id: StatId,
    read: (row: Dashboard["history"][number]) => number | null,
    format: (value: number) => string,
    better: "higher" | "lower" | "neutral",
    tone: string,
  ): Stat {
    const value = latest ? read(latest) : null;
    const mean = baseline(read);
    return {
      id,
      label: STAT_LABELS[id],
      value,
      format,
      fill: position(read, value),
      delta: describe(value, mean, format, better),
      tone,
    };
  }

  const days = data?.dayCount ?? 0;

  return {
    // The T Score is already 0–100, so its bar is the score itself rather than
    // where it sits in the member's own range — a 30 should look like a 30.
    tScore: {
      ...build("tScore", (row) => row.tScore, (v) => `${Math.round(v)}`, "higher", theme.accent),
      fill: latest?.tScore != null ? latest.tScore / 100 : 0,
    },
    hrv: build("hrv", (row) => row.hrvMs, (v) => `${Math.round(v)} ms`, "higher", theme.good),
    restingHr: build("restingHr", (row) => row.restingHr, (v) => `${Math.round(v)} bpm`, "lower", theme.good),
    sleep: build(
      "sleep",
      (row) => row.sleepMinutes,
      (v) => `${Math.floor(v / 60)}h ${String(Math.round(v % 60)).padStart(2, "0")}m`,
      "higher",
      theme.sleep,
    ),
    steps: build("steps", (row) => row.steps, (v) => Math.round(v).toLocaleString(), "higher", theme.accent),
    active: build("active", (row) => row.activeKcal, (v) => `${Math.round(v)} kcal`, "higher", theme.accent),
    consistency: {
      id: "consistency",
      label: STAT_LABELS.consistency,
      value: days > 0 ? days : null,
      format: (v) => `${Math.round(v)} ${Math.round(v) === 1 ? "day" : "days"}`,
      fill: Math.min(1, days / 90),
      delta: days > 0 ? "Days of data on file" : "No reading yet",
      tone: theme.good,
    },
    heartRate: build("heartRate", (row) => row.averageHr, (v) => `${Math.round(v)} bpm`, "lower", theme.poor),
    weight: build("weight", (row) => row.weightKg, (v) => `${v.toFixed(1)} kg`, "neutral", theme.ink2),
    readiness: build("readiness", (row) => row.recovery, (v) => `${Math.round(v)}%`, "higher", theme.good),
  };
}

type StatPreferences = {
  ready: boolean;
  /** Every stat, in the member's order. */
  order: StatId[];
  hidden: StatId[];
  visible: StatId[];
  toggle: (id: StatId) => void;
  move: (id: StatId, direction: -1 | 1) => void;
  reset: () => void;
};

const Context = createContext<StatPreferences | null>(null);

function sanitise(stored: string | null, fallback: StatId[]): StatId[] {
  if (!stored) return fallback;
  try {
    const parsed: unknown = JSON.parse(stored);
    if (!Array.isArray(parsed)) return fallback;
    const valid = parsed.filter((id): id is StatId => STAT_IDS.includes(id as StatId));
    // Anything added to the catalogue since this was saved is appended rather
    // than dropped, so a new metric shows up instead of silently vanishing.
    return [...valid, ...STAT_IDS.filter((id) => !valid.includes(id))];
  } catch {
    return fallback;
  }
}

export function StatPreferencesProvider({ children }: { children: ReactNode }) {
  const [order, setOrder] = useState<StatId[]>([...STAT_IDS]);
  const [hidden, setHidden] = useState<StatId[]>(DEFAULT_HIDDEN);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    void Promise.all([SecureStore.getItemAsync(ORDER_KEY), SecureStore.getItemAsync(HIDDEN_KEY)])
      .then(([storedOrder, storedHidden]) => {
        setOrder(sanitise(storedOrder, [...STAT_IDS]));
        if (storedHidden) {
          try {
            const parsed: unknown = JSON.parse(storedHidden);
            if (Array.isArray(parsed)) {
              setHidden(parsed.filter((id): id is StatId => STAT_IDS.includes(id as StatId)));
            }
          } catch {
            // A corrupt value is the same as never having set one.
          }
        }
      })
      .finally(() => setReady(true));
  }, []);

  const persist = useCallback((nextOrder: StatId[], nextHidden: StatId[]) => {
    setOrder(nextOrder);
    setHidden(nextHidden);
    void SecureStore.setItemAsync(ORDER_KEY, JSON.stringify(nextOrder)).catch(() => {});
    void SecureStore.setItemAsync(HIDDEN_KEY, JSON.stringify(nextHidden)).catch(() => {});
  }, []);

  const toggle = useCallback(
    (id: StatId) => {
      const next = hidden.includes(id) ? hidden.filter((item) => item !== id) : [...hidden, id];
      // Leaving nothing on screen would look like a bug rather than a choice.
      if (next.length >= STAT_IDS.length) return;
      persist(order, next);
    },
    [hidden, order, persist],
  );

  const move = useCallback(
    (id: StatId, direction: -1 | 1) => {
      const index = order.indexOf(id);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= order.length) return;
      const next = [...order];
      [next[index], next[target]] = [next[target], next[index]];
      persist(next, hidden);
    },
    [order, hidden, persist],
  );

  const reset = useCallback(() => persist([...STAT_IDS], DEFAULT_HIDDEN), [persist]);

  const value = useMemo<StatPreferences>(
    () => ({
      ready,
      order,
      hidden,
      visible: order.filter((id) => !hidden.includes(id)),
      toggle,
      move,
      reset,
    }),
    [ready, order, hidden, toggle, move, reset],
  );

  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useStatPreferences(): StatPreferences {
  const value = useContext(Context);
  if (!value) throw new Error("useStatPreferences must be used inside StatPreferencesProvider");
  return value;
}
