import { useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Text } from "@/components/AppText";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { RouteMap } from "@/components/RouteMap";
import { findActivity } from "@/activities";
import { useActivityTracker } from "@/activity-tracker";
import { formatDistance, formatDuration, formatPace, formatSpeed } from "@/health-utils/geo";
import { saveActivity } from "@/api";
import { useSession } from "@/session";
import { useAppState } from "@/app-state";
import { fonts, display, theme } from "@/theme";

/**
 * Recording one outdoor activity.
 *
 * The map is the screen, not an illustration under it: while you are moving,
 * the route drawing itself is the thing worth looking at, and the figures sit
 * on a panel over the bottom of it. Everything above that panel is map.
 *
 * The map is the platform's own — Apple's on iOS, Google's on Android —
 * because a hand-drawn polyline on a blank ground is a diagram, not a map, and
 * the whole point of the feature is seeing *where* you went.
 */
export default function ActivityScreen() {
  const { kind } = useLocalSearchParams<{ kind: string }>();
  const activity = findActivity(kind);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { token } = useSession();
  const imperial = useAppState().units === "imperial";
  const tracker = useActivityTracker();
  const [saving, setSaving] = useState(false);

  const points = tracker.track.points;
  const start = points[0];
  const latest = points[points.length - 1];

  const coordinates = useMemo(
    () => points.map((point) => ({ latitude: point.latitude, longitude: point.longitude })),
    [points],
  );

  // Follows the runner. Zoom is fixed rather than fitted to the route, because
  // a camera that pulls back every few hundred metres makes the map useless
  // for the one thing it is for: seeing the next corner.
  const camera = useMemo(
    () =>
      latest
        ? { coordinates: { latitude: latest.latitude, longitude: latest.longitude }, zoom: 16 }
        : undefined,
    [latest],
  );

  const headline =
    activity.headline === "pace"
      ? formatPace(tracker.track.currentSpeedMs, imperial)
      : formatSpeed(tracker.track.currentSpeedMs, imperial);

  const averageHeadline =
    activity.headline === "pace"
      ? formatPace(tracker.track.averageSpeedMs, imperial)
      : formatSpeed(tracker.track.averageSpeedMs, imperial);

  async function save() {
    if (!token || saving) return;
    if (tracker.track.distanceM < 10) {
      Alert.alert("Nothing to save", "This activity did not cover enough ground to record.");
      return;
    }
    setSaving(true);
    const saved = await saveActivity(token, {
      kind: activity.kind,
      distanceM: Math.round(tracker.track.distanceM),
      durationS: tracker.elapsedS,
      ascentM: Math.round(tracker.track.ascentM),
      // Rounded to about a metre of precision. Full float coordinates are a
      // needlessly exact record of where somebody lives.
      route: points.map((point) => [
        Number(point.latitude.toFixed(5)),
        Number(point.longitude.toFixed(5)),
      ]),
    }).catch(() => null);
    setSaving(false);
    if (!saved) {
      Alert.alert("Couldn't save", "Your activity is still here. Try again when you have signal.");
      return;
    }
    router.back();
  }

  return (
    <View style={s.page}>
      <View style={StyleSheet.absoluteFill}>
        <RouteMap
          camera={camera}
          route={coordinates}
          start={start ? { latitude: start.latitude, longitude: start.longitude } : null}
          colour={activity.colour}
          unavailableLabel="Maps are not available in this build. Distance, pace and duration are still recorded."
        />
      </View>

      <Pressable style={[s.close, { top: insets.top + 8 }]} onPress={() => router.back()} hitSlop={10}>
        <Text style={s.closeMark}>×</Text>
      </Pressable>

      <ScrollView
        style={[s.panel, { paddingBottom: insets.bottom }]}
        contentContainerStyle={s.panelInner}
        showsVerticalScrollIndicator={false}
      >
        <View style={s.grab} />
        <Text style={s.kind}>{activity.label.toUpperCase()}</Text>

        {activity.caveat && tracker.status === "idle" ? (
          <Text style={s.caveat}>{activity.caveat}</Text>
        ) : null}

        {tracker.status === "denied" ? (
          <Text style={s.caveat}>{tracker.message}</Text>
        ) : null}

        <View style={s.headlineRow}>
          <View style={s.flex}>
            <Text style={s.figure}>{formatDistance(tracker.track.distanceM, imperial)}</Text>
            <Text style={s.figureLabel}>Distance</Text>
          </View>
          <View style={s.flex}>
            <Text style={s.figure}>{formatDuration(tracker.elapsedS)}</Text>
            <Text style={s.figureLabel}>Moving</Text>
          </View>
        </View>

        <View style={s.statRow}>
          <Stat label={activity.headline === "pace" ? "Pace" : "Speed"} value={headline} />
          <Stat label="Average" value={averageHeadline} />
          {activity.showAscent ? <Stat label="Climb" value={`${Math.round(tracker.track.ascentM)} m`} /> : null}
        </View>

        {tracker.status === "idle" ? (
          <Pressable style={[s.action, { backgroundColor: activity.colour }]} onPress={tracker.start}>
            <Text style={s.actionText}>START</Text>
          </Pressable>
        ) : null}

        {tracker.status === "requesting" ? (
          <Text style={s.waiting}>Finding you…</Text>
        ) : null}

        {tracker.status === "recording" ? (
          <Pressable style={s.secondary} onPress={tracker.pause}>
            <Text style={s.secondaryText}>PAUSE</Text>
          </Pressable>
        ) : null}

        {tracker.status === "paused" ? (
          <View style={s.pair}>
            <Pressable style={[s.action, s.flex, { backgroundColor: activity.colour }]} onPress={tracker.resume}>
              <Text style={s.actionText}>RESUME</Text>
            </Pressable>
            <Pressable style={[s.secondary, s.flex]} onPress={tracker.finish}>
              <Text style={s.secondaryText}>FINISH</Text>
            </Pressable>
          </View>
        ) : null}

        {tracker.status === "finished" ? (
          <View style={s.pair}>
            <Pressable style={[s.action, s.flex, { backgroundColor: activity.colour }]} onPress={save} disabled={saving}>
              <Text style={s.actionText}>{saving ? "SAVING…" : "SAVE"}</Text>
            </Pressable>
            <Pressable style={[s.secondary, s.flex]} onPress={tracker.reset}>
              <Text style={s.secondaryText}>DISCARD</Text>
            </Pressable>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
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
  close: {
    position: "absolute", left: 16, zIndex: 5,
    width: 36, height: 36, borderRadius: 18,
    alignItems: "center", justifyContent: "center",
    backgroundColor: theme.bg, borderWidth: 1, borderColor: theme.line,
  },
  closeMark: { color: theme.ink, fontSize: 22, lineHeight: 26 },
  panel: {
    position: "absolute", left: 0, right: 0, bottom: 0, maxHeight: "52%",
    backgroundColor: theme.bg, borderTopLeftRadius: 20, borderTopRightRadius: 20,
    borderTopWidth: 1, borderColor: theme.line,
  },
  panelInner: { padding: 18, paddingTop: 8, gap: 14 },
  grab: { alignSelf: "center", width: 36, height: 4, borderRadius: 2, backgroundColor: theme.line, marginBottom: 6 },
  kind: {
    color: theme.ink2, fontSize: 10, fontFamily: fonts.black, fontWeight: "900", letterSpacing: 2,
  },
  caveat: { color: theme.ink2, fontSize: 12, lineHeight: 18 },
  headlineRow: { flexDirection: "row", gap: 16 },
  figure: {
    color: theme.ink, fontFamily: display, fontSize: 40, lineHeight: 46, includeFontPadding: false,
  },
  figureLabel: {
    color: theme.ink2, fontSize: 9, fontFamily: fonts.black, fontWeight: "900",
    letterSpacing: 1.4, textTransform: "uppercase", marginTop: 2,
  },
  statRow: { flexDirection: "row", gap: 10 },
  stat: {
    flex: 1, padding: 10, borderRadius: 10,
    backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.line,
  },
  statValue: { color: theme.ink, fontSize: 15, fontWeight: "600" },
  statLabel: {
    color: theme.ink2, fontSize: 8, fontFamily: fonts.black, fontWeight: "900",
    letterSpacing: 1.2, textTransform: "uppercase", marginTop: 3,
  },
  pair: { flexDirection: "row", gap: 10 },
  action: { paddingVertical: 15, borderRadius: 12, alignItems: "center" },
  actionText: {
    color: "#0b0b0c", fontSize: 12, fontFamily: fonts.black, fontWeight: "900", letterSpacing: 1.6,
  },
  secondary: {
    paddingVertical: 15, borderRadius: 12, alignItems: "center",
    borderWidth: 1, borderColor: theme.lineStrong,
  },
  secondaryText: {
    color: theme.ink, fontSize: 12, fontFamily: fonts.black, fontWeight: "900", letterSpacing: 1.6,
  },
  waiting: { color: theme.ink2, fontSize: 13, textAlign: "center", paddingVertical: 14 },
});
