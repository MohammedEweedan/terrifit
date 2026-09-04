import { useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Text } from "@/components/AppText";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import { enrollMap, leaveMap, messageCoach, type Exercise, type MapSession } from "@/api";
import { useMap } from "@/data";
import { useSession } from "@/session";
import { fonts, display, theme } from "@/theme";
import { TerrifitSpinner } from "@/components/TerrifitSpinner";
import { appScreens } from "@/i18n/app-screens";
import { usePreferences } from "@/preferences";

export default function MapDetailScreen() {
  const copy = appScreens[usePreferences().locale].maps;
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { token } = useSession();
  const result = useMap(id ?? "");
  const detail = result.data;
  const [busy, setBusy] = useState(false);

  async function start() {
    if (!token || !id || busy) return;
    setBusy(true);
    await enrollMap(token, id).catch(() => null);
    setBusy(false);
    result.reload();
  }

  async function contact() {
    if (!token || !detail?.coach?.handle) return;
    const thread = await messageCoach(token, detail.coach.handle).catch(() => null);
    if (thread) router.push(`/thread/${thread.id}` as never);
  }

  function leave() {
    if (!token || !id) return;
    Alert.alert(
      copy.leaveConfirm,
      copy.leaveBody,
      [
        { text: "Stay", style: "cancel" },
        {
          text: "Leave",
          style: "destructive",
          onPress: () => {
            void leaveMap(token, id)
              .then(() => router.replace("/maps" as never))
              .catch(() => Alert.alert(copy.couldNotLeave, copy.tryAgainMoment));
          },
        },
      ],
    );
  }

  return (
    <View style={s.page}>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 40 }} showsVerticalScrollIndicator={false}>
        {result.loading && !detail ? <TerrifitSpinner style={{ marginTop: 120 }} /> : null}

        {detail ? (
          <>
            <View style={[s.hero, { backgroundColor: detail.map.accent, paddingTop: insets.top + 62 }]}>
              <Text style={s.eyebrow}>
                {detail.map.goal} · {detail.map.level}
              </Text>
              <Text style={s.title}>{detail.map.name}</Text>
              <Text style={s.tagline}>{detail.map.tagline}</Text>
              <View style={s.heroStats}>
                <Stat value={`${detail.map.weeks}`} label="Weeks" />
                <Stat value={`${detail.map.sessionsPerWeek}×`} label={copy.perWeek} />
                <Stat value={`${detail.map.sample[0]?.minutes ?? 45}m`} label={copy.sessions} />
              </View>
            </View>

            <View style={s.content}>
              <Pressable
                onPress={detail.coach ? () => void contact() : undefined}
                style={s.coach}
                disabled={!detail.coach}
              >
                <View style={s.coachAvatar}>
                  <Text style={s.coachInitial}>{detail.map.coach.name[0]}</Text>
                </View>
                <View style={s.flex}>
                  <Text style={s.coachName}>{detail.map.coach.name}</Text>
                  <Text style={s.coachCredential}>{detail.map.coach.credential}</Text>
                </View>
                {detail.coach ? (
                  <View style={s.messageButton}>
                    <Text style={s.messageText}>Message</Text>
                  </View>
                ) : null}
              </Pressable>

              <Text style={s.coachBio}>{detail.map.coach.bio}</Text>

              <Text style={s.summary}>{detail.map.summary}</Text>

              <Text style={s.section}>{copy.howItIsBuilt}</Text>
              {detail.map.blocks.map((block) => (
                <View key={block.key} style={s.block}>
                  <View style={s.blockWeeks}>
                    <Text style={s.blockWeeksText}>
                      {block.weeks[0]}–{block.weeks[1]}
                    </Text>
                  </View>
                  <View style={s.flex}>
                    <Text style={s.blockLabel}>{block.label}</Text>
                    <Text style={s.blockIntent}>{block.intent}</Text>
                  </View>
                </View>
              ))}

              {detail.enrollment ? (
                <View style={s.progress}>
                  <View style={s.flex}>
                    <Text style={s.progressLabel}>
                      Week {detail.enrollment.week}
                      {detail.enrollment.blockLabel ? ` · ${detail.enrollment.blockLabel}` : ""}
                    </Text>
                    <Text style={s.progressNote}>{copy.sessionsDoneThisWeek}</Text>
                  </View>
                  <Text style={s.progressValue}>
                    {detail.enrollment.done}/{detail.map.sessionsPerWeek}
                  </Text>
                </View>
              ) : null}

              <Text style={s.section}>{copy.thisWeek}</Text>
              {detail.map.sample.map((session) => (
                <SessionCard
                  key={session.id}
                  session={session}
                  enrolled={Boolean(detail.enrollment)}
                  onStart={() => router.push(`/session/${detail.map.id}/${session.id}` as never)}
                  onExercise={(exercise) =>
                    router.push({
                      pathname: "/exercise/[name]",
                      params: { name: exercise.name, payload: JSON.stringify(exercise) },
                    } as never)
                  }
                />
              ))}

              <Text style={s.section}>{copy.equipment}</Text>
              <View style={s.equipment}>
                {detail.map.equipment.map((item) => (
                  <Text key={item} style={s.equipmentItem}>
                    {item}
                  </Text>
                ))}
              </View>

              {detail.enrollment ? (
                // There was no way off a Map once started — only to start
                // another over it, which left both running.
                <Pressable onPress={leave} style={s.leave}>
                  <Text style={s.leaveText}>{copy.leaveThisMap}</Text>
                </Pressable>
              ) : (
                <Pressable onPress={() => void start()} disabled={busy} style={[s.primary, busy && s.dim]}>
                  <Text style={s.primaryText}>{busy ? copy.starting : copy.startThisMap}</Text>
                </Pressable>
              )}
            </View>
          </>
        ) : null}
      </ScrollView>

      <View pointerEvents="box-none" style={[s.topBar, { paddingTop: insets.top + 6 }]}>
        <Pressable onPress={() => router.back()} style={s.circle} accessibilityLabel="Back">
          <Text style={s.circleText}>‹</Text>
        </Pressable>
        <Pressable
          onPress={() => router.push(`/map/${id}/history` as never)}
          style={s.circle}
          accessibilityLabel={copy.yourHistoryOnThisMap}
        >
          <Svg width={19} height={19} viewBox="0 0 24 24">
            <Path
              d="M12 7v5l3.5 2M12 3a9 9 0 1 0 9 9"
              stroke="#fff"
              strokeWidth={1.9}
              fill="none"
              strokeLinecap="round"
            />
            <Path d="M3 5v4h4" stroke="#fff" strokeWidth={1.9} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        </Pressable>
      </View>
    </View>
  );
}

/** One session, with every movement tappable for the coaching behind it. */
function SessionCard({
  session,
  enrolled,
  onStart,
  onExercise,
}: {
  session: MapSession;
  enrolled: boolean;
  onStart: () => void;
  onExercise: (exercise: Exercise) => void;
}) {
  const copy = appScreens[usePreferences().locale].maps;
  return (
    <View style={s.session}>
      <View style={s.sessionTop}>
        <View style={s.flex}>
          <Text style={s.sessionName}>{session.name}</Text>
          <Text style={s.sessionMeta}>
            {session.minutes} min · strain {session.strain} · {session.focus}
          </Text>
        </View>
        <Text style={s.day}>DAY {session.day}</Text>
      </View>

      {session.exercises.map((exercise) => (
        <Pressable key={exercise.name} onPress={() => onExercise(exercise)} style={s.exercise}>
          <View style={s.flex}>
            <Text style={s.exerciseName}>{exercise.name}</Text>
            {exercise.targets?.length ? (
              <Text style={s.exerciseTargets}>{exercise.targets.join(" · ")}</Text>
            ) : null}
          </View>
          <Text style={s.scheme}>{exercise.scheme}</Text>
          <Text style={s.exerciseChevron}>›</Text>
        </Pressable>
      ))}

      {enrolled ? (
        <Pressable onPress={onStart} style={s.start}>
          <Text style={s.startText}>{copy.startSession}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View style={s.stat}>
      <Text style={s.statValue}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: theme.bg },
  flex: { flex: 1 },
  topBar: { position: "absolute", top: 0, left: 0, right: 0, flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 16 },
  circle: { width: 42, height: 42, borderRadius: 21, backgroundColor: "rgba(8,9,10,0.5)", borderWidth: 1, borderColor: "rgba(255,255,255,0.22)", alignItems: "center", justifyContent: "center" },
  circleText: { color: "#fff", fontSize: 22, fontFamily: fonts.black, fontWeight: "900", lineHeight: 24, marginTop: -2 },
  hero: { paddingHorizontal: 20, paddingBottom: 26 },
  eyebrow: { color: "rgba(0,0,0,0.62)", fontSize: 10, fontFamily: fonts.black, fontWeight: "900", letterSpacing: 1.6, textTransform: "uppercase" },
  title: { color: "#fff", fontFamily: display, fontSize: 40, textTransform: "uppercase", marginTop: 8 },
  tagline: { color: "rgba(255,255,255,0.86)", fontSize: 15, marginTop: 6 },
  heroStats: { flexDirection: "row", marginTop: 22 },
  stat: { flex: 1 },
  statValue: { color: "#fff", fontFamily: display, fontSize: 26 },
  statLabel: { color: "rgba(255,255,255,0.72)", fontSize: 10, fontFamily: fonts.black, fontWeight: "900", letterSpacing: 1.2, textTransform: "uppercase", marginTop: 3 },
  content: { paddingHorizontal: 20, paddingTop: 22 },
  coach: { flexDirection: "row", alignItems: "center", gap: 13, padding: 14, borderRadius: 18, borderWidth: 1, borderColor: theme.lineStrong, backgroundColor: theme.surface },
  coachAvatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: theme.accentSoft, alignItems: "center", justifyContent: "center" },
  coachInitial: { color: theme.accent, fontFamily: display, fontSize: 20 },
  coachName: { color: theme.ink, fontSize: 15, fontFamily: fonts.black, fontWeight: "900" },
  coachCredential: { color: theme.muted, fontSize: 11, lineHeight: 15, marginTop: 3 },
  messageButton: { borderRadius: 999, borderWidth: 1, borderColor: theme.accent, paddingHorizontal: 14, paddingVertical: 8 },
  messageText: { color: theme.accent, fontSize: 10, fontFamily: fonts.black, fontWeight: "900", letterSpacing: 0.8, textTransform: "uppercase" },
  coachBio: { color: theme.ink2, fontSize: 13, lineHeight: 20, marginTop: 14 },
  summary: { color: theme.ink2, fontSize: 14, lineHeight: 22, marginTop: 18 },
  section: { color: theme.accent, fontSize: 10, fontFamily: fonts.black, fontWeight: "900", letterSpacing: 1.5, textTransform: "uppercase", marginTop: 30, marginBottom: 14 },
  block: { flexDirection: "row", gap: 13, alignItems: "center", paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: theme.line },
  blockWeeks: { minWidth: 52, height: 30, borderRadius: 8, borderWidth: 1, borderColor: theme.lineStrong, alignItems: "center", justifyContent: "center", paddingHorizontal: 8 },
  blockWeeksText: { color: theme.ink2, fontSize: 11, fontFamily: fonts.black, fontWeight: "900" },
  blockLabel: { color: theme.ink, fontSize: 14, fontFamily: fonts.black, fontWeight: "900" },
  blockIntent: { color: theme.muted, fontSize: 11, lineHeight: 16, marginTop: 3 },
  progress: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 22, padding: 16, borderRadius: 18, borderWidth: 1, borderColor: theme.accent, backgroundColor: theme.accentSoft },
  progressLabel: { color: theme.accent, fontSize: 13, fontFamily: fonts.black, fontWeight: "900" },
  progressNote: { color: theme.ink2, fontSize: 11, marginTop: 3 },
  progressValue: { color: theme.ink, fontFamily: display, fontSize: 26 },
  session: { borderRadius: 20, borderWidth: 1, borderColor: theme.line, backgroundColor: theme.surface, padding: 16, marginBottom: 12 },
  sessionTop: { flexDirection: "row", alignItems: "flex-start", gap: 10, marginBottom: 12 },
  sessionName: { color: theme.ink, fontSize: 17, fontFamily: fonts.black, fontWeight: "900" },
  sessionMeta: { color: theme.muted, fontSize: 11, marginTop: 4 },
  day: { color: theme.accent, fontSize: 10, fontFamily: fonts.black, fontWeight: "900", letterSpacing: 1 },
  exercise: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 11, borderTopWidth: 1, borderTopColor: theme.line },
  exerciseName: { color: theme.ink, fontSize: 14, fontFamily: fonts.bold, fontWeight: "700" },
  exerciseTargets: { color: theme.muted, fontSize: 10, marginTop: 3 },
  scheme: { color: theme.ink2, fontSize: 12, fontFamily: fonts.black, fontWeight: "800" },
  exerciseChevron: { color: theme.muted, fontSize: 20 },
  start: { height: 46, borderRadius: 23, backgroundColor: theme.accent, alignItems: "center", justifyContent: "center", marginTop: 14 },
  startText: { color: "#fff", fontSize: 11, fontFamily: fonts.black, fontWeight: "900", letterSpacing: 1, textTransform: "uppercase" },
  equipment: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  equipmentItem: { color: theme.ink2, fontSize: 12, fontFamily: fonts.bold, fontWeight: "700", borderWidth: 1, borderColor: theme.line, borderRadius: 999, paddingHorizontal: 13, paddingVertical: 8, overflow: "hidden" },
  leave: { alignItems: "center", paddingVertical: 16, marginTop: 8 },
  leaveText: { color: theme.poor, fontSize: 11, fontFamily: fonts.black, fontWeight: "900", letterSpacing: 1, textTransform: "uppercase" },
  primary: { height: 54, borderRadius: 27, backgroundColor: theme.accent, alignItems: "center", justifyContent: "center", marginTop: 28 },
  dim: { opacity: 0.5 },
  primaryText: { color: "#fff", fontSize: 12, fontFamily: fonts.black, fontWeight: "900", letterSpacing: 1, textTransform: "uppercase" },
});
