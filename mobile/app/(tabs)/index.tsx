import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { AppHeader } from "@/components/AppHeader";
import { DailySignal } from "@/components/DailySignal";
import { HealthSync } from "@/components/HealthSync";
import { Screen } from "@/components/Screen";
import { useAppState } from "@/app-state";
import { useDashboard, useMaps, useNotifications } from "@/data";
import { duration, plural, sourceName } from "@/format";
import { display, theme } from "@/theme";

/**
 * Today.
 *
 * The signal is the page now rather than a card that folds away above a feed —
 * the social product is parked, and what someone opens this app for is the
 * answer to "should I train today". Everything here is measured; nothing is
 * filler.
 */
export default function TodayScreen() {
  const router = useRouter();
  const { band, refresh } = useAppState();
  const dashboard = useDashboard();
  const notices = useNotifications();
  const maps = useMaps();

  const latest = dashboard.data?.latest;
  const lastRow = dashboard.data?.history[0];
  const active = maps.data?.active[0] ?? null;

  return (
    <Screen
      title=""
      refreshing={dashboard.refreshing}
      onRefresh={() => {
        dashboard.reload();
        maps.reload();
        notices.reload();
      }}
      header={<AppHeader unread={notices.data?.unread ?? 0} />}
    >
      {dashboard.loading && !dashboard.data ? (
        <ActivityIndicator color={theme.accent} style={{ marginTop: 40 }} />
      ) : null}

      <DailySignal data={dashboard.data} open />

      {latest ? null : (
        <View style={s.onboard}>
          <Text style={s.onboardTitle}>Nothing to score yet</Text>
          <Text style={s.onboardBody}>
            Connect Apple Health and every number above fills in from what your watch already recorded. It takes about
            a minute and nothing is typed in.
          </Text>
          <HealthSync onDone={refresh} />
        </View>
      )}

      <Pressable onPress={() => router.push("/insights" as never)} style={s.next}>
        <View style={s.flex}>
          <Text style={s.nextLabel}>Insights</Text>
          <Text style={s.nextTitle}>What your own history says, and what to do about it</Text>
        </View>
        <Text style={s.chevron}>›</Text>
      </Pressable>

      {active ? (
        <Pressable onPress={() => router.push(`/map/${active.mapId}` as never)} style={s.next}>
          <View style={s.flex}>
            <Text style={s.nextLabel}>
              {active.name} · week {active.week} of {active.weeks}
            </Text>
            <Text style={s.nextTitle}>
              {active.done} of {active.sessionsPerWeek} sessions done this week
            </Text>
          </View>
          <Text style={s.chevron}>›</Text>
        </Pressable>
      ) : (
        <Pressable onPress={() => router.push("/maps" as never)} style={s.next}>
          <View style={s.flex}>
            <Text style={s.nextLabel}>No Map running</Text>
            <Text style={s.nextTitle}>Pick a programme and the app plans your week</Text>
          </View>
          <Text style={s.chevron}>›</Text>
        </Pressable>
      )}

      {!band?.band ? (
        <Pressable onPress={() => router.push("/pair-band" as never)} style={s.next}>
          <View style={s.flex}>
            <Text style={s.nextLabel}>No V1 paired</Text>
            <Text style={s.nextTitle}>Measured beats imported. Pair a band when you have one.</Text>
          </View>
          <Text style={s.chevron}>›</Text>
        </Pressable>
      ) : null}

      {lastRow ? (
        <Text style={s.footnote}>
          Last night: {duration(lastRow.sleepMinutes)} asleep
          {lastRow.steps != null ? ` · ${lastRow.steps.toLocaleString()} steps yesterday` : ""}
        </Text>
      ) : null}

      {dashboard.data ? (
        <Text style={s.sources}>
          Built from {plural(dashboard.data.dayCount, "day")} of data
          {dashboard.data.sources.length
            ? ` · ${dashboard.data.sources.map(sourceName).join(", ")}`
            : ""}
        </Text>
      ) : null}

      {dashboard.error ? <Text style={s.error}>{dashboard.error}</Text> : null}
    </Screen>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1 },
  onboard: { borderRadius: 22, borderWidth: 1, borderColor: theme.line, backgroundColor: theme.surface, padding: 18, marginBottom: 16 },
  onboardTitle: { color: theme.ink, fontFamily: display, fontSize: 22, textTransform: "uppercase" },
  onboardBody: { color: theme.ink2, fontSize: 13, lineHeight: 20, marginTop: 8, marginBottom: 16 },
  next: {
    flexDirection: "row", alignItems: "center", gap: 12, padding: 16, marginBottom: 12,
    borderRadius: 20, borderWidth: 1, borderColor: theme.line, backgroundColor: theme.surface,
  },
  nextLabel: { color: theme.accent, fontSize: 10, fontWeight: "900", letterSpacing: 1.2, textTransform: "uppercase" },
  nextTitle: { color: theme.ink, fontSize: 14, fontWeight: "800", marginTop: 5, lineHeight: 20 },
  chevron: { color: theme.muted, fontSize: 26 },
  footnote: { color: theme.ink2, fontSize: 12, textAlign: "center", marginTop: 10 },
  sources: { color: theme.muted, fontSize: 11, textAlign: "center", marginTop: 8 },
  error: { color: theme.poor, fontSize: 12, textAlign: "center", marginTop: 12 },
});
