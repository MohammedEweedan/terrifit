import { useEffect, useMemo, useRef } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { BodyBatteryBar } from "./BodyBatteryBar";
import { PerformanceGauge } from "./PerformanceGauge";
import { ProReads } from "./ProReads";
import { StatRail } from "./StatRail";
import { useAppState } from "@/app-state";
import { theme } from "@/theme";
import { HeadlineMetric } from "./HeadlineMetric";
import { buildHeadlines, FREE_HEADLINE, useHeadlinePreferences } from "@/headline";
import { buildStats, PRO_STATS, useStatPreferences } from "@/stats";
import type { Dashboard } from "@/api";
import { metricLabel } from "@/metric-labels";
import { usePreferences } from "@/preferences";

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

  const router = useRouter();
  const { isPro, units } = useAppState();
  const { locale, t } = usePreferences();
  const { visible } = useStatPreferences();
  const { chosen } = useHeadlinePreferences();

  // Free accounts get the fitness age and nothing else — the paid tier is the
  // choice, not the number.
  const built = useMemo(() => buildHeadlines(data, locale), [data, locale]);
  const headlines = useMemo(() => {
    const ids = isPro && chosen.length > 0 ? chosen : [FREE_HEADLINE];
    return ids.map((id) => built[id]).filter(Boolean);
  }, [built, chosen, isPro]);
  const tiles = useMemo(() => buildStats(data, units, locale), [data, units, locale]);

  // Pro metrics never reach a free grid, so nothing is dangled behind a lock.
  const shown = useMemo(
    () => visible.filter((id) => isPro || !PRO_STATS.includes(id)),
    [visible, isPro],
  );

  const battery = data?.advanced.bodyBattery ?? null;
  const stress = data?.advanced.stress ?? null;
  const quality = data?.advanced.sleepQuality ?? null;
  const topInsight = data?.advanced.insights?.[0] ?? null;

  const reveal = useRef(new Animated.Value(open ? 1 : 0)).current;


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
      <HeadlineMetric
        headlines={headlines}
        onPress={(headline) => {
          if (headline.id === "fitnessAge") router.push("/fitness-age" as never);
        }}
      />

      <View style={s.gauges}>
        <PerformanceGauge
          label={metricLabel("recovery", locale)}
          value={recovery}
          colour={theme.good}
          suffix="%"
          status={recovery == null ? t("noData") : recovery >= 67 ? t("primed") : recovery >= 34 ? t("steady") : t("recover")}
        />
        <PerformanceGauge
          label={metricLabel("strain", locale)}
          value={strain}
          max={21}
          precision={1}
          colour={theme.accent}
          status={strain == null ? t("noData") : strain >= 14 ? t("high") : strain >= 8 ? t("optimal") : t("building")}
        />
        <PerformanceGauge
          label={metricLabel("sleep", locale)}
          value={sleep}
          colour={theme.sleep}
          suffix="%"
          status={sleep == null ? t("noData") : sleep >= 85 ? t("restored") : sleep >= 70 ? t("good") : t("short")}
        />
      </View>

      {isPro && battery && battery.current != null ? <BodyBatteryBar battery={battery} /> : null}

      {isPro ? <ProReads stress={stress} sleep={quality} insight={topInsight} /> : null}

      <StatRail stats={shown.map((id) => tiles[id])} />

    </Animated.View>
  );
}

/**
 * The pill reports how recovered you are, not whether we have data.
 * A green "Ready" beside a 19% recovery score is worse than no badge at all.
 */
const s = StyleSheet.create({
  flex: { flex: 1 },
  card: { marginTop: 4, marginBottom: 18 },
  gauges: { flexDirection: "row", justifyContent: "space-between", paddingBottom: 18 },
});
