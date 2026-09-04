import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from "react-native";
import { Text } from "@/components/AppText";
import { Screen } from "@/components/Screen";
import { Sparkline } from "@/components/Sparkline";
import { useDashboard } from "@/data";
import { duration, plural, shortDate, weight } from "@/format";
import { fonts, display, theme } from "@/theme";
import type { Dashboard } from "@/api";
import { TerrifitSpinner } from "@/components/TerrifitSpinner";

type Point = Dashboard["history"][number];

type Metric = {
  key: string;
  label: string;
  read: (point: Point) => number | null;
  format: (value: number | null, units: string) => string;
  /**
   * Which direction counts as an improvement. Weight is "neutral" on purpose —
   * someone gaining is not doing worse than someone cutting, and colouring it
   * green or amber would be the app taking a side it has no business taking.
   */
  better: "higher" | "lower" | "neutral";
  note: string;
};

const METRICS: Metric[] = [
  {
    key: "recovery", label: "Readiness", read: (p) => p.recovery, better: "higher",
    format: (v) => (v == null ? "—" : `${Math.round(v)}%`),
    note: "Scored against your own last 30 days, not a population average.",
  },
  {
    key: "hrv", label: "HRV", read: (p) => p.hrvMs, better: "higher",
    format: (v) => (v == null ? "—" : `${Math.round(v)} ms`),
    note: "Overnight heart-rate variability. Rising usually means you're absorbing the work.",
  },
  {
    key: "rhr", label: "Resting HR", read: (p) => p.restingHr, better: "lower",
    format: (v) => (v == null ? "—" : `${Math.round(v)} bpm`),
    note: "A resting rate creeping up for days is the earliest warning you get.",
  },
  {
    key: "sleep", label: "Sleep", read: (p) => p.sleepMinutes, better: "higher",
    format: (v) => duration(v),
    note: "Time actually asleep, not time in bed.",
  },
  {
    key: "steps", label: "Steps", read: (p) => p.steps, better: "higher",
    format: (v) => (v == null ? "—" : Math.round(v).toLocaleString()),
    note: "The base you build everything else on top of.",
  },
  {
    key: "energy", label: "Active kcal", read: (p) => p.activeKcal, better: "higher",
    format: (v) => (v == null ? "—" : `${Math.round(v)} kcal`),
    note: "Energy above resting — what training and walking added.",
  },
  {
    key: "weight", label: "Weight", read: (p) => p.weightKg, better: "neutral",
    format: (v, units) => weight(v, units),
    note: "Read the line, not the day. Water moves a kilo either way.",
  },
];

const RANGES = [
  { key: "30", label: "30 days", days: 30 },
  { key: "90", label: "90 days", days: 90 },
] as const;

export default function TrendsScreen() {
  const { data, error, loading, refreshing, reload } = useDashboard();
  const { width } = useWindowDimensions();
  const [metricKey, setMetricKey] = useState(METRICS[0].key);
  const [rangeDays, setRangeDays] = useState<number>(30);

  const metric = METRICS.find((m) => m.key === metricKey) ?? METRICS[0];
  const units = data?.units ?? "metric";

  // The API sends newest first; charts read left to right through time.
  const series = useMemo(() => {
    const history = data?.history ?? [];
    return [...history].slice(0, rangeDays).reverse();
  }, [data, rangeDays]);

  const values = series.map(metric.read);
  const present = values.filter((v): v is number => v != null);
  const chartWidth = width - 36 - 36;

  const latest = present.at(-1) ?? null;
  const average = present.length ? present.reduce((sum, v) => sum + v, 0) / present.length : null;
  const change = changeOverRange(values);

  return (
    <Screen eyebrow="Your own history" title="Trends" refreshing={refreshing} onRefresh={reload}>
      {loading && !data ? <TerrifitSpinner style={{ marginTop: 40 }} /> : null}
      {error ? <Text style={s.error}>{error}</Text> : null}

      {data ? (
        <>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chips}>
            {METRICS.map((option) => {
              const active = option.key === metric.key;
              return (
                <Pressable
                  key={option.key}
                  onPress={() => setMetricKey(option.key)}
                  style={[s.chip, active && s.chipOn]}
                >
                  <Text style={[s.chipText, active && s.chipTextOn]}>{option.label}</Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <View style={s.card}>
            <View style={s.cardHead}>
              <View style={{ flex: 1 }}>
                <Text style={s.cardLabel}>{metric.label}</Text>
                <Text style={s.cardValue}>{metric.format(latest, units)}</Text>
              </View>
              {change != null ? (
                <View style={[s.delta, { borderColor: deltaColour(change, metric.better) }]}>
                  <Text style={[s.deltaText, { color: deltaColour(change, metric.better) }]}>
                    {change > 0 ? "▲" : change < 0 ? "▼" : "—"} {metric.format(Math.abs(change), units)}
                  </Text>
                </View>
              ) : null}
            </View>

            {present.length >= 2 ? (
              <>
                <Sparkline points={values} width={chartWidth} height={96} />
                <View style={s.axis}>
                  <Text style={s.axisText}>{series[0] ? shortDate(series[0].date) : ""}</Text>
                  <Text style={s.axisText}>{series.at(-1) ? shortDate(series.at(-1)!.date) : ""}</Text>
                </View>
              </>
            ) : (
              <Text style={s.thin}>
                Two readings and this draws a line. You have {plural(present.length, "day")} of {metric.label.toLowerCase()}.
              </Text>
            )}

            <View style={s.stats}>
              <Stat label="Average" value={metric.format(average, units)} />
              {metric.better === "neutral" ? (
                <Stat
                  label="Range"
                  value={
                    present.length
                      ? `${metric.format(Math.min(...present), units)} – ${metric.format(Math.max(...present), units)}`
                      : "—"
                  }
                />
              ) : (
                <Stat label="Best" value={metric.format(best(present, metric.better), units)} />
              )}
              <Stat label="Days" value={String(present.length)} />
            </View>

            <Text style={s.note}>{metric.note}</Text>
          </View>

          <View style={s.ranges}>
            {RANGES.map((range) => {
              const active = range.days === rangeDays;
              return (
                <Pressable
                  key={range.key}
                  onPress={() => setRangeDays(range.days)}
                  style={[s.range, active && s.rangeOn]}
                >
                  <Text style={[s.rangeText, active && s.rangeTextOn]}>{range.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </>
      ) : null}
    </Screen>
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

/** First and last real readings in the window, ignoring the gaps between them. */
function changeOverRange(values: Array<number | null>): number | null {
  const present = values.filter((v): v is number => v != null);
  if (present.length < 2) return null;
  return present[present.length - 1] - present[0];
}

function best(values: number[], better: "higher" | "lower"): number | null {
  if (values.length === 0) return null;
  return better === "higher" ? Math.max(...values) : Math.min(...values);
}

function deltaColour(change: number, better: Metric["better"]): string {
  if (change === 0 || better === "neutral") return theme.ink2;
  const improved = better === "higher" ? change > 0 : change < 0;
  return improved ? theme.good : theme.fair;
}

const s = StyleSheet.create({
  chips: { gap: 8, paddingBottom: 16, paddingRight: 18 },
  chip: { borderWidth: 1, borderColor: theme.line, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 },
  chipOn: { borderColor: theme.accent, backgroundColor: theme.accentSoft },
  chipText: { color: theme.ink2, fontSize: 11, fontFamily: fonts.black, fontWeight: "800", letterSpacing: 0.8, textTransform: "uppercase" },
  chipTextOn: { color: theme.accent },
  card: { backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.line, borderRadius: 4, padding: 18 },
  cardHead: { flexDirection: "row", alignItems: "flex-start", marginBottom: 18 },
  cardLabel: { color: theme.ink2, fontSize: 10, fontFamily: fonts.black, fontWeight: "800", letterSpacing: 1.6, textTransform: "uppercase" },
  cardValue: { color: theme.ink, fontFamily: display, fontSize: 36, marginTop: 6, includeFontPadding: false },
  delta: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, marginTop: 4 },
  deltaText: { fontSize: 11, fontFamily: fonts.black, fontWeight: "800", fontVariant: ["tabular-nums"] },
  axis: { flexDirection: "row", justifyContent: "space-between", marginTop: 6 },
  axisText: { color: theme.muted, fontSize: 10 },
  thin: { color: theme.ink2, fontSize: 13, lineHeight: 19, paddingVertical: 20 },
  stats: { flexDirection: "row", gap: 10, marginTop: 18, borderTopWidth: 1, borderTopColor: theme.line, paddingTop: 16 },
  stat: { flex: 1 },
  statLabel: { color: theme.muted, fontSize:10, fontFamily: fonts.black, fontWeight: "800", letterSpacing: 1.2, textTransform: "uppercase" },
  statValue: { color: theme.ink, fontSize: 16, fontFamily: fonts.bold, fontWeight: "700", marginTop: 5, fontVariant: ["tabular-nums"] },
  note: { color: theme.ink2, fontSize: 12, lineHeight: 18, marginTop: 16 },
  ranges: { flexDirection: "row", gap: 8, marginTop: 14, justifyContent: "center" },
  range: { borderWidth: 1, borderColor: theme.line, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 8 },
  rangeOn: { borderColor: theme.lineStrong, backgroundColor: theme.surface },
  rangeText: { color: theme.muted, fontSize: 10, fontFamily: fonts.black, fontWeight: "800", letterSpacing: 1.2, textTransform: "uppercase" },
  rangeTextOn: { color: theme.ink },
  error: { color: theme.poor, fontSize: 13, marginBottom: 16 },
});
