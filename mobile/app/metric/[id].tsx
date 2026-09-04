import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from "react-native";
import { Text } from "@/components/AppText";
import { useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MetricChart, type Point } from "@/components/MetricChart";
import { useDashboard } from "@/data";
import { STAT_BLURBS, type StatId } from "@/stats";
import { metricLabel, type MetricKey } from "@/metric-labels";
import { usePreferences } from "@/preferences";
import { fonts, theme } from "@/theme";
import type { Dashboard } from "@/api";
import { ModalHeader } from "@/components/ModalHeader";
import { TerrifitSpinner } from "@/components/TerrifitSpinner";

/**
 * The ranges the stored data can honestly support.
 *
 * There is no hourly view because there is no hourly data: everything is
 * aggregated to one row per day on the way in, from HealthKit and from file
 * imports alike. Intraday would mean storing samples rather than days, which
 * is a schema change, not a button.
 */
const RANGES = [
  { key: "7", label: "Week", days: 7 },
  { key: "30", label: "Month", days: 30 },
  { key: "90", label: "3M", days: 90 },
  { key: "365", label: "Year", days: 365 },
  { key: "all", label: "All", days: 3650 },
] as const;

type Row = Dashboard["history"][number];

/** How to pull each stat out of a history row, and how to render it. */
const READERS: Record<StatId, { read: (row: Row) => number | null; format: (v: number) => string; tone: string; better: "higher" | "lower" | "neutral" }> = {
  tScore: { read: (r) => r.tScore, format: (v) => `${Math.round(v)}`, tone: theme.accent, better: "higher" },
  hrv: { read: (r) => r.hrvMs, format: (v) => `${Math.round(v)} ms`, tone: theme.good, better: "higher" },
  restingHr: { read: (r) => r.restingHr, format: (v) => `${Math.round(v)} bpm`, tone: theme.good, better: "lower" },
  heartRate: { read: (r) => r.averageHr, format: (v) => `${Math.round(v)} bpm`, tone: theme.poor, better: "lower" },
  sleep: { read: (r) => r.sleepMinutes, format: (v) => `${Math.floor(v / 60)}h ${String(Math.round(v % 60)).padStart(2, "0")}m`, tone: theme.sleep, better: "higher" },
  steps: { read: (r) => r.steps, format: (v) => Math.round(v).toLocaleString(), tone: theme.accent, better: "higher" },
  active: { read: (r) => r.activeKcal, format: (v) => `${Math.round(v)} kcal`, tone: theme.accent, better: "higher" },
  consistency: { read: (r) => r.recovery, format: (v) => `${Math.round(v)}%`, tone: theme.good, better: "higher" },
  weight: { read: (r) => r.weightKg, format: (v) => `${v.toFixed(1)} kg`, tone: theme.ink2, better: "neutral" },
  readiness: { read: (r) => r.recovery, format: (v) => `${Math.round(v)}%`, tone: theme.good, better: "higher" },
};

/**
 * One metric, plotted.
 *
 * Opened from a tile in the daily signal, because a number on a card only
 * tells you where you are — the line is what tells you which way you are
 * going, and that is the part worth acting on.
 */
export default function MetricScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const dashboard = useDashboard();
  const { locale } = usePreferences();
  const [days, setDays] = useState<number>(30);

  const statId = (id && id in READERS ? id : "hrv") as StatId;
  const reader = READERS[statId];

  // The API sends newest first; a chart reads left to right through time.
  const points = useMemo<Point[]>(() => {
    const history = dashboard.data?.history ?? [];
    return [...history]
      .slice(0, days)
      .reverse()
      .map((row) => ({ date: row.date, value: reader.read(row) }));
  }, [dashboard.data, days, reader]);

  const values = points.map((point) => point.value).filter((value): value is number => value != null);
  const latest = values.at(-1) ?? null;
  const average = values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
  const change = values.length >= 2 ? values[values.length - 1] - values[0] : null;

  // A run in one direction is worth naming; a single reading is not.
  const warning = useMemo(() => {
    if (values.length < 6) return null;
    const recent = values.slice(-3);
    const earlier = values.slice(0, -3);
    const recentMean = recent.reduce((sum, v) => sum + v, 0) / recent.length;
    const earlierMean = earlier.reduce((sum, v) => sum + v, 0) / earlier.length;
    const sd = Math.sqrt(earlier.reduce((sum, v) => sum + (v - earlierMean) ** 2, 0) / earlier.length) || 1;
    const z = (recentMean - earlierMean) / sd;
    if (Math.abs(z) < 1.1 || reader.better === "neutral") return null;

    const worse = reader.better === "higher" ? z < 0 : z > 0;
    const direction = z > 0 ? "up" : "down";
    return {
      tone: worse ? theme.fair : theme.good,
      text: worse
        ? `Your last three readings are ${direction} against the rest of this range. One run does not mean much; three weeks of it does.`
        : `Your last three readings are ${direction} on the rest of this range — the direction you want.`,
    };
  }, [values, reader.better]);

  const changeTone =
    change == null || change === 0 || reader.better === "neutral"
      ? theme.ink2
      : (reader.better === "higher" ? change > 0 : change < 0)
        ? theme.good
        : theme.fair;

  return (
    <View style={s.page}>
      <ModalHeader title={metricLabel(statId as MetricKey, locale)} />

      <View style={s.ranges}>
        {RANGES.map((range) => {
          const on = range.days === days;
          return (
            <Pressable key={range.key} onPress={() => setDays(range.days)} style={[s.range, on && s.rangeOn]}>
              <Text style={[s.rangeText, on && s.rangeTextOn]}>{range.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <ScrollView contentContainerStyle={[s.content, { paddingBottom: insets.bottom + 40 }]}>
        {dashboard.loading && !dashboard.data ? (
          <TerrifitSpinner style={{ marginTop: 60 }} />
        ) : null}

        {warning ? (
          <View style={[s.warning, { borderColor: warning.tone }]}>
            <View style={[s.warningDot, { backgroundColor: warning.tone }]} />
            <Text style={s.warningText}>{warning.text}</Text>
          </View>
        ) : null}

        <View style={s.headline}>
          <Text style={s.value}>{latest == null ? "—" : reader.format(latest)}</Text>
          {change != null ? (
            <View style={[s.delta, { borderColor: changeTone }]}>
              <Text style={[s.deltaText, { color: changeTone }]}>
                {change > 0 ? "▲" : change < 0 ? "▼" : "—"} {reader.format(Math.abs(change))}
              </Text>
            </View>
          ) : null}
        </View>
        <Text style={s.blurb}>{STAT_BLURBS[statId]}</Text>

        <View style={s.card}>
          <MetricChart
            points={points}
            colour={reader.tone}
            format={reader.format}
            viewWidth={width - 36 - 2}
          />
        </View>

        <View style={s.stats}>
          <Stat label="Average" value={average == null ? "—" : reader.format(average)} />
          <Stat label="Lowest" value={values.length ? reader.format(Math.min(...values)) : "—"} />
          <Stat label="Highest" value={values.length ? reader.format(Math.max(...values)) : "—"} />
          <Stat label="Readings" value={String(values.length)} />
        </View>

        <Text style={s.note}>
          Peaks run red and troughs run orange through the line itself, so the shape carries the reading.
        </Text>
        <Text style={s.note}>
          {values.length < 2
            ? "Import more history and this fills in."
            : "Scroll the chart sideways to move through the range. Gaps are days with no reading — the line breaks rather than guessing what happened."}
        </Text>
        <Text style={s.note}>
          Everything here is one reading per day. Hour-by-hour would mean storing every sample rather than a daily
          summary, which is not something the app does yet.
        </Text>
      </ScrollView>
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.stat}>
      <Text style={s.statLabel}>{label}</Text>
      <Text style={s.statValue}>{value}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: theme.bg },
  top: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingBottom: 12,
  },
  close: { color: theme.accent, fontSize: 14, fontFamily: fonts.bold, fontWeight: "700" },
  topTitle: { color: theme.ink, fontSize: 11, fontFamily: fonts.black, fontWeight: "900", letterSpacing: 1.5, textTransform: "uppercase" },
  ranges: {
    flexDirection: "row",
    gap: 6,
    alignSelf: "center",
    padding: 3,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.line,
    backgroundColor: theme.surface,
    marginBottom: 16,
  },
  range: { paddingHorizontal: 20, paddingVertical: 8, borderRadius: 13 },
  rangeOn: { backgroundColor: theme.ink },
  rangeText: { color: theme.muted, fontSize: 10, fontFamily: fonts.black, fontWeight: "900", letterSpacing: 0.6 },
  rangeTextOn: { color: theme.bg },
  content: { paddingHorizontal: 18 },
  headline: { flexDirection: "row", alignItems: "center", gap: 12 },
  value: { color: theme.ink, fontSize: 34, fontFamily: fonts.black, fontWeight: "900", letterSpacing: -1 },
  delta: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  deltaText: { fontSize: 11, fontFamily: fonts.black, fontWeight: "900" },
  blurb: { color: theme.ink2, fontSize: 13, marginTop: 6, marginBottom: 18 },
  card: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: theme.line,
    backgroundColor: theme.surface,
    overflow: "hidden",
    paddingVertical: 6,
  },
  stats: { flexDirection: "row", flexWrap: "wrap", marginTop: 18 },
  stat: { width: "50%", paddingVertical: 12 },
  statLabel: { color: theme.muted, fontSize:10, fontFamily: fonts.black, fontWeight: "900", letterSpacing: 1.2, textTransform: "uppercase" },
  statValue: { color: theme.ink, fontSize: 18, fontFamily: fonts.black, fontWeight: "900", marginTop: 6 },
  note: { color: theme.muted, fontSize: 11, lineHeight: 17, marginTop: 14 },
  warning: { flexDirection: "row", alignItems: "center", gap: 10, borderWidth: 1, borderRadius: 14, padding: 13, marginBottom: 16 },
  warningDot: { width: 7, height: 7, borderRadius: 4 },
  warningText: { color: theme.ink2, fontSize: 12, lineHeight: 18, flex: 1 },
  legend: { flexDirection: "row", gap: 16, marginTop: 14 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 7 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { color: theme.muted, fontSize: 11, fontFamily: fonts.bold, fontWeight: "700" },
});
