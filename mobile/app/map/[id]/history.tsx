import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useMapHistory } from "@/data";
import { display, theme } from "@/theme";

/** Everything you have actually done on this Map. */
export default function MapHistoryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const history = useMapHistory(id ?? "");
  const data = history.data;

  return (
    <View style={s.page}>
      <View style={[s.top, { paddingTop: insets.top + 10 }]}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Text style={s.back}>‹ Back</Text>
        </Pressable>
        <Text style={s.topTitle}>Your history</Text>
        <View style={{ width: 52 }} />
      </View>

      <ScrollView contentContainerStyle={[s.content, { paddingBottom: insets.bottom + 40 }]}>
        {history.loading && !data ? <ActivityIndicator color={theme.accent} style={{ marginTop: 50 }} /> : null}

        {data && data.sessions.length === 0 ? (
          <View style={s.empty}>
            <Text style={s.emptyTitle}>Nothing logged yet</Text>
            <Text style={s.emptyBody}>
              Finish a session and it lands here with every set you did — and next week&apos;s prescription starts
              from those numbers.
            </Text>
          </View>
        ) : null}

        {data && data.sessions.length > 0 ? (
          <>
            <View style={s.summary}>
              <Card value={String(data.summary.count)} label="Sessions" />
              <Card value={`${Math.round(data.summary.totalVolumeKg / 1000)}t`} label="Total volume" />
              <Card value={`${data.summary.bestVolumeKg.toLocaleString()}kg`} label="Best session" />
            </View>

            {data.sessions.map((session) => (
              <View key={session.id} style={s.session}>
                <View style={s.sessionTop}>
                  <View style={s.flex}>
                    <Text style={s.sessionName}>{session.name}</Text>
                    <Text style={s.sessionMeta}>
                      Week {session.week} · {new Date(session.completedAt).toLocaleDateString()}
                      {session.durationSeconds ? ` · ${Math.round(session.durationSeconds / 60)} min` : ""}
                    </Text>
                  </View>
                  <View style={s.volume}>
                    <Text style={s.volumeValue}>{session.volumeKg.toLocaleString()}</Text>
                    <Text style={s.volumeLabel}>kg</Text>
                  </View>
                </View>

                {session.entries.map((entry) => {
                  const done = entry.sets.filter((set) => set.done);
                  if (done.length === 0) return null;
                  return (
                    <View key={entry.exercise} style={s.entry}>
                      <Text style={s.entryName}>{entry.exercise}</Text>
                      <Text style={s.entrySets}>
                        {done
                          .map((set) => `${set.weightKg ?? "—"}×${set.reps ?? "—"}`)
                          .join("  ")}
                      </Text>
                    </View>
                  );
                })}
              </View>
            ))}
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}

function Card({ value, label }: { value: string; label: string }) {
  return (
    <View style={s.card}>
      <Text style={s.cardValue}>{value}</Text>
      <Text style={s.cardLabel}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: theme.bg },
  flex: { flex: 1 },
  top: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 18, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: theme.line },
  back: { color: theme.accent, fontSize: 14, fontWeight: "700", width: 52 },
  topTitle: { color: theme.ink, fontSize: 11, fontWeight: "900", letterSpacing: 1.5, textTransform: "uppercase" },
  content: { paddingHorizontal: 18, paddingTop: 16 },
  summary: { flexDirection: "row", gap: 10, marginBottom: 20 },
  card: { flex: 1, borderRadius: 16, borderWidth: 1, borderColor: theme.line, backgroundColor: theme.surface, padding: 14 },
  cardValue: { color: theme.ink, fontFamily: display, fontSize: 22 },
  cardLabel: { color: theme.muted, fontSize: 10, fontWeight: "900", letterSpacing: 1, textTransform: "uppercase", marginTop: 5 },
  session: { borderRadius: 18, borderWidth: 1, borderColor: theme.line, backgroundColor: theme.surface, padding: 15, marginBottom: 12 },
  sessionTop: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  sessionName: { color: theme.ink, fontSize: 15, fontWeight: "900" },
  sessionMeta: { color: theme.muted, fontSize: 11, marginTop: 4 },
  volume: { alignItems: "flex-end" },
  volumeValue: { color: theme.accent, fontFamily: display, fontSize: 22 },
  volumeLabel: { color: theme.muted, fontSize: 10 },
  entry: { flexDirection: "row", justifyContent: "space-between", gap: 12, paddingTop: 11, marginTop: 11, borderTopWidth: 1, borderTopColor: theme.line },
  entryName: { color: theme.ink2, fontSize: 13, flex: 1 },
  entrySets: { color: theme.ink, fontSize: 12, fontWeight: "700" },
  empty: { paddingTop: 50, alignItems: "center" },
  emptyTitle: { color: theme.ink, fontFamily: display, fontSize: 24, textTransform: "uppercase" },
  emptyBody: { color: theme.ink2, fontSize: 13, lineHeight: 20, textAlign: "center", marginTop: 10 },
});
