import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppState } from "@/app-state";
import { useDashboard } from "@/data";
import { display, theme } from "@/theme";

const CONFIDENCE: Record<string, { label: string; tone: string }> = {
  high: { label: "Strong evidence", tone: theme.good },
  medium: { label: "Reasonable evidence", tone: theme.fair },
  low: { label: "Early signal", tone: theme.muted },
};

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
  const dashboard = useDashboard();
  const found = dashboard.data?.advanced.insights ?? [];

  return (
    <View style={s.page}>
      <View style={[s.top, { paddingTop: insets.top + 10 }]}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Text style={s.close}>Done</Text>
        </Pressable>
        <Text style={s.topTitle}>Insights</Text>
        <View style={{ width: 46 }} />
      </View>

      <ScrollView contentContainerStyle={[s.content, { paddingBottom: insets.bottom + 40 }]}>
        {dashboard.loading && !dashboard.data ? (
          <ActivityIndicator color={theme.accent} style={{ marginTop: 50 }} />
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
          ? found.map((insight) => {
              const confidence = CONFIDENCE[insight.confidence] ?? CONFIDENCE.low;
              return (
                <View key={insight.id} style={s.card}>
                  <View style={s.cardTop}>
                    <Text style={s.kind}>{insight.kind}</Text>
                    <View style={[s.confidence, { borderColor: confidence.tone }]}>
                      <Text style={[s.confidenceText, { color: confidence.tone }]}>{confidence.label}</Text>
                    </View>
                  </View>

                  <Text style={s.title}>{insight.title}</Text>
                  <Text style={s.body}>{insight.body}</Text>

                  <View style={s.action}>
                    <Text style={s.actionLabel}>What to do</Text>
                    <Text style={s.actionText}>{insight.action}</Text>
                  </View>

                  <Text style={s.evidence}>{insight.evidence}</Text>
                </View>
              );
            })
          : null}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: theme.bg },
  top: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 18, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: theme.line },
  close: { color: theme.accent, fontSize: 14, fontWeight: "700", width: 46 },
  topTitle: { color: theme.ink, fontSize: 11, fontWeight: "900", letterSpacing: 1.5, textTransform: "uppercase" },
  content: { paddingHorizontal: 18, paddingTop: 18 },
  card: { borderRadius: 22, borderWidth: 1, borderColor: theme.line, backgroundColor: theme.surface, padding: 18, marginBottom: 14 },
  cardTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  kind: { color: theme.muted, fontSize: 10, fontWeight: "900", letterSpacing: 1.3, textTransform: "uppercase" },
  confidence: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 4 },
  confidenceText: { fontSize: 10, fontWeight: "900" },
  title: { color: theme.ink, fontSize: 20, fontWeight: "900", marginTop: 12, letterSpacing: -0.3 },
  body: { color: theme.ink2, fontSize: 14, lineHeight: 21, marginTop: 9 },
  action: { marginTop: 16, padding: 14, borderRadius: 16, backgroundColor: theme.accentSoft, borderLeftWidth: 3, borderLeftColor: theme.accent },
  actionLabel: { color: theme.accent, fontSize: 10, fontWeight: "900", letterSpacing: 1.3, textTransform: "uppercase" },
  actionText: { color: theme.ink, fontSize: 14, lineHeight: 21, marginTop: 7 },
  evidence: { color: theme.muted, fontSize: 11, lineHeight: 16, marginTop: 14 },
  locked: { padding: 22, borderRadius: 22, borderWidth: 1, borderColor: theme.lineStrong, backgroundColor: theme.surface, alignItems: "center" },
  lockedTitle: { color: theme.ink, fontFamily: display, fontSize: 26, textTransform: "uppercase", textAlign: "center" },
  lockedBody: { color: theme.ink2, fontSize: 14, lineHeight: 21, textAlign: "center", marginTop: 12 },
  primary: { height: 52, borderRadius: 26, backgroundColor: theme.accent, paddingHorizontal: 32, alignItems: "center", justifyContent: "center", marginTop: 22 },
  primaryText: { color: "#fff", fontSize: 11, fontWeight: "900", letterSpacing: 1, textTransform: "uppercase" },
});
