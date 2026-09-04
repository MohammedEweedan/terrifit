import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import * as SecureStore from "expo-secure-store";
import { theme } from "./theme";
import type { Dashboard } from "./api";
import { metricLabel } from "./metric-labels";
import type { AppLocale } from "./preferences";

/**
 * The big number at the top of Today.
 *
 * One figure, stated plainly, with a short line beside it. Which figure is the
 * member's choice on Pro — some people open the app for their fitness age,
 * some for whether they slept, some for what the week has cost them — and a
 * free account gets the fitness age, which is the one we give away.
 */
export const HEADLINE_IDS = [
  "fitnessAge",
  "tScore",
  "recovery",
  "bodyBattery",
  "sleepQuality",
  "hrv",
  "restingHr",
  "vo2max",
] as const;

export type HeadlineId = (typeof HEADLINE_IDS)[number];

export type Headline = {
  id: HeadlineId;
  /** Sits above the figure, small. */
  eyebrow: string;
  /** The figure itself, already formatted. Null when there is nothing to show. */
  value: string | null;
  /** Unit or suffix, set smaller and tight to the figure. */
  suffix?: string;
  /** The line at the lower right of the figure. */
  caption: string;
  tone: string;
};

/** Free accounts get this one. It is the wedge, so it is never behind the gate. */
export const FREE_HEADLINE: HeadlineId = "fitnessAge";

export const HEADLINE_LABELS: Record<HeadlineId, string> = {
  fitnessAge: "Fitness age",
  tScore: "T Score",
  recovery: "Recovery",
  bodyBattery: "Body battery",
  sleepQuality: "Sleep quality",
  hrv: "HRV",
  restingHr: "Resting heart rate",
  vo2max: "VO₂max",
};

export const HEADLINE_BLURBS: Record<HeadlineId, string> = {
  fitnessAge: "What your resting heart rate says about your years",
  tScore: "How today's movement reads against your own history",
  recovery: "How ready your body is this morning",
  bodyBattery: "What is left in the reservoir right now",
  sleepQuality: "Not just how long, but whether it restored you",
  hrv: "Overnight heart-rate variability",
  restingHr: "Your lowest heart rate of the night",
  vo2max: "Estimated aerobic capacity",
};

/**
 * Builds every headline from one dashboard payload.
 *
 * A headline with no data returns `value: null` rather than a zero — a big
 * bold 0 at the top of the screen reads as a verdict, and it would be a lie.
 */
export function buildHeadlines(data: Dashboard | null, locale: AppLocale = "en"): Record<HeadlineId, Headline> {
  const latest = data?.latest;
  const today = data?.history?.[0];
  const advanced = data?.advanced;

  const age = advanced?.fitnessAge;
  const battery = advanced?.bodyBattery;
  const quality = advanced?.sleepQuality;

  // "In line with your usual X" needs a usual to compare against.
  const mean = (read: (row: Dashboard["history"][number]) => number | null) => {
    const values = (data?.history ?? []).slice(1, 31).map(read).filter((v): v is number => v != null);
    if (values.length < 2) return null;
    return values.reduce((sum, value) => sum + value, 0) / values.length;
  };

  const against = (value: number | null, usual: number | null, format: (v: number) => string) => {
    if (value == null) return "No reading yet";
    if (usual == null) return "Not enough history to compare";
    const change = value - usual;
    if (Math.abs(change) < Math.abs(usual) * 0.02) return `In line with your usual ${format(usual)}`;
    return `${format(Math.abs(change))} ${change > 0 ? "above" : "below"} your usual ${format(usual)}`;
  };

  return {
    fitnessAge: {
      id: "fitnessAge",
      // "You are 24 years old" reads as a sentence, so this one is a phrase
      // rather than the metric's name.
      eyebrow: YOU_ARE[locale] ?? YOU_ARE.en,
      value: age?.years != null ? String(age.years) : null,
      suffix: "years old",
      caption:
        age?.delta == null
          ? "Estimated from your resting heart rate"
          : age.delta === 0
            ? "Right on your birthday"
            : `${age.capped ? "At least " : ""}${Math.abs(age.delta)} years ${age.delta < 0 ? "younger" : "older"} than your birthday`,
      tone: theme.accent,
    },
    tScore: {
      id: "tScore",
      eyebrow: metricLabel("tScore", locale),
      value: latest?.movement.value != null ? String(Math.round(latest.movement.value)) : null,
      caption: against(today?.tScore ?? null, mean((row) => row.tScore), (v) => String(Math.round(v))),
      tone: theme.accent,
    },
    recovery: {
      id: "recovery",
      eyebrow: metricLabel("recovery", locale),
      value: latest?.recovery.value != null ? String(Math.round(latest.recovery.value)) : null,
      suffix: "%",
      caption: against(today?.recovery ?? null, mean((row) => row.recovery), (v) => `${Math.round(v)}%`),
      tone: theme.good,
    },
    bodyBattery: {
      id: "bodyBattery",
      eyebrow: metricLabel("bodyBattery", locale),
      value: battery?.current != null ? String(Math.round(battery.current)) : null,
      caption: battery?.narrative ?? "Charged by sleep, drained by the day",
      tone: theme.fair,
    },
    sleepQuality: {
      id: "sleepQuality",
      eyebrow: metricLabel("sleepQuality", locale),
      value: quality?.value != null ? String(Math.round(quality.value)) : null,
      caption: quality?.parts?.[0]?.detail ?? "Duration, restoration and regularity",
      tone: theme.sleep,
    },
    hrv: {
      id: "hrv",
      eyebrow: metricLabel("hrv", locale),
      value: today?.hrvMs != null ? String(Math.round(today.hrvMs)) : null,
      suffix: "ms",
      caption: against(today?.hrvMs ?? null, mean((row) => row.hrvMs), (v) => `${Math.round(v)} ms`),
      tone: theme.good,
    },
    restingHr: {
      id: "restingHr",
      eyebrow: metricLabel("restingHr", locale),
      value: today?.restingHr != null ? String(Math.round(today.restingHr)) : null,
      suffix: "bpm",
      caption: against(today?.restingHr ?? null, mean((row) => row.restingHr), (v) => `${Math.round(v)} bpm`),
      tone: theme.good,
    },
    vo2max: {
      id: "vo2max",
      eyebrow: metricLabel("vo2max", locale),
      value: age?.vo2max != null ? String(age.vo2max) : null,
      suffix: "ml/kg/min",
      caption: "Estimated from your resting and maximum heart rate",
      tone: theme.accent,
    },
  };
}

/* -------------------------------------------------------------------------- */

/** The lead-in to the fitness age, which is a sentence rather than a label. */
const YOU_ARE: Record<string, string> = {
  en: "You are", es: "Tienes", ar: "عمرك", fr: "Vous avez", de: "Du bist",
  nl: "Je bent", pt: "Tens", it: "Hai", tr: "Yaşınız", ru: "Вам",
};

const CHOSEN_KEY = "terrifit.headlines";

type HeadlinePreferences = {
  ready: boolean;
  /** In the order they are swiped through. Always at least one. */
  chosen: HeadlineId[];
  toggle: (id: HeadlineId) => void;
  move: (id: HeadlineId, direction: -1 | 1) => void;
  reset: () => void;
};

const Context = createContext<HeadlinePreferences | null>(null);

export function HeadlinePreferencesProvider({ children }: { children: ReactNode }) {
  const [chosen, setChosen] = useState<HeadlineId[]>([FREE_HEADLINE]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    void SecureStore.getItemAsync(CHOSEN_KEY)
      .then((stored) => {
        if (!stored) return;
        try {
          const parsed: unknown = JSON.parse(stored);
          if (!Array.isArray(parsed)) return;
          const valid = parsed.filter((id): id is HeadlineId => HEADLINE_IDS.includes(id as HeadlineId));
          if (valid.length > 0) setChosen(valid);
        } catch {
          // A corrupt value is the same as never having set one.
        }
      })
      .finally(() => setReady(true));
  }, []);

  const persist = useCallback((next: HeadlineId[]) => {
    setChosen(next);
    void SecureStore.setItemAsync(CHOSEN_KEY, JSON.stringify(next)).catch(() => {});
  }, []);

  const toggle = useCallback(
    (id: HeadlineId) => {
      const next = chosen.includes(id) ? chosen.filter((item) => item !== id) : [...chosen, id];
      // An empty carousel is a blank space where the headline was.
      if (next.length === 0) return;
      persist(next);
    },
    [chosen, persist],
  );

  const move = useCallback(
    (id: HeadlineId, direction: -1 | 1) => {
      const index = chosen.indexOf(id);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= chosen.length) return;
      const next = [...chosen];
      [next[index], next[target]] = [next[target], next[index]];
      persist(next);
    },
    [chosen, persist],
  );

  const reset = useCallback(() => persist([FREE_HEADLINE]), [persist]);

  const value = useMemo<HeadlinePreferences>(
    () => ({ ready, chosen, toggle, move, reset }),
    [ready, chosen, toggle, move, reset],
  );

  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useHeadlinePreferences(): HeadlinePreferences {
  const value = useContext(Context);
  if (!value) throw new Error("useHeadlinePreferences must be used inside HeadlinePreferencesProvider");
  return value;
}
