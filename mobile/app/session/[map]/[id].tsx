import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable,
  ScrollView, StyleSheet, Text, TextInput, View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { finishSession, type LoggedEntry, type LoggedSet } from "@/api";
import { useSessionRuntime } from "@/data";
import { useSession } from "@/session";
import { display, theme } from "@/theme";

/** "5×3" and "3×10 each side" both mean three or five sets. */
function setCount(scheme: string): number {
  const match = /^(\d+)\s*[×x]/.exec(scheme.trim());
  return match ? Math.min(12, Math.max(1, Number(match[1]))) : 3;
}

/** "5×3" → 3 reps a set. Anything time-based has no rep target. */
function repTarget(scheme: string): number | null {
  const match = /[×x]\s*(\d+)/.exec(scheme);
  return match ? Number(match[1]) : null;
}

/**
 * Running a session.
 *
 * The Map tells you what to do; this records what you actually did, which is
 * the half that makes next week's prescription mean anything. Weights carry
 * forward from the last time you did this session, so the common case is
 * tapping a tick rather than typing.
 */
export default function SessionScreen() {
  const { map: mapId, id: sessionId } = useLocalSearchParams<{ map: string; id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { token } = useSession();
  const runtime = useSessionRuntime(mapId ?? "", sessionId ?? "");
  const data = runtime.data;

  const [entries, setEntries] = useState<LoggedEntry[]>([]);
  const [saving, setSaving] = useState(false);
  const [rest, setRest] = useState<number | null>(null);
  const startedAt = useRef(Date.now());

  // The sheet is built once the prescription arrives, pre-filled with whatever
  // was lifted last time.
  useEffect(() => {
    if (!data || entries.length > 0) return;
    setEntries(
      data.session.exercises.map((exercise) => {
        const previous = data.lastTime?.entries.find((item) => item.exercise === exercise.name);
        const count = setCount(exercise.scheme);
        return {
          exercise: exercise.name,
          sets: Array.from({ length: count }, (_, index): LoggedSet => ({
            reps: previous?.sets[index]?.reps ?? repTarget(exercise.scheme),
            weightKg: previous?.sets[index]?.weightKg ?? null,
            done: false,
          })),
        };
      }),
    );
  }, [data, entries.length]);

  // Rest countdown between sets.
  useEffect(() => {
    if (rest == null || rest <= 0) return;
    const timer = setTimeout(() => setRest((value) => (value == null ? null : value - 1)), 1000);
    return () => clearTimeout(timer);
  }, [rest]);

  const totalSets = entries.reduce((sum, entry) => sum + entry.sets.length, 0);
  const doneSets = entries.reduce((sum, entry) => sum + entry.sets.filter((set) => set.done).length, 0);
  const progress = totalSets === 0 ? 0 : doneSets / totalSets;

  const volume = useMemo(
    () =>
      entries.reduce(
        (sum, entry) =>
          sum +
          entry.sets.reduce(
            (inner, set) => inner + (set.done && set.reps && set.weightKg ? set.reps * set.weightKg : 0),
            0,
          ),
        0,
      ),
    [entries],
  );

  function patchSet(exercise: string, index: number, patch: Partial<LoggedSet>) {
    setEntries((current) =>
      current.map((entry) =>
        entry.exercise === exercise
          ? { ...entry, sets: entry.sets.map((set, i) => (i === index ? { ...set, ...patch } : set)) }
          : entry,
      ),
    );
  }

  function toggle(exercise: string, index: number, restSeconds: number) {
    const entry = entries.find((item) => item.exercise === exercise);
    const next = !entry?.sets[index]?.done;
    patchSet(exercise, index, { done: next });
    setRest(next ? restSeconds : null);
  }

  async function finish() {
    if (!token || !mapId || !sessionId || saving) return;
    if (doneSets === 0) {
      Alert.alert("Nothing logged", "Tick at least one set before finishing.");
      return;
    }
    setSaving(true);
    const result = await finishSession(token, mapId, sessionId, {
      entries,
      durationSeconds: Math.round((Date.now() - startedAt.current) / 1000),
    }).catch(() => null);
    setSaving(false);
    if (!result) {
      Alert.alert("Couldn't save", "We kept your sets. Try again when you have signal.");
      return;
    }
    router.replace(`/map/${mapId}` as never);
  }

  return (
    <KeyboardAvoidingView style={s.page} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={[s.top, { paddingTop: insets.top + 10 }]}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Text style={s.cancel}>Close</Text>
        </Pressable>
        <Text style={s.topTitle} numberOfLines={1}>
          {data?.session.name ?? "Session"}
        </Text>
        <Text style={s.counter}>
          {doneSets}/{totalSets}
        </Text>
      </View>

      <View style={s.track}>
        <View style={[s.fill, { width: `${Math.round(progress * 100)}%` }]} />
      </View>

      {rest != null && rest > 0 ? (
        <Pressable onPress={() => setRest(null)} style={s.rest}>
          <Text style={s.restLabel}>Rest</Text>
          <Text style={s.restValue}>
            {Math.floor(rest / 60)}:{String(rest % 60).padStart(2, "0")}
          </Text>
          <Text style={s.restSkip}>Skip</Text>
        </Pressable>
      ) : null}

      <ScrollView contentContainerStyle={[s.content, { paddingBottom: insets.bottom + 120 }]} keyboardShouldPersistTaps="handled">
        {runtime.loading && !data ? <ActivityIndicator color={theme.accent} style={{ marginTop: 50 }} /> : null}

        {data ? (
          <>
            <Text style={s.meta}>
              Week {data.week}
              {data.blockLabel ? ` · ${data.blockLabel}` : ""} · {data.session.focus}
            </Text>
            {data.lastTime ? (
              <Text style={s.last}>
                Last done {new Date(data.lastTime.completedAt).toLocaleDateString()} — weights carried forward.
              </Text>
            ) : (
              <Text style={s.last}>First time through this one. Log what you lift and it comes back next week.</Text>
            )}

            {data.session.exercises.map((exercise) => {
              const entry = entries.find((item) => item.exercise === exercise.name);
              return (
                <View key={exercise.name} style={s.exercise}>
                  <View style={s.exerciseTop}>
                    <View style={s.flex}>
                      <Text style={s.exerciseName}>{exercise.name}</Text>
                      <Text style={s.scheme}>
                        {exercise.scheme}
                        {exercise.intensity ? ` · ${exercise.intensity}` : ""}
                      </Text>
                    </View>
                    <Text style={s.restHint}>{exercise.restSeconds}s</Text>
                  </View>

                  <Text style={s.cue}>{exercise.cue}</Text>

                  {entry?.sets.map((set, index) => (
                    <View key={index} style={s.setRow}>
                      <Text style={s.setIndex}>{index + 1}</Text>
                      <TextInput
                        style={s.input}
                        value={set.weightKg == null ? "" : String(set.weightKg)}
                        onChangeText={(text) =>
                          patchSet(exercise.name, index, { weightKg: text ? Number(text) || 0 : null })
                        }
                        keyboardType="decimal-pad"
                        placeholder="kg"
                        placeholderTextColor={theme.muted}
                      />
                      <Text style={s.times}>×</Text>
                      <TextInput
                        style={s.input}
                        value={set.reps == null ? "" : String(set.reps)}
                        onChangeText={(text) =>
                          patchSet(exercise.name, index, { reps: text ? Number(text) || 0 : null })
                        }
                        keyboardType="number-pad"
                        placeholder="reps"
                        placeholderTextColor={theme.muted}
                      />
                      <Pressable
                        onPress={() => toggle(exercise.name, index, exercise.restSeconds)}
                        style={[s.tick, set.done && s.tickOn]}
                        accessibilityLabel={`Set ${index + 1} ${set.done ? "done" : "not done"}`}
                      >
                        <Text style={[s.tickText, set.done && s.tickTextOn]}>✓</Text>
                      </Pressable>
                    </View>
                  ))}
                </View>
              );
            })}

            {volume > 0 ? <Text style={s.volume}>Volume so far · {Math.round(volume).toLocaleString()} kg</Text> : null}
          </>
        ) : null}
      </ScrollView>

      <View style={[s.footer, { paddingBottom: Math.max(insets.bottom, 14) }]}>
        <Pressable onPress={() => void finish()} disabled={saving} style={[s.finish, saving && s.finishBusy]}>
          <Text style={s.finishText}>{saving ? "Saving…" : "Finish session"}</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: theme.bg },
  flex: { flex: 1 },
  top: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 18, paddingBottom: 12 },
  cancel: { color: theme.accent, fontSize: 14, fontWeight: "700", width: 54 },
  topTitle: { color: theme.ink, fontSize: 13, fontWeight: "900", flex: 1, textAlign: "center" },
  counter: { color: theme.ink2, fontSize: 13, fontWeight: "800", width: 54, textAlign: "right" },
  track: { height: 3, backgroundColor: theme.line },
  fill: { height: 3, backgroundColor: theme.accent },
  rest: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: theme.accentSoft, paddingHorizontal: 18, paddingVertical: 12 },
  restLabel: { color: theme.accent, fontSize: 10, fontWeight: "900", letterSpacing: 1.2, textTransform: "uppercase" },
  restValue: { color: theme.ink, fontFamily: display, fontSize: 24, flex: 1 },
  restSkip: { color: theme.accent, fontSize: 12, fontWeight: "800" },
  content: { paddingHorizontal: 18, paddingTop: 16 },
  meta: { color: theme.accent, fontSize: 10, fontWeight: "900", letterSpacing: 1.2, textTransform: "uppercase" },
  last: { color: theme.muted, fontSize: 12, lineHeight: 18, marginTop: 8, marginBottom: 18 },
  exercise: { borderRadius: 20, borderWidth: 1, borderColor: theme.line, backgroundColor: theme.surface, padding: 15, marginBottom: 12 },
  exerciseTop: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  exerciseName: { color: theme.ink, fontSize: 16, fontWeight: "900" },
  scheme: { color: theme.accent, fontSize: 12, fontWeight: "800", marginTop: 4 },
  restHint: { color: theme.muted, fontSize: 11, fontWeight: "700" },
  cue: { color: theme.ink2, fontSize: 12, lineHeight: 18, marginTop: 10, marginBottom: 12 },
  setRow: { flexDirection: "row", alignItems: "center", gap: 9, marginTop: 8 },
  setIndex: { color: theme.muted, fontSize: 12, fontWeight: "900", width: 16 },
  input: {
    flex: 1, height: 44, borderRadius: 12, borderWidth: 1, borderColor: theme.lineStrong,
    color: theme.ink, fontSize: 15, fontWeight: "700", textAlign: "center", backgroundColor: theme.bg,
  },
  times: { color: theme.muted, fontSize: 13 },
  tick: { width: 44, height: 44, borderRadius: 12, borderWidth: 1, borderColor: theme.lineStrong, alignItems: "center", justifyContent: "center" },
  tickOn: { backgroundColor: theme.good, borderColor: theme.good },
  tickText: { color: theme.muted, fontSize: 17, fontWeight: "900" },
  tickTextOn: { color: "#07100c" },
  volume: { color: theme.ink2, fontSize: 12, fontWeight: "700", textAlign: "center", marginTop: 6 },
  footer: { paddingHorizontal: 18, paddingTop: 12, borderTopWidth: 1, borderTopColor: theme.line, backgroundColor: theme.surface },
  finish: { height: 52, borderRadius: 26, backgroundColor: theme.accent, alignItems: "center", justifyContent: "center" },
  finishBusy: { opacity: 0.6 },
  finishText: { color: "#fff", fontSize: 11, fontWeight: "900", letterSpacing: 1, textTransform: "uppercase" },
});
