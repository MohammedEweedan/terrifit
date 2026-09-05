import { useEffect, useRef, useMemo } from "react";
import { Animated, Easing, Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from "react-native";
import { Text } from "@/components/AppText";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDashboard } from "@/data";
import { fonts, display, theme } from "@/theme";
import { MetricChart } from "@/components/MetricChart";
import { AgeDial } from "@/components/AgeDial";
import { AuroraLine } from "@/components/AuroraLine";
import { FactorBars } from "@/components/FactorBars";
import { TerrifitMark } from "@/components/TerrifitMark";
import { SwipeReveal } from "@/components/SwipeReveal";
import { ModalHeader } from "@/components/ModalHeader";
import { TerrifitSpinner } from "@/components/TerrifitSpinner";
import { useStatPreferences } from "@/stats";
import { appScreens } from "@/i18n/app-screens";
import { usePreferences } from "@/preferences";


/**
 * Fitness age, given the room it deserves.
 *
 * The number is the page — set on a lit dial that fills from your years to
 * your estimate, so the distance between the two is something you see rather
 * than something you calculate. Everything under it exists to make the claim
 * checkable: the inputs, the method, and what the method cannot do.
 */
export default function FitnessAgeScreen() {
  const copy = appScreens[usePreferences().locale].fitnessAge;
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const dashboard = useDashboard();
  const { showAgeDelta, setShowAgeDelta } = useStatPreferences();

  // Oldest first: a chart reads left to right through time.
  const trend = useMemo(
    () =>
      [...(dashboard.data?.history ?? [])]
        .reverse()
        .map((row) => ({ date: row.date, value: row.fitnessAge })),
    [dashboard.data],
  );

  const result = dashboard.data?.advanced.fitnessAge;
  const younger = (result?.delta ?? 0) < 0;
  const tone = result?.delta == null || result.delta === 0 ? theme.ink2 : younger ? theme.good : theme.fair;

  const rise = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (result?.years == null) return;
    Animated.parallel([
      Animated.timing(rise, { toValue: 1, duration: 700, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, [rise, result?.years]);

  return (
    <View style={s.page}>
      <ModalHeader
        title={
          <View style={s.lockup}>
            <TerrifitMark size={16} />
            <Text style={s.lockupWord}>TERRIFIT</Text>
            <Text style={s.lockupAge}>AGE</Text>
          </View>
        }
      />

      <ScrollView contentContainerStyle={[s.content, { paddingBottom: insets.bottom + 44 }]} showsVerticalScrollIndicator={false}>
        {dashboard.loading && !dashboard.data ? (
          <TerrifitSpinner style={{ marginTop: 60 }} />
        ) : null}

        {result?.years != null ? (
          <>
            <View style={s.stage}>
              <AgeDial
                value={String(result.years)}
                label={copy.fitnessAge}
                pill={result.vo2max != null ? `VO₂MAX ${result.vo2max}` : undefined}
                // The ring takes the accent the member picked, not the
                // verdict colour: it is their app. Good or fair is carried by
                // the verdict line underneath instead.
                tone={theme.accent}
              />
            </View>

            <Animated.View style={{ opacity: rise, alignItems: "center" }}>
              <SwipeReveal
                revealed={showAgeDelta}
                onChange={setShowAgeDelta}
                hidden={<AuroraLine width={width - 40} height={44} />}
              >
                <Text style={[s.verdict, { color: tone }]}>
                  {result.delta === 0
                    ? copy.rightOnYourYears
                    : `${result.capped ? copy.atLeast : ""}${Math.abs(result.delta ?? 0)} years ${younger ? "younger" : "older"}`}
                </Text>
              </SwipeReveal>
            </Animated.View>

            {/* Hiding the comparison has to hide the figures that give it
                away too — a struck-out verdict above "32 years · actual age"
                would be a curtain with a hole in it. VO₂max stays: it is a
                measure of you, not a count of your birthdays. */}
            {/* Only the comparison lives here now. The estimate and the VO₂max
                are both inside the corona already, and printing them twice made
                the screen look like it was padding. With the comparison hidden
                there is nothing left to say, so the row goes entirely rather
                than standing empty. */}
            {showAgeDelta ? (
              <View style={s.figures}>
                <Figure value={String(result.chronological ?? "—")} unit="years" label={copy.actualAge} />
                <Figure
                  value={result.delta == null ? "—" : `${result.delta > 0 ? "+" : ""}${result.delta}`}
                  unit="years"
                  label={copy.difference}
                />
              </View>
            ) : null}

            {trend.length >= 4 ? (
              <>
                <Text style={s.section}>{copy.howItMoved}</Text>
                <MetricChart
                  points={trend}
                  colour={theme.accent}
                  format={(value) => `${Math.round(value)}`}
                  height={190}
                  viewWidth={width - 40}
                />
                <Text style={s.trendNote}>
                  Estimated for each day from the days before it, so the line is what you would have been told at
                  the time rather than today&apos;s answer painted backwards.
                </Text>
              </>
            ) : null}

            <Text style={s.section}>{copy.whatWentIntoIt}</Text>
            <FactorBars factors={result.factors} />

            <Text style={s.section}>In full</Text>
            {result.basis.map((line) => (
              <View key={line} style={s.basisRow}>
                <View style={s.basisDot} />
                <Text style={s.basisText}>{line}</Text>
              </View>
            ))}

            <Text style={s.section}>{copy.theMethod}</Text>
            <View style={s.methodCard}>
              <Method
                step="1"
                text={`Your maximum heart rate is estimated from your age — Tanaka et al. (2001), which beats the folk 220 − age.`}
              />
              <Method
                step="2"
                text={copy.methodVo2}
              />
              <Method
                step="3"
                text={copy.methodMedian}
              />
            </View>

            {result.capped ? (
              <View style={s.cappedBox}>
                <Text style={s.cappedTitle}>{copy.boundNotReading}</Text>
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
            <Text style={s.emptyTitle}>{copy.notEnoughYet}</Text>
            <Text style={s.emptyBody}>
              This needs your date of birth and about a week of resting heart rate. Add your details and connect Apple
              Health, and it appears on its own.
            </Text>
            <Pressable onPress={() => router.push("/edit-profile" as never)} style={s.primary}>
              <Text style={s.primaryText}>{copy.addYourDetails}</Text>
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
  close: { color: theme.accent, fontSize: 14, fontFamily: fonts.bold, fontWeight: "700", width: 46 },
  topTitle: { color: theme.ink, fontSize: 11, fontFamily: fonts.black, fontWeight: "900", letterSpacing: 1.5, textTransform: "uppercase" },
  content: { paddingHorizontal: 20 },
  trendNote: { color: theme.muted, fontSize: 11, lineHeight: 16, marginTop: 10 },
  insight: {
    borderRadius: 16, borderWidth: 1, borderColor: theme.line,
    backgroundColor: theme.surface, padding: 15, marginBottom: 10,
  },
  lockup: { flexDirection: "row", alignItems: "center", gap: 7 },
  lockupWord: { color: theme.ink, fontSize: 12, fontFamily: fonts.black, fontWeight: "900", letterSpacing: 2.6 },
  lockupAge: { color: theme.accent, fontSize: 12, fontFamily: fonts.black, fontWeight: "900", letterSpacing: 2.6 },
  stage: { alignItems: "center", justifyContent: "center", paddingTop: 34, paddingBottom: 0 },
  attribution: {
    color: theme.accent, fontSize: 11, fontFamily: fonts.black, fontWeight: "900", letterSpacing: 2.2,
    textTransform: "uppercase", marginBottom: 4,
  },
  centre: { alignItems: "center" },
  years: { color: theme.ink, fontFamily: display, fontSize: 96, lineHeight: 120, marginTop: -10, marginBottom: -26, includeFontPadding: false },
  verdict: { fontSize: 19, fontFamily: fonts.black, fontWeight: "900", letterSpacing: -0.2 },
  against: { color: theme.muted, fontSize: 13, marginTop: 7 },
  figures: { flexDirection: "row", marginTop: 30, borderTopWidth: 1, borderBottomWidth: 1, borderColor: theme.line, paddingVertical: 18 },
  figure: { flex: 1, alignItems: "center" },
  figureRow: { flexDirection: "row", alignItems: "baseline", gap: 4 },
  figureValue: { color: theme.ink, fontFamily: display, fontSize: 26 },
  figureUnit: { color: theme.muted, fontSize: 10 },
  figureLabel: { color: theme.muted, fontSize: 10, fontFamily: fonts.black, fontWeight: "900", letterSpacing: 1.1, textTransform: "uppercase", marginTop: 7 },
  section: { color: theme.accent, fontSize: 10, fontFamily: fonts.black, fontWeight: "900", letterSpacing: 1.6, textTransform: "uppercase", marginTop: 34, marginBottom: 14 },
  basisRow: { flexDirection: "row", gap: 12, alignItems: "flex-start", marginBottom: 12 },
  basisDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: theme.accent, marginTop: 8 },
  basisText: { color: theme.ink, fontSize: 14, lineHeight: 21, flex: 1 },
  methodCard: { borderRadius: 20, borderWidth: 1, borderColor: theme.line, backgroundColor: theme.surface, padding: 18 },
  method: { flexDirection: "row", gap: 13, marginBottom: 16 },
  methodStep: { width: 24, height: 24, borderRadius: 12, borderWidth: 1, borderColor: theme.lineStrong, alignItems: "center", justifyContent: "center" },
  methodStepText: { color: theme.ink2, fontSize: 11, fontFamily: fonts.black, fontWeight: "900" },
  methodText: { color: theme.ink2, fontSize: 13, lineHeight: 20, flex: 1 },
  cappedBox: { marginTop: 20, padding: 16, borderRadius: 18, borderWidth: 1, borderColor: theme.fair, backgroundColor: "rgba(232,178,60,0.08)" },
  cappedTitle: { color: theme.fair, fontSize: 13, fontFamily: fonts.black, fontWeight: "900" },
  cappedBody: { color: theme.ink2, fontSize: 13, lineHeight: 19, marginTop: 7 },
  caveat: { color: theme.muted, fontSize: 12, lineHeight: 18, marginTop: 20 },
  empty: { paddingTop: 60, alignItems: "center" },
  emptyTitle: { color: theme.ink, fontFamily: display, fontSize: 26, textTransform: "uppercase" },
  emptyBody: { color: theme.ink2, fontSize: 13, lineHeight: 20, textAlign: "center", marginTop: 10 },
  primary: { height: 52, borderRadius: 26, backgroundColor: theme.accent, paddingHorizontal: 30, alignItems: "center", justifyContent: "center", marginTop: 22 },
  primaryText: { color: "#fff", fontSize: 11, fontFamily: fonts.black, fontWeight: "900", letterSpacing: 1, textTransform: "uppercase" },
});
