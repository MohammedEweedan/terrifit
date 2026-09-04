import { Pressable, StyleSheet, View } from "react-native";
import { Text } from "@/components/AppText";
import { useRouter } from "expo-router";
import { AppHeader } from "@/components/AppHeader";
import { DailySignal } from "@/components/DailySignal";
import { HealthSync } from "@/components/HealthSync";
import { Screen } from "@/components/Screen";
import { useAppState } from "@/app-state";
import { useDashboard, useMaps, useNotifications } from "@/data";
import { duration, sourceName } from "@/format";
import { fonts, display, theme } from "@/theme";
import { usePreferences } from "@/preferences";
import { screenCopy } from "@/i18n/screens";
import { TerrifitSpinner } from "@/components/TerrifitSpinner";

/**
 * Today.
 *
 * The signal is the page now rather than a card that folds away above a feed —
 * the social product is parked, and what someone opens this app for is the
 * answer to "should I train today". Everything here is measured; nothing is
 * filler.
 */
export default function TodayScreen() {
  const copy = screenCopy[usePreferences().locale];
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
      header={<AppHeader unread={notices.data?.unread ?? 0}/>}
    >
      {dashboard.loading && !dashboard.data ? (
        <TerrifitSpinner style={{ marginTop: 40 }} />
      ) : null}

      <DailySignal data={dashboard.data} open />

      {latest ? null : (
        <View style={s.onboard}>
          <Text style={s.onboardTitle}>{copy.nothingToScore}</Text>
          <Text style={s.onboardBody}>{copy.connectAppleHealth}</Text>
          <HealthSync onDone={refresh} />
        </View>
      )}

      {active ? (
        <Pressable onPress={() => router.push(`/map/${active.mapId}` as never)} style={s.next}>
          <View style={s.flex}>
            <Text style={s.nextLabel}>
              {active.name} · {copy.weekLabel} {active.week} {copy.ofLabel} {active.weeks}
            </Text>
            <Text style={s.nextTitle}>
              {active.done} {copy.ofLabel} {active.sessionsPerWeek} {copy.sessionsThisWeek}
            </Text>
          </View>
          <Text style={s.chevron}>›</Text>
        </Pressable>
      ) : (
        <Pressable onPress={() => router.push("/maps" as never)} style={s.next}>
          <View style={s.flex}>
            <Text style={s.nextLabel}>{copy.noMapRunning}</Text>
            <Text style={s.nextTitle}>{copy.pickAProgramme}</Text>
          </View>
          <Text style={s.chevron}>›</Text>
        </Pressable>
      )}

      {!band?.band ? (
        <Pressable onPress={() => router.push("/pair-band" as never)} style={s.next}>
          <View style={s.flex}>
            <Text style={s.nextLabel}>{copy.noV1Paired}</Text>
            <Text style={s.nextTitle}>{copy.measuredBeatsImported}</Text>
          </View>
          <Text style={s.chevron}>›</Text>
        </Pressable>
      ) : null}

      {lastRow ? (
        <Text style={s.footnote}>
          {copy.lastNight}: {duration(lastRow.sleepMinutes)} {copy.asleep}
          {lastRow.steps != null ? ` · ${lastRow.steps.toLocaleString()} ${copy.stepsYesterday}` : ""}
        </Text>
      ) : null}

      {dashboard.data ? (
        <Text style={s.sources}>
          {copy.builtFrom} {dashboard.data.dayCount} {copy.daysOfData}
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
  nextLabel: { color: theme.accent, fontSize: 10, fontFamily: fonts.black, fontWeight: "900", letterSpacing: 1.2, textTransform: "uppercase" },
  nextTitle: { color: theme.ink, fontSize: 14, fontFamily: fonts.black, fontWeight: "800", marginTop: 5, lineHeight: 20 },
  chevron: { color: theme.muted, fontSize: 26 },
  footnote: { color: theme.ink2, fontSize: 12, textAlign: "center", marginTop: 10 },
  sources: { color: theme.muted, fontSize: 11, textAlign: "center", marginTop: 8 },
  error: { color: theme.poor, fontSize: 12, textAlign: "center", marginTop: 12 },
});
