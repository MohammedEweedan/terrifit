import { useEffect, useRef } from "react";
import { ActivityIndicator, Animated, Easing, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle, Defs, RadialGradient, Stop } from "react-native-svg";
import { useDashboard } from "@/data";
import { display, theme } from "@/theme";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

/**
 * Fitness age, given the room it deserves.
 *
 * The number is the page — set on a lit dial that fills from your years to
 * your estimate, so the distance between the two is something you see rather
 * than something you calculate. Everything under it exists to make the claim
 * checkable: the inputs, the method, and what the method cannot do.
 */
export default function FitnessAgeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const dashboard = useDashboard();
  const result = dashboard.data?.advanced.fitnessAge ?? null;

  const younger = (result?.delta ?? 0) < 0;
  const tone = result?.delta == null || result.delta === 0 ? theme.ink2 : younger ? theme.good : theme.fair;

  const size = 260;
  const radius = (size - 18) / 2;
  const circumference = 2 * Math.PI * radius;

  const sweep = useRef(new Animated.Value(0)).current;
  const rise = useRef(new Animated.Value(0)).current;
  const glow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (result?.years == null) return;
    Animated.parallel([
      Animated.timing(sweep, { toValue: 1, duration: 1300, easing: Easing.out(Easing.cubic), useNativeDriver: false }),
      Animated.timing(rise, { toValue: 1, duration: 700, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.loop(
        Animated.sequence([
          Animated.timing(glow, { toValue: 1, duration: 2400, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
          Animated.timing(glow, { toValue: 0, duration: 2400, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        ]),
      ),
    ]).start();
  }, [sweep, rise, glow, result?.years]);

  // How far round the dial the gap between your age and your estimate reaches.
  const fraction =
    result?.delta == null ? 0 : Math.min(1, Math.abs(result.delta) / 12) * 0.75;

  return (
    <View style={s.page}>
      <View style={[s.top, { paddingTop: insets.top + 10 }]}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Text style={s.close}>Done</Text>
        </Pressable>
        <Text style={s.topTitle}>Fitness age</Text>
        <View style={{ width: 46 }} />
      </View>

      <ScrollView contentContainerStyle={[s.content, { paddingBottom: insets.bottom + 44 }]} showsVerticalScrollIndicator={false}>
        {dashboard.loading && !dashboard.data ? (
          <ActivityIndicator color={theme.accent} style={{ marginTop: 60 }} />
        ) : null}

        {result?.years != null ? (
          <>
            <View style={s.stage}>
              <Animated.View
                style={[
                  s.bloom,
                  {
                    opacity: glow.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.7] }),
                    transform: [{ scale: glow.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1.06] }) }],
                  },
                ]}
              >
                <Svg width={320} height={320}>
                  <Defs>
                    <RadialGradient id="ageBloom" cx="50%" cy="50%" r="50%">
                      <Stop offset="0%" stopColor={tone} stopOpacity={0.34} />
                      <Stop offset="60%" stopColor={tone} stopOpacity={0.08} />
                      <Stop offset="100%" stopColor={tone} stopOpacity={0} />
                    </RadialGradient>
                  </Defs>
                  <Circle cx={160} cy={160} r={160} fill="url(#ageBloom)" />
                </Svg>
              </Animated.View>

              <Svg width={size} height={size}>
                <Circle cx={size / 2} cy={size / 2} r={radius} stroke={theme.line} strokeWidth={7} fill="none" />
                <AnimatedCircle
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  stroke={tone}
                  strokeWidth={7}
                  strokeLinecap="round"
                  fill="none"
                  strokeDasharray={`${circumference} ${circumference}`}
                  strokeDashoffset={sweep.interpolate({
                    inputRange: [0, 1],
                    outputRange: [circumference, circumference * (1 - fraction)],
                  })}
                  rotation={-90}
                  origin={`${size / 2}, ${size / 2}`}
                />
              </Svg>

              <Animated.View
                style={[
                  s.centre,
                  {
                    opacity: rise,
                    transform: [{ translateY: rise.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }],
                  },
                ]}
              >
                <Text style={s.years}>{result.years}</Text>
                <Text style={s.yearsLabel}>Fitness age</Text>
              </Animated.View>
            </View>

            <Animated.View style={{ opacity: rise, alignItems: "center" }}>
              <Text style={[s.verdict, { color: tone }]}>
                {result.delta === 0
                  ? "Right on your years"
                  : `${result.capped ? "At least " : ""}${Math.abs(result.delta ?? 0)} years ${younger ? "younger" : "older"}`}
              </Text>
              <Text style={s.against}>Your birthday says {result.chronological}</Text>
            </Animated.View>

            <View style={s.figures}>
              <Figure value={result.vo2max == null ? "—" : String(result.vo2max)} unit="ml/kg/min" label="VO₂max" />
              <Figure value={String(result.chronological ?? "—")} unit="years" label="Actual age" />
              <Figure
                value={result.delta == null ? "—" : `${result.delta > 0 ? "+" : ""}${result.delta}`}
                unit="years"
                label="Difference"
              />
            </View>

            <Text style={s.section}>Why this number</Text>
            {result.basis.map((line) => (
              <View key={line} style={s.basisRow}>
                <View style={s.basisDot} />
                <Text style={s.basisText}>{line}</Text>
              </View>
            ))}

            <Text style={s.section}>The method</Text>
            <View style={s.methodCard}>
              <Method
                step="1"
                text={`Your maximum heart rate is estimated from your age — Tanaka et al. (2001), which beats the folk 220 − age.`}
              />
              <Method
                step="2"
                text="Maximum over resting gives a VO₂max — Uth, Sørensen, Overgaard and Pedersen (2004), the only estimate needing nothing but two heart rates."
              />
              <Method
                step="3"
                text="That is compared against a median person of your sex run through the same equation. Feed in the population median and the answer is your real age."
              />
            </View>

            {result.capped ? (
              <View style={s.cappedBox}>
                <Text style={s.cappedTitle}>This is a bound, not a reading</Text>
                <Text style={s.cappedBody}>
                  Your resting heart rate is beyond what this method can resolve, so the answer is pinned to its
                  limit of twelve years. Read it as &ldquo;at least this much&rdquo;.
                </Text>
              </View>
            ) : null}

            <Text style={s.caveat}>{result.caveat}</Text>
          </>
        ) : dashboard.data ? (
          <View style={s.empty}>
            <Text style={s.emptyTitle}>Not enough to say yet</Text>
            <Text style={s.emptyBody}>
              This needs your date of birth and about a week of resting heart rate. Add your details and connect Apple
              Health, and it appears on its own.
            </Text>
            <Pressable onPress={() => router.push("/edit-profile" as never)} style={s.primary}>
              <Text style={s.primaryText}>Add your details</Text>
            </Pressable>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

function Figure({ value, unit, label }: { value: string; unit: string; label: string }) {
  return (
    <View style={s.figure}>
      <View style={s.figureRow}>
        <Text style={s.figureValue}>{value}</Text>
        <Text style={s.figureUnit}>{unit}</Text>
      </View>
      <Text style={s.figureLabel}>{label}</Text>
    </View>
  );
}

function Method({ step, text }: { step: string; text: string }) {
  return (
    <View style={s.method}>
      <View style={s.methodStep}>
        <Text style={s.methodStepText}>{step}</Text>
      </View>
      <Text style={s.methodText}>{text}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: theme.bg },
  top: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 18, paddingBottom: 12 },
  close: { color: theme.accent, fontSize: 14, fontWeight: "700", width: 46 },
  topTitle: { color: theme.ink, fontSize: 11, fontWeight: "900", letterSpacing: 1.5, textTransform: "uppercase" },
  content: { paddingHorizontal: 20 },
  stage: { height: 320, alignItems: "center", justifyContent: "center", marginTop: 6 },
  bloom: { position: "absolute" },
  centre: { position: "absolute", alignItems: "center" },
  years: { color: theme.ink, fontFamily: display, fontSize: 96, lineHeight: 118, paddingTop: 14, includeFontPadding: false },
  yearsLabel: { color: theme.muted, fontSize: 10, fontWeight: "900", letterSpacing: 2, textTransform: "uppercase", marginTop: -4 },
  verdict: { fontSize: 19, fontWeight: "900", letterSpacing: -0.2, marginTop: 6 },
  against: { color: theme.muted, fontSize: 13, marginTop: 7 },
  figures: { flexDirection: "row", marginTop: 30, borderTopWidth: 1, borderBottomWidth: 1, borderColor: theme.line, paddingVertical: 18 },
  figure: { flex: 1, alignItems: "center" },
  figureRow: { flexDirection: "row", alignItems: "baseline", gap: 4 },
  figureValue: { color: theme.ink, fontFamily: display, fontSize: 26 },
  figureUnit: { color: theme.muted, fontSize: 10 },
  figureLabel: { color: theme.muted, fontSize: 10, fontWeight: "900", letterSpacing: 1.1, textTransform: "uppercase", marginTop: 7 },
  section: { color: theme.accent, fontSize: 10, fontWeight: "900", letterSpacing: 1.6, textTransform: "uppercase", marginTop: 34, marginBottom: 14 },
  basisRow: { flexDirection: "row", gap: 12, alignItems: "flex-start", marginBottom: 12 },
  basisDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: theme.accent, marginTop: 8 },
  basisText: { color: theme.ink, fontSize: 14, lineHeight: 21, flex: 1 },
  methodCard: { borderRadius: 20, borderWidth: 1, borderColor: theme.line, backgroundColor: theme.surface, padding: 18 },
  method: { flexDirection: "row", gap: 13, marginBottom: 16 },
  methodStep: { width: 24, height: 24, borderRadius: 12, borderWidth: 1, borderColor: theme.lineStrong, alignItems: "center", justifyContent: "center" },
  methodStepText: { color: theme.ink2, fontSize: 11, fontWeight: "900" },
  methodText: { color: theme.ink2, fontSize: 13, lineHeight: 20, flex: 1 },
  cappedBox: { marginTop: 20, padding: 16, borderRadius: 18, borderWidth: 1, borderColor: theme.fair, backgroundColor: "rgba(232,178,60,0.08)" },
  cappedTitle: { color: theme.fair, fontSize: 13, fontWeight: "900" },
  cappedBody: { color: theme.ink2, fontSize: 13, lineHeight: 19, marginTop: 7 },
  caveat: { color: theme.muted, fontSize: 12, lineHeight: 18, marginTop: 20 },
  empty: { paddingTop: 60, alignItems: "center" },
  emptyTitle: { color: theme.ink, fontFamily: display, fontSize: 26, textTransform: "uppercase" },
  emptyBody: { color: theme.ink2, fontSize: 13, lineHeight: 20, textAlign: "center", marginTop: 10 },
  primary: { height: 52, borderRadius: 26, backgroundColor: theme.accent, paddingHorizontal: 30, alignItems: "center", justifyContent: "center", marginTop: 22 },
  primaryText: { color: "#fff", fontSize: 11, fontWeight: "900", letterSpacing: 1, textTransform: "uppercase" },
});
