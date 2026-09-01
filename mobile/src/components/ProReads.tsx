import { useEffect, useRef } from "react";
import { Animated, Easing, Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { theme } from "@/theme";
import type { Insight, SleepQuality, StressReading } from "@/api";

/**
 * The three Pro reads, under the gauges.
 *
 * These were computed on the server and returned in every payload but never
 * rendered, which meant the one thing a member was paying for was invisible on
 * the screen they open twenty times a day. Stress and sleep quality sit side by
 * side because they are the two halves of the same night; the insight sits
 * under them because it is the part that tells you what to do.
 */
export function ProReads({
  stress,
  sleep,
  insight,
}: {
  stress: StressReading | null;
  sleep: SleepQuality | null;
  insight: Insight | null;
}) {
  const router = useRouter();
  if (!stress && !sleep && !insight) return null;

  return (
    <View style={s.wrap}>
      <View style={s.pair}>
        {stress ? (
          <Read
            label="Load"
            value={stress.value}
            suffix=""
            // High load is the bad end, so the ramp runs the other way.
            tone={
              stress.value == null ? theme.muted
                : stress.value >= 70 ? theme.poor
                  : stress.value >= 45 ? theme.fair
                    : theme.good
            }
            caption={stress.band === "unknown" ? "Not enough signal" : capitalise(stress.band)}
            detail={stress.drivers[0] ?? stress.caveat}
            index={0}
          />
        ) : null}

        {sleep ? (
          <Read
            label="Sleep quality"
            value={sleep.value}
            suffix=""
            tone={
              sleep.value == null ? theme.muted
                : sleep.value >= 75 ? theme.sleep
                  : sleep.value >= 55 ? theme.fair
                    : theme.poor
            }
            caption={sleep.value == null ? "No reading" : band(sleep.value)}
            detail={sleep.parts[0]?.detail ?? sleep.missing.map((item) => `No ${item.toLowerCase()}`).join(" · ")}
            index={1}
          />
        ) : null}
      </View>

      {insight ? (
        <Pressable onPress={() => router.push("/insights" as never)} style={s.insight}>
          <View style={s.insightHead}>
            <Text style={s.insightEyebrow}>Today's read</Text>
            <Text style={s.confidence}>{insight.confidence} confidence</Text>
          </View>
          <Text style={s.insightTitle}>{insight.title}</Text>
          <Text style={s.insightBody} numberOfLines={3}>
            {insight.action}
          </Text>
          <Text style={s.insightMore}>All insights ›</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function Read({
  label, value, suffix, tone, caption, detail, index,
}: {
  label: string;
  value: number | null;
  suffix: string;
  tone: string;
  caption: string;
  detail: string;
  index: number;
}) {
  const enter = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(enter, {
      toValue: 1,
      duration: 420,
      delay: 90 + index * 90,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [enter, index]);

  return (
    <Animated.View
      style={[
        s.read,
        {
          opacity: enter,
          transform: [{ translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }],
        },
      ]}
    >
      <Text style={s.readLabel}>{label}</Text>
      <View style={s.readValueRow}>
        <Text style={[s.readValue, { color: tone }]}>{value == null ? "—" : Math.round(value)}{suffix}</Text>
        <Text style={[s.readCaption, { color: tone }]}>{caption}</Text>
      </View>
      <Text style={s.readDetail} numberOfLines={3}>{detail}</Text>
    </Animated.View>
  );
}

const capitalise = (word: string) => word.charAt(0).toUpperCase() + word.slice(1);

function band(value: number): string {
  if (value >= 85) return "Excellent";
  if (value >= 75) return "Good";
  if (value >= 55) return "Fair";
  return "Poor";
}

const s = StyleSheet.create({
  wrap: { marginBottom: 20 },
  pair: { flexDirection: "row", gap: 10 },
  read: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.line,
    backgroundColor: theme.surface,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  readLabel: { color: theme.muted, fontSize: 10, fontWeight: "900", letterSpacing: 1.2, textTransform: "uppercase" },
  readValueRow: { flexDirection: "row", alignItems: "baseline", gap: 8, marginTop: 7 },
  readValue: { fontSize: 26, fontWeight: "900", letterSpacing: -0.8 },
  readCaption: { fontSize: 10, fontWeight: "900", letterSpacing: 0.8, textTransform: "uppercase" },
  readDetail: { color: theme.muted, fontSize: 11, lineHeight: 16, marginTop: 8 },

  insight: {
    marginTop: 10,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.accent,
    backgroundColor: theme.accentSoft,
    paddingHorizontal: 16,
    paddingVertical: 15,
  },
  insightHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  insightEyebrow: { color: theme.accent, fontSize: 10, fontWeight: "900", letterSpacing: 1.4, textTransform: "uppercase" },
  confidence: { color: theme.muted, fontSize: 10, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.8 },
  insightTitle: { color: theme.ink, fontSize: 16, fontWeight: "900", marginTop: 9, lineHeight: 22 },
  insightBody: { color: theme.ink2, fontSize: 13, lineHeight: 19, marginTop: 7 },
  insightMore: { color: theme.accent, fontSize: 11, fontWeight: "900", letterSpacing: 0.6, marginTop: 11 },
});
