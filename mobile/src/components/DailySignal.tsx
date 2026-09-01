import { useEffect, useMemo, useRef } from "react";
import { Animated, Easing, Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { Defs, Ellipse, RadialGradient, Stop } from "react-native-svg";
import { useRouter } from "expo-router";
import { BodyBatteryBar } from "./BodyBatteryBar";
import { PerformanceGauge } from "./PerformanceGauge";
import { ProReads } from "./ProReads";
import { StatRail } from "./StatRail";
import { useAppState } from "@/app-state";
import { display, theme } from "@/theme";
import { buildStats, PRO_STATS, useStatPreferences } from "@/stats";
import type { Dashboard } from "@/api";

/** How long the signal stays open before folding itself away. */
export const SIGNAL_LINGER_MS = 10_000;

/**
 * The morning read on your body.
 *
 * It opens with you, holds for ten seconds and then folds into the brand mark
 * in the header — the numbers matter most in the first few seconds of opening
 * the app, and after that the feed is what you came for. Tapping the mark
 * brings it back.
 */
export function DailySignal({ data, open }: { data: Dashboard | null; open: boolean }) {
  const latest = data?.latest;
  const recovery = latest?.recovery.value ?? null;
  const strain = latest?.strain.value ?? null;
  const sleep = latest?.sleep.value ?? null;
  const hasData = recovery != null;

  const router = useRouter();
  const fitness = data?.advanced.fitnessAge ?? null;
  const { isPro } = useAppState();
  const { visible } = useStatPreferences();
  const tiles = useMemo(() => buildStats(data), [data]);

  // Pro metrics never reach a free grid, so nothing is dangled behind a lock.
  const shown = useMemo(
    () => visible.filter((id) => isPro || !PRO_STATS.includes(id)),
    [visible, isPro],
  );

  const battery = data?.advanced.bodyBattery ?? null;
  const stress = data?.advanced.stress ?? null;
  const quality = data?.advanced.sleepQuality ?? null;
  const topInsight = data?.advanced.insights?.[0] ?? null;

  const state = readiness(recovery);

  const reveal = useRef(new Animated.Value(open ? 1 : 0)).current;
  const bloom = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(bloom, { toValue: 1, duration: 2400, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(bloom, { toValue: 0, duration: 2400, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [bloom]);

  useEffect(() => {
    Animated.timing(reveal, {
      toValue: open ? 1 : 0,
      duration: open ? 460 : 320,
      easing: open ? Easing.out(Easing.cubic) : Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [open, reveal]);

  if (!open) return null;

  return (
    <Animated.View
      style={[
        s.card,
        {
          opacity: reveal,
          transform: [
            { translateY: reveal.interpolate({ inputRange: [0, 1], outputRange: [-14, 0] }) },
            { scale: reveal.interpolate({ inputRange: [0, 1], outputRange: [0.97, 1] }) },
          ],
        },
      ]}
    >
      {isPro && battery && battery.current != null ? <BodyBatteryBar battery={battery} /> : null}

      {fitness?.years != null ? (
        <Pressable onPress={() => router.push("/fitness-age" as never)} style={s.fitness}>
          <View style={s.fitnessStage}>
            <Animated.View
              style={[
                s.fitnessGlow,
                {
                  opacity: bloom.interpolate({ inputRange: [0, 1], outputRange: [0.4, 0.85] }),
                  transform: [{ scale: bloom.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1.08] }) }],
                },
              ]}
            >
              <Svg width={210} height={190}>
                <Defs>
                  <RadialGradient id="ageGlow" cx="50%" cy="50%" r="50%">
                    <Stop offset="0%" stopColor={theme.accent} stopOpacity={0.42} />
                    <Stop offset="55%" stopColor={theme.accent} stopOpacity={0.14} />
                    <Stop offset="100%" stopColor={theme.accent} stopOpacity={0} />
                  </RadialGradient>
                </Defs>
                <Ellipse cx={105} cy={95} rx={105} ry={95} fill="url(#ageGlow)" />
              </Svg>
            </Animated.View>
            <View style={s.fitnessCentre}>
              <Text style={s.fitnessValue}>{fitness.years}</Text>
              <Text style={s.fitnessLabel}>Fitness age</Text>
            </View>
          </View>
          <Text style={s.fitnessDelta}>
            {fitness.delta === 0
              ? "Right on your years"
              : `${fitness.capped ? "At least " : ""}${Math.abs(fitness.delta ?? 0)} years ${(fitness.delta ?? 0) < 0 ? "younger" : "older"}`}
          </Text>
          <Text style={s.fitnessAgainst}>Your birthday says {fitness.chronological}</Text>
        </Pressable>
      ) : null}

      <View style={s.gauges}>
        <PerformanceGauge
          label="Recovery"
          value={recovery}
          colour={theme.good}
          suffix="%"
          status={recovery == null ? "No data" : recovery >= 67 ? "Primed" : recovery >= 34 ? "Steady" : "Recover"}
        />
        <PerformanceGauge
          label="Strain"
          value={strain}
          max={21}
          precision={1}
          colour={theme.accent}
          status={strain == null ? "No data" : strain >= 14 ? "High" : strain >= 8 ? "Optimal" : "Building"}
        />
        <PerformanceGauge
          label="Sleep"
          value={sleep}
          colour={theme.sleep}
          suffix="%"
          status={sleep == null ? "No data" : sleep >= 85 ? "Restored" : sleep >= 70 ? "Good" : "Short"}
        />
      </View>

      {isPro ? <ProReads stress={stress} sleep={quality} insight={topInsight} /> : null}

      <StatRail stats={shown.map((id) => tiles[id])} pro={isPro} />

    </Animated.View>
  );
}

/**
 * The pill reports how recovered you are, not whether we have data.
 * A green "Ready" beside a 19% recovery score is worse than no badge at all.
 */
function readiness(recovery: number | null): { label: string; tone: string } {
  if (recovery == null) return { label: "Connect", tone: theme.accent };
  if (recovery >= 67) return { label: "Ready", tone: theme.good };
  if (recovery >= 34) return { label: "Steady", tone: theme.fair };
  return { label: "Recover", tone: theme.poor };
}

function verdict(recovery: number | null): string {
  if (recovery == null) return "Waiting on your body.";
  if (recovery >= 75) return "Strong enough to build.";
  if (recovery >= 50) return "Enough in the tank.";
  if (recovery >= 30) return "Running a small debt.";
  return "Today is a rest day.";
}

const s = StyleSheet.create({
  flex: { flex: 1 },
  card: { marginTop: 4, marginBottom: 18 },
  fitness: { alignItems: "center", paddingTop: 0, paddingBottom: 10 },
  fitnessStage: { width: 210, height: 140, alignItems: "center", justifyContent: "center" },
  fitnessGlow: { position: "absolute" },
  fitnessCentre: { alignItems: "center" },
  fitnessValue: {
    color: theme.ink,
    fontFamily: display,
    fontSize: 88,
    lineHeight: 96,
    paddingTop: 10,
    includeFontPadding: false,
  },
  fitnessLabel: {
    color: theme.accent,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 2,
    textTransform: "uppercase",
    marginTop: -6,
  },
  fitnessDelta: { color: theme.ink, fontSize: 17, fontWeight: "900", marginTop: 2 },
  fitnessAgainst: { color: theme.muted, fontSize: 12, marginTop: 4 },
  chevron: { color: theme.accent, fontSize: 24 },
  gauges: { flexDirection: "row", justifyContent: "space-between", paddingBottom: 18 },
});
