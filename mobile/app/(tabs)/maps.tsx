import { useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Text } from "@/components/AppText";
import { useRouter } from "expo-router";
import { AppHeader } from "@/components/AppHeader";
import { Screen } from "@/components/Screen";
import { useMaps, useNotifications } from "@/data";
import { usePreferences } from "@/preferences";
import { mapsCopy } from "@/i18n/maps";
import { display, theme } from "@/theme";

export default function MapsScreen() {
  const router = useRouter();
  const maps = useMaps();
  const notices = useNotifications();
  const preferences = usePreferences();
  const copy = mapsCopy[preferences.locale];

  const [goal, setGoal] = useState<string | null>(null);

  const list = maps.data?.maps ?? [];
  const active = maps.data?.active ?? [];

  // Built from the library rather than hard-coded, so a Map added on the server
  // is filterable the day it appears. The old list was a fixed five labels that
  // did not match the goals the API actually returns, and none of them filtered
  // anything — they were plain Views.
  const goals = useMemo(() => {
    const seen: string[] = [];
    for (const item of list) if (!seen.includes(item.goal)) seen.push(item.goal);
    return seen;
  }, [list]);

  const shown = goal ? list.filter((item) => item.goal === goal) : list;

  return (
    <Screen
      eyebrow={copy.eyebrow}
      title={copy.title}
      refreshing={maps.refreshing}
      onRefresh={maps.reload}
      header={<AppHeader unread={notices.data?.unread ?? 0} />}
    >
      <Text style={s.lede}>{copy.lede}</Text>

      {active.length ? (
        <View style={s.activeWrap}>
          <Text style={s.kicker}>{copy.inProgress}</Text>
          {active.map((item) => (
            <Pressable
              key={item.mapId}
              onPress={() => router.push(`/map/${item.mapId}` as never)}
              style={[s.activeCard, { borderColor: item.accent }]}
            >
              <View style={[s.activeRail, { backgroundColor: item.accent }]} />
              <View style={s.activeTop}>
                <View style={{ flex: 1, paddingRight: 12 }}>
                  <Text style={s.activeName}>{item.name}</Text>
                  <Text style={s.meta}>
                    {copy.weekOf(item.week, item.weeks)} · {item.blockLabel}
                  </Text>
                </View>
                <Text style={[s.percent, { color: item.accent }]}>{item.percent}%</Text>
              </View>
              <View style={s.track}>
                <View style={[s.fill, { width: `${item.percent}%`, backgroundColor: item.accent }]} />
              </View>
              <Text style={s.meta}>{copy.sessionsThisWeek(item.done, item.sessionsPerWeek)}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      <View style={s.head}>
        <Text style={s.kicker}>{copy.library}</Text>
        <Text style={s.count}>{copy.mapCount(shown.length)}</Text>
      </View>

      {maps.loading && !maps.data ? <ActivityIndicator color={theme.accent} style={{ marginVertical: 30 }} /> : null}
      {maps.error ? <Text style={s.offline}>{copy.offline}</Text> : null}

      {goals.length > 1 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.filters}
          style={s.filterScroll}
        >
          <Filter label={copy.all} on={goal === null} onPress={() => setGoal(null)} />
          {goals.map((key) => (
            <Filter
              key={key}
              label={copy.goals[key] ?? key}
              on={goal === key}
              onPress={() => setGoal(goal === key ? null : key)}
            />
          ))}
        </ScrollView>
      ) : null}

      {shown.length === 0 && !maps.loading ? (
        <View style={s.empty}>
          <Text style={s.emptyTitle}>{copy.emptyTitle}</Text>
          <Text style={s.emptyBody}>{copy.emptyBody}</Text>
          <Pressable onPress={() => setGoal(null)} style={s.emptyAction}>
            <Text style={s.emptyActionText}>{copy.all}</Text>
          </Pressable>
        </View>
      ) : null}

      <View style={s.list}>
        {shown.map((item) => (
          <Pressable
            key={item.id}
            onPress={() => router.push(`/map/${item.id}` as never)}
            style={s.card}
          >
            <View style={[s.rail, { backgroundColor: item.accent }]} />

            <View style={s.cardTop}>
              <Text style={[s.goal, { color: item.accent }]}>{copy.goals[item.goal] ?? item.goal}</Text>
              <Text style={s.level}>{copy.levels[item.level] ?? item.level}</Text>
            </View>

            <Text style={s.name}>{item.name}</Text>
            <Text style={s.tagline}>{item.tagline}</Text>

            <View style={s.stats}>
              <Stat value={String(item.weeks)} label={copy.weeksLabel} />
              <View style={s.divider} />
              <Stat value={`${item.sessionsPerWeek}×`} label={copy.perWeekLabel} />
              <View style={s.divider} />
              <Stat value={item.coach.name} label={copy.coachLabel} wide />
            </View>
          </Pressable>
        ))}
      </View>
    </Screen>
  );
}

function Filter({ label, on, onPress }: { label: string; on: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: on }}
      style={[s.filter, on && s.filterOn]}
    >
      <Text style={[s.filterText, on && s.filterTextOn]}>{label}</Text>
    </Pressable>
  );
}

function Stat({ value, label, wide }: { value: string; label: string; wide?: boolean }) {
  return (
    <View style={[s.stat, wide && s.statWide]}>
      <Text style={s.statValue} numberOfLines={1}>
        {value}
      </Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  lede: { color: theme.ink2, fontSize: 14, lineHeight: 21, marginTop: -10, marginBottom: 26 },
  kicker: {
    color: theme.accent, fontSize: 10, fontWeight: "900",
    letterSpacing: 1.6, textTransform: "uppercase",
  },

  activeWrap: { marginBottom: 30 },
  activeCard: {
    marginTop: 12, padding: 18, paddingLeft: 21, borderRadius: 22,
    borderWidth: 1, backgroundColor: theme.surface, overflow: "hidden",
  },
  activeRail: { position: "absolute", left: 0, top: 0, bottom: 0, width: 4 },
  activeTop: { flexDirection: "row", alignItems: "flex-start" },
  activeName: { color: theme.ink, fontSize: 18, fontWeight: "800" },
  percent: { fontFamily: display, fontSize: 30, lineHeight: 36 },
  meta: { color: theme.muted, fontSize: 11, marginTop: 5 },
  track: { height: 5, borderRadius: 3, backgroundColor: theme.line, overflow: "hidden", marginTop: 16 },
  fill: { height: 5, borderRadius: 3 },

  head: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  count: { color: theme.muted, fontSize: 11 },

  // Negative margins let the row bleed to the screen edge while its first and
  // last chips still line up with everything else on the page.
  filterScroll: { marginHorizontal: -20 },
  filters: { gap: 8, paddingVertical: 15, paddingHorizontal: 20 },
  filter: {
    paddingHorizontal: 15, height: 36, borderRadius: 18, borderWidth: 1,
    borderColor: theme.line, justifyContent: "center", backgroundColor: theme.surface,
  },
  filterOn: { backgroundColor: theme.ink, borderColor: theme.ink },
  filterText: { color: theme.ink2, fontSize: 11, fontWeight: "800" },
  filterTextOn: { color: theme.bg },

  offline: { color: theme.fair, fontSize: 11, marginTop: 10 },

  empty: {
    marginTop: 10, padding: 24, borderRadius: 22, borderWidth: 1,
    borderColor: theme.line, backgroundColor: theme.surface, alignItems: "center",
  },
  emptyTitle: { color: theme.ink, fontSize: 15, fontWeight: "800" },
  emptyBody: { color: theme.muted, fontSize: 12, lineHeight: 18, marginTop: 6, textAlign: "center" },
  emptyAction: {
    marginTop: 16, height: 40, paddingHorizontal: 22, borderRadius: 20,
    borderWidth: 1, borderColor: theme.accent, alignItems: "center", justifyContent: "center",
  },
  emptyActionText: {
    color: theme.accent, fontSize: 10, fontWeight: "900",
    letterSpacing: 1, textTransform: "uppercase",
  },

  list: { gap: 13 },
  // One column, full width. The old layout put a 42pt number in a 112pt gutter
  // beside the name, which left the name about nine characters of room.
  card: {
    borderRadius: 22, borderWidth: 1, borderColor: theme.line,
    backgroundColor: theme.surface, overflow: "hidden", padding: 18, paddingLeft: 21,
  },
  rail: { position: "absolute", left: 0, top: 0, bottom: 0, width: 4 },
  cardTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  goal: { fontSize: 10, fontWeight: "900", letterSpacing: 1.3, textTransform: "uppercase" },
  level: {
    color: theme.ink2, fontSize: 10, fontWeight: "800", textTransform: "uppercase",
    letterSpacing: 0.8, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 9,
    backgroundColor: theme.bg, overflow: "hidden",
  },
  name: { color: theme.ink, fontFamily: display, fontSize: 30, lineHeight: 36, textTransform: "uppercase", marginTop: 12 },
  tagline: { color: theme.ink2, fontSize: 13, lineHeight: 19, marginTop: 5 },

  stats: {
    flexDirection: "row", alignItems: "center", marginTop: 18, paddingTop: 15,
    borderTopWidth: 1, borderTopColor: theme.line,
  },
  stat: { minWidth: 58 },
  statWide: { flex: 1, minWidth: 0, paddingLeft: 2 },
  statValue: { color: theme.ink, fontSize: 15, fontWeight: "800" },
  statLabel: {
    color: theme.muted, fontSize: 9, fontWeight: "900",
    letterSpacing: 1, textTransform: "uppercase", marginTop: 4,
  },
  divider: { width: 1, height: 26, backgroundColor: theme.line, marginHorizontal: 15 },
});
