import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import * as SecureStore from "expo-secure-store";
import { theme } from "./theme";
import { weight, type UnitSystem } from "./units";
import { metricLabel, type MetricKey } from "./metric-labels";
import type { AppLocale } from "./preferences";
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
 * This list must agree with `PRO_METRICS` in `src/lib/health/plan.ts`, which is
 * the server's own statement of what Pro buys: sleep quality, load, body
 * battery, insights and the T Score. What stays free is the morning read —
 * recovery, strain and sleep — plus the fitness age.
 *
 * The T Score is here because the *server* now gates it — it is in
 * `PRO_METRICS`, so a free account never receives it. That is the difference
 * between a paywall and a curtain: this list hides a value the payload does not
 * contain, rather than one already sitting on the device.
 *
 * Average heart rate stays free. It is a reading, not a derived score, and
 * withholding a number the band measured directly is the kind of thing that
 * makes people resent a subscription rather than buy one.
 */
export const PRO_STATS: StatId[] = ["tScore"];

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
const AGE_DELTA_KEY = "terrifit.stats.ageDelta";

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
/**
 * The handful of sentences the tiles compose, per language.
 *
 * Kept beside the code that builds them rather than in the UI dictionary,
 * because they are fragments assembled into a sentence — "4 ms below your
 * usual 66 ms" — and a translator needs to see them together to get the word
 * order right.
 */
const PHRASES: Record<string, { noReading: string; notEnough: string; inLineWith: string; above: string; below: string }> = {
  en: { noReading: "No reading yet", notEnough: "Not enough history to compare", inLineWith: "In line with your usual", above: "above your usual", below: "below your usual" },
  es: { noReading: "Aún sin lectura", notEnough: "No hay historial suficiente", inLineWith: "En línea con tu media de", above: "por encima de tu media de", below: "por debajo de tu media de" },
  ar: { noReading: "لا قراءة بعد", notEnough: "لا يوجد سجل كافٍ", inLineWith: "متوافق مع معدلك", above: "فوق معدلك البالغ", below: "دون معدلك البالغ" },
  fr: { noReading: "Pas encore de mesure", notEnough: "Historique insuffisant", inLineWith: "Conforme à votre habitude de", above: "au-dessus de votre habitude de", below: "en dessous de votre habitude de" },
  de: { noReading: "Noch kein Wert", notEnough: "Zu wenig Verlauf", inLineWith: "Wie dein Schnitt von", above: "über deinem Schnitt von", below: "unter deinem Schnitt von" },
  nl: { noReading: "Nog geen meting", notEnough: "Te weinig historie", inLineWith: "In lijn met je gemiddelde van", above: "boven je gemiddelde van", below: "onder je gemiddelde van" },
  pt: { noReading: "Ainda sem leitura", notEnough: "Histórico insuficiente", inLineWith: "Em linha com a tua média de", above: "acima da tua média de", below: "abaixo da tua média de" },
  it: { noReading: "Ancora nessuna lettura", notEnough: "Storico insufficiente", inLineWith: "In linea con la tua media di", above: "sopra la tua media di", below: "sotto la tua media di" },
  tr: { noReading: "Henüz ölçüm yok", notEnough: "Karşılaştırmak için yeterli geçmiş yok", inLineWith: "Her zamanki gibi", above: "ortalamanın üzerinde", below: "ortalamanın altında" },
  ru: { noReading: "Замеров пока нет", notEnough: "Мало истории", inLineWith: "Как обычно —", above: "выше обычного", below: "ниже обычного" },
};

export function buildStats(
  data: Dashboard | null,
  units: UnitSystem = "metric",
  locale: AppLocale = "en",
): Record<StatId, Stat> {
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
    if (value == null) return phrase.noReading;
    if (mean == null) return phrase.notEnough;
    const change = value - mean;
    if (Math.abs(change) < Math.abs(mean) * 0.02) return `${phrase.inLineWith} ${format(mean)}`;
    const word = change > 0 ? phrase.above : phrase.below;
    return `${format(Math.abs(change))} ${word} ${format(mean)}`;
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
      label: metricLabel(id as MetricKey, locale),
      value,
      format,
      fill: position(read, value),
      delta: describe(value, mean, format, better),
      tone,
    };
  }

  const phrase = PHRASES[locale] ?? PHRASES.en;
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
      label: metricLabel("consistency", locale),
      value: days > 0 ? days : null,
      format: (v) => `${Math.round(v)} ${Math.round(v) === 1 ? "day" : "days"}`,
      fill: Math.min(1, days / 90),
      delta: days > 0 ? "" : phrase.noReading,
      tone: theme.good,
    },
    heartRate: build("heartRate", (row) => row.averageHr, (v) => `${Math.round(v)} bpm`, "lower", theme.poor),
    weight: build("weight", (row) => row.weightKg, (v) => weight(v, units), "neutral", theme.ink2),
    readiness: build("readiness", (row) => row.recovery, (v) => `${Math.round(v)}%`, "higher", theme.good),
  };
}

type StatPreferences = {
  ready: boolean;
  /**
   * Whether the fitness-age comparison shows on Today.
   *
   * Off by default: "8 years younger" against a birthday is the sort of line
   * that lands differently depending on which way it points, and it is not
   * information somebody needs every single morning. The number itself stays.
   */
  showAgeDelta: boolean;
  setShowAgeDelta: (next: boolean) => void;
  /** Every stat, in the member's order. */
  order: StatId[];
  hidden: StatId[];
  visible: StatId[];
  toggle: (id: StatId) => void;
  move: (id: StatId, direction: -1 | 1) => void;
  /** Replaces the whole order at once, for a drag that moved a tile far. */
  reorder: (next: StatId[]) => void;
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
  const [showAgeDelta, setShowAgeDeltaState] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    void Promise.all([
      SecureStore.getItemAsync(ORDER_KEY),
      SecureStore.getItemAsync(HIDDEN_KEY),
      SecureStore.getItemAsync(AGE_DELTA_KEY),
    ])
      .then(([storedOrder, storedHidden, storedAgeDelta]) => {
        if (storedAgeDelta === "true") setShowAgeDeltaState(true);
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

  const setShowAgeDelta = useCallback((next: boolean) => {
    setShowAgeDeltaState(next);
    void SecureStore.setItemAsync(AGE_DELTA_KEY, String(next)).catch(() => {});
  }, []);

  const reorder = useCallback(
    (next: StatId[]) => {
      // Anything missing from the incoming list is appended rather than lost —
      // a drag only knows about what is on screen.
      const complete = [...next, ...STAT_IDS.filter((id) => !next.includes(id))];
      persist(complete, hidden);
    },
    [hidden, persist],
  );

  const reset = useCallback(() => {
    persist([...STAT_IDS], DEFAULT_HIDDEN);
    setShowAgeDelta(false);
  }, [persist, setShowAgeDelta]);

  const value = useMemo<StatPreferences>(
    () => ({
      ready,
      order,
      hidden,
      visible: order.filter((id) => !hidden.includes(id)),
      showAgeDelta,
      setShowAgeDelta,
      toggle,
      move,
      reorder,
      reset,
    }),
    [ready, order, hidden, showAgeDelta, setShowAgeDelta, toggle, move, reorder, reset],
  );

  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useStatPreferences(): StatPreferences {
  const value = useContext(Context);
  if (!value) throw new Error("useStatPreferences must be used inside StatPreferencesProvider");
  return value;
}
