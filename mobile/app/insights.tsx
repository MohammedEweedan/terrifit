import { Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from "react-native";
import { Text } from "@/components/AppText";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppState } from "@/app-state";
import { useDashboard } from "@/data";
import { fonts, display, theme } from "@/theme";
import { ModalHeader } from "@/components/ModalHeader";
import { TerrifitSpinner } from "@/components/TerrifitSpinner";
import { Sparkline } from "@/components/Sparkline";
import type { Dashboard, Insight } from "@/api";


/**
 * What your own history says about you.
 *
 * Each finding carries what the data says, the numbers behind it, and
 * something to do — an observation with no action is a horoscope with a chart
 * attached, and that is what people cancel over.
 */
export default function InsightsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isPro } = useAppState();
  const { width } = useWindowDimensions();
  const dashboard = useDashboard();
  const found = dashboard.data?.advanced.insights ?? [];

  return (
    <View style={s.page}>
      <ModalHeader title="Insights" />

      <ScrollView contentContainerStyle={[s.content, { paddingBottom: insets.bottom + 40 }]}>
        {dashboard.loading && !dashboard.data ? (
          <TerrifitSpinner style={{ marginTop: 50 }} />
        ) : null}

        {!isPro ? (
          <View style={s.locked}>
            <Text style={s.lockedTitle}>Insights are part of Pro</Text>
            <Text style={s.lockedBody}>
              Terrifit reads your own history for the relationships that actually hold — which nights lift your HRV,
              what the hard days cost, which day of the week you sleep worst — and tells you what to do about each one.
            </Text>
            <Pressable onPress={() => router.push("/pro" as never)} style={s.primary}>
              <Text style={s.primaryText}>See Pro</Text>
            </Pressable>
          </View>
        ) : null}

        {isPro && found.length === 0 && dashboard.data ? (
          <View style={s.locked}>
            <Text style={s.lockedTitle}>Nothing to report yet</Text>
            <Text style={s.lockedBody}>
              Findings need a few weeks of history before they mean anything. Rather than guess, this stays empty until
              the numbers can carry a claim.
            </Text>
          </View>
        ) : null}

        {isPro
          ? found.map((insight) => (
              <InsightCard key={insight.id} insight={insight} history={dashboard.data?.history ?? []} width={width} />
            ))
          : null}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: theme.bg },
  top: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 18, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: theme.line },
  close: { color: theme.accent, fontSize: 14, fontFamily: fonts.bold, fontWeight: "700", width: 46 },
  topTitle: { color: theme.ink, fontSize: 11, fontFamily: fonts.black, fontWeight: "900", letterSpacing: 1.5, textTransform: "uppercase" },
  content: { paddingHorizontal: 18, paddingTop: 18 },
  card: { borderRadius: 22, borderWidth: 1, borderColor: theme.line, backgroundColor: theme.surface, padding: 18, marginBottom: 14 },
  title: { color: theme.ink, fontSize: 20, fontFamily: fonts.black, fontWeight: "900", letterSpacing: -0.3 },
  body: { color: theme.ink2, fontSize: 14, lineHeight: 21, marginTop: 9 },
  // Marked by a rule rather than set entirely in the accent: a whole paragraph
  // of orange shouts, and the point is that this is the part to act on, not
  // that it is louder than the finding above it.
  actionRow: { flexDirection: "row", gap: 12, marginTop: 16 },
  actionRule: { width: 3, borderRadius: 2, backgroundColor: theme.accent },
  action: { flex: 1, color: theme.ink, fontSize: 14, lineHeight: 21, fontFamily: fonts.semibold, fontWeight: "600" },
  chart: { marginTop: 14, marginBottom: 4 },
  chartLabel: { color: theme.muted, fontSize: 10, fontFamily: fonts.black, fontWeight: "800", letterSpacing: 0.8, textTransform: "uppercase", marginTop: 8 },
  evidence: { color: theme.muted, fontSize: 11, lineHeight: 16, marginTop: 14 },
  locked: { padding: 22, borderRadius: 22, borderWidth: 1, borderColor: theme.lineStrong, backgroundColor: theme.surface, alignItems: "center" },
  lockedTitle: { color: theme.ink, fontFamily: display, fontSize: 26, textTransform: "uppercase", textAlign: "center" },
  lockedBody: { color: theme.ink2, fontSize: 14, lineHeight: 21, textAlign: "center", marginTop: 12 },
  primary: { height: 52, borderRadius: 26, backgroundColor: theme.accent, paddingHorizontal: 32, alignItems: "center", justifyContent: "center", marginTop: 22 },
  primaryText: { color: "#fff", fontSize: 11, fontFamily: fonts.black, fontWeight: "900", letterSpacing: 1, textTransform: "uppercase" },
});

/**
 * Which line backs each finding.
 *
 * An insight that says your sleep is short should show the sleep line, not a
 * confidence badge — the reader can then see the claim rather than being asked
 * to trust it. Kinds with no single series (a record, a weekday pattern) get
 * no chart rather than a decorative one.
 */
const SERIES: Record<
  string,
  { read: (row: Dashboard["history"][number]) => number | null; label: string; tone: string } | undefined
> = {
  sleep: { read: (row) => row.sleepMinutes, label: "Sleep", tone: theme.sleep },
  recovery: { read: (row) => row.recovery, label: "Recovery", tone: theme.good },
  load: { read: (row) => row.hrvMs, label: "HRV", tone: theme.good },
  activity: { read: (row) => row.steps, label: "Steps", tone: theme.accent },
  weight: { read: (row) => row.weightKg, label: "Weight", tone: theme.ink2 },
};

function InsightCard({
  insight,
  history,
  width,
}: {
  insight: Insight;
  history: Dashboard["history"];
  width: number;
}) {
  const series = SERIES[insight.kind];

  // Oldest first, last six weeks: enough to show a trend, short enough that a
  // sparkline is still readable.
  const points = series
    ? [...history].slice(0, 42).reverse().map((row) => row.date && series.read(row)).filter((value): value is number => value != null)
    : [];

  return (
    <View style={s.card}>
      <Text style={s.title}>{insight.title}</Text>
      <Text style={s.body}>{insight.body}</Text>

      {points.length >= 6 ? (
        <View style={s.chart}>
          <Sparkline points={points} width={width - 76} height={64} colour={series?.tone} />
          <Text style={s.chartLabel}>
            {series?.label} · last {points.length} days
          </Text>
        </View>
      ) : null}

      <View style={s.actionRow}>
        <View style={s.actionRule} />
        <Text style={s.action}>{insight.action}</Text>
      </View>
      <Text style={s.evidence}>{insight.evidence}</Text>
    </View>
  );
}
