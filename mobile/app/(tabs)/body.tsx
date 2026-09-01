import { ActivityIndicator, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { Screen } from "@/components/Screen";
import { Sparkline } from "@/components/Sparkline";
import { useBody, useDashboard } from "@/data";
import { plural, shortDate, sourceName, weight } from "@/format";
import { display, theme } from "@/theme";
import type { BodyScan } from "@/api";

export default function BodyScreen() {
  const { data, error, loading, refreshing, reload } = useBody();
  const dashboard = useDashboard();
  const { width } = useWindowDimensions();

  const units = dashboard.data?.units ?? "metric";
  const scans = data?.scans ?? [];
  const latest = scans[0];
  const previous = scans[1];
  const chartWidth = width - 36 - 36;

  // Oldest first for the chart; the API sends newest first for the list.
  const fatSeries = [...scans].reverse().map((scan) => scan.bodyFatPercent);
  const muscleSeries = [...scans].reverse().map((scan) => scan.skeletalMuscleKg);

  return (
    <Screen eyebrow="Composition" title="Body" refreshing={refreshing} onRefresh={reload}>
      {loading && !data ? <ActivityIndicator color={theme.accent} style={{ marginTop: 40 }} /> : null}
      {error ? <Text style={s.error}>{error}</Text> : null}

      {data && scans.length === 0 ? (
        <View style={s.card}>
          <Text style={s.emptyTitle}>No scans yet</Text>
          <Text style={s.emptyBody}>
            Import an InBody or a smart-scale export on the website and every weigh-in since your first one shows up
            here, with the trend line that a single reading can never give you.
          </Text>
        </View>
      ) : null}

      {latest ? (
        <>
          <View style={s.card}>
            <Text style={s.cardLabel}>Latest scan · {shortDate(latest.takenAt)}</Text>
            <View style={s.grid}>
              <Metric
                label="Weight"
                value={weight(latest.weightKg, units)}
                delta={delta(latest.weightKg, previous?.weightKg, (v) => weight(v, units))}
                good="neutral"
              />
              <Metric
                label="Body fat"
                value={latest.bodyFatPercent == null ? "—" : `${latest.bodyFatPercent.toFixed(1)}%`}
                delta={delta(latest.bodyFatPercent, previous?.bodyFatPercent, (v) => `${v.toFixed(1)}%`)}
                good="lower"
              />
              <Metric
                label="Muscle"
                value={latest.skeletalMuscleKg == null ? "—" : weight(latest.skeletalMuscleKg, units)}
                delta={delta(latest.skeletalMuscleKg, previous?.skeletalMuscleKg, (v) => weight(v, units))}
              />
              <Metric
                label="Body water"
                value={latest.bodyWaterL == null ? "—" : `${latest.bodyWaterL.toFixed(1)} L`}
                delta={delta(latest.bodyWaterL, previous?.bodyWaterL, (v) => `${v.toFixed(1)} L`)}
              />
              <Metric
                label="Visceral fat"
                value={latest.visceralFatLevel == null ? "—" : String(latest.visceralFatLevel)}
                delta={delta(latest.visceralFatLevel, previous?.visceralFatLevel, (v) => v.toFixed(0))}
                good="lower"
              />
              <Metric
                label="BMR"
                value={latest.basalMetabolicRate == null ? "—" : `${Math.round(latest.basalMetabolicRate)} kcal`}
                delta={delta(latest.basalMetabolicRate, previous?.basalMetabolicRate, (v) => `${Math.round(v)}`)}
              />
            </View>
            <Text style={s.source}>From {sourceName(latest.source)} · {plural(scans.length, "scan")} on file</Text>
          </View>

          {fatSeries.filter((v) => v != null).length >= 2 ? (
            <View style={s.card}>
              <Text style={s.cardLabel}>Body fat over time</Text>
              <Sparkline points={fatSeries} width={chartWidth} height={80} colour={theme.accent} />
              <Text style={s.note}>
                One scan is a snapshot with a margin of error. The line between them is the part you can act on.
              </Text>
            </View>
          ) : null}

          {muscleSeries.filter((v) => v != null).length >= 2 ? (
            <View style={s.card}>
              <Text style={s.cardLabel}>Skeletal muscle over time</Text>
              <Sparkline points={muscleSeries} width={chartWidth} height={80} colour={theme.good} />
              <Text style={s.note}>Holding muscle while fat comes down is the whole job. This is where you check.</Text>
            </View>
          ) : null}

          <Text style={s.listHead}>Every scan</Text>
          {scans.map((scan) => (
            <ScanRow key={scan.id} scan={scan} units={units} />
          ))}
        </>
      ) : null}
    </Screen>
  );
}

function ScanRow({ scan, units }: { scan: BodyScan; units: string }) {
  return (
    <View style={s.row}>
      <View style={{ flex: 1 }}>
        <Text style={s.rowDate}>{shortDate(scan.takenAt)}</Text>
        <Text style={s.rowSource}>{sourceName(scan.source)}</Text>
      </View>
      <Text style={s.rowValue}>{weight(scan.weightKg, units)}</Text>
      <Text style={s.rowValue}>{scan.bodyFatPercent == null ? "—" : `${scan.bodyFatPercent.toFixed(1)}%`}</Text>
    </View>
  );
}

function Metric({
  label,
  value,
  delta: change,
  good = "higher",
}: {
  label: string;
  value: string;
  delta: { text: string; raw: number } | null;
  /** Weight is neutral on purpose — a kilo gained is not a kilo lost the wrong way. */
  good?: "higher" | "lower" | "neutral";
}) {
  const colour =
    change == null || change.raw === 0 || good === "neutral"
      ? theme.ink2
      : (good === "higher" ? change.raw > 0 : change.raw < 0)
        ? theme.good
        : theme.fair;

  return (
    <View style={s.metric}>
      <Text style={s.metricLabel}>{label}</Text>
      <Text style={s.metricValue}>{value}</Text>
      {change ? <Text style={[s.metricDelta, { color: colour }]}>{change.text}</Text> : null}
    </View>
  );
}

/** Signed change against the previous scan, already formatted, or null when there's nothing to compare. */
function delta(
  current: number | null,
  before: number | null | undefined,
  format: (value: number) => string,
): { text: string; raw: number } | null {
  if (current == null || before == null) return null;
  const raw = current - before;
  if (Math.abs(raw) < 0.05) return { text: "no change", raw: 0 };
  return { text: `${raw > 0 ? "+" : "−"}${format(Math.abs(raw))}`, raw };
}

const s = StyleSheet.create({
  card: { backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.line, borderRadius: 4, padding: 18, marginBottom: 12 },
  cardLabel: { color: theme.ink2, fontSize: 10, fontWeight: "800", letterSpacing: 1.6, textTransform: "uppercase", marginBottom: 14 },
  grid: { flexDirection: "row", flexWrap: "wrap" },
  metric: { width: "50%", paddingVertical: 10, paddingRight: 10 },
  metricLabel: { color: theme.muted, fontSize:10, fontWeight: "800", letterSpacing: 1.2, textTransform: "uppercase" },
  metricValue: { color: theme.ink, fontFamily: display, fontSize: 24, marginTop: 5, includeFontPadding: false },
  metricDelta: { fontSize: 11, fontWeight: "700", marginTop: 4, fontVariant: ["tabular-nums"] },
  source: { color: theme.muted, fontSize: 11, marginTop: 12, borderTopWidth: 1, borderTopColor: theme.line, paddingTop: 12 },
  note: { color: theme.ink2, fontSize: 12, lineHeight: 18, marginTop: 12 },
  listHead: { color: theme.accent, fontSize: 10, fontWeight: "800", letterSpacing: 1.6, textTransform: "uppercase", marginTop: 12, marginBottom: 10 },
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: theme.line },
  rowDate: { color: theme.ink, fontSize: 14, fontWeight: "600" },
  rowSource: { color: theme.muted, fontSize: 11, marginTop: 3 },
  rowValue: { color: theme.ink2, fontSize: 14, width: 78, textAlign: "right", fontVariant: ["tabular-nums"] },
  emptyTitle: { color: theme.ink, fontFamily: display, fontSize: 22, textTransform: "uppercase" },
  emptyBody: { color: theme.ink2, fontSize: 14, lineHeight: 21, marginTop: 10 },
  error: { color: theme.poor, fontSize: 13, marginBottom: 16 },
});
