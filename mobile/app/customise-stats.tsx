import { Pressable, ScrollView, StyleSheet, Switch, View } from "react-native";
import { Text } from "@/components/AppText";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppState } from "@/app-state";
import { ProBadge } from "@/components/ProBadge";
import {
  FREE_HEADLINE, HEADLINE_BLURBS, HEADLINE_IDS, HEADLINE_LABELS, useHeadlinePreferences,
} from "@/headline";
import { PRO_STATS, STAT_BLURBS, STAT_LABELS, useStatPreferences } from "@/stats";
import { fonts, theme } from "@/theme";
import { ModalHeader } from "@/components/ModalHeader";
import { metricLabel, type MetricKey } from "@/metric-labels";
import { usePreferences } from "@/preferences";

/**
 * Which numbers the daily signal shows, and in what order.
 *
 * Reordering is up/down buttons rather than drag-and-drop on purpose: this is
 * a list someone touches once, and a drag handle would mean shipping a gesture
 * library and fighting the scroll view for a feature nobody uses twice.
 */
export default function CustomiseStatsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isPro } = useAppState();
  const preferences = usePreferences();
  const { order, hidden, visible, showAgeDelta, setShowAgeDelta, toggle, move, reset } = useStatPreferences();
  const { chosen, toggle: toggleHeadline } = useHeadlinePreferences();
  const shown = visible.filter((id) => isPro || !PRO_STATS.includes(id));

  return (
    <View style={s.screen}>
      <ModalHeader title="Your stats"
        left={<Pressable onPress={reset} hitSlop={10}><Text style={s.resetText}>Reset</Text></Pressable>}
      />

      <ScrollView contentContainerStyle={[s.list, { paddingBottom: insets.bottom + 40 }]}>
        <Text style={s.lede}>
          Everything switched on shows on Today, two across, in this order. {shown.length} showing,{" "}
          {order.length - shown.length} off.
        </Text>

        <Text style={s.groupTitle}>Headline</Text>
        <Text style={s.groupBlurb}>
          {isPro
            ? "The big figure at the top of Today. Pick more than one and swipe between them."
            : "Pro members choose which figure leads Today, and can swipe between several."}
        </Text>

        {HEADLINE_IDS.map((id) => {
          const on = chosen.includes(id);
          const locked = !isPro && id !== FREE_HEADLINE;
          return (
            <View key={id} style={[s.row, locked && s.rowOff]}>
              <View style={s.flex}>
                <View style={s.labelRow}>
                  <Text style={[s.label, locked && s.labelOff]}>{metricLabel(id as MetricKey, preferences.locale)}</Text>
                  {id !== FREE_HEADLINE ? <ProBadge /> : null}
                </View>
                <Text style={s.blurb}>{HEADLINE_BLURBS[id]}</Text>
              </View>

              {locked ? (
                <Pressable onPress={() => router.push("/pro" as never)} hitSlop={8} style={s.unlock}>
                  <Text style={s.unlockText}>Unlock</Text>
                </Pressable>
              ) : (
                <Switch
                  value={on}
                  onValueChange={() => toggleHeadline(id)}
                  trackColor={{ false: theme.line, true: theme.accent }}
                  thumbColor="#fff"
                  ios_backgroundColor={theme.line}
                />
              )}
            </View>
          );
        })}

        <Text style={s.groupTitle}>Metrics</Text>

        <View style={s.row}>
          <View style={s.flex}>
            <Text style={s.label}>Age comparison</Text>
            <Text style={s.blurb}>
              Show how your fitness age compares with your birthday, under the number on Today
            </Text>
          </View>
          <Switch
            value={showAgeDelta}
            onValueChange={setShowAgeDelta}
            trackColor={{ false: theme.line, true: theme.accent }}
            thumbColor="#fff"
            ios_backgroundColor={theme.line}
          />
        </View>

        {order.map((id, index) => {
          const locked = !isPro && PRO_STATS.includes(id);
          const on = !hidden.includes(id) && !locked;
          const position = shown.indexOf(id);
          return (
            <View key={id} style={[s.row, !on && s.rowOff]}>
              <View style={s.rank}>
                <Text style={[s.rankText, !on && s.rankTextOff]}>{on ? position + 1 : "—"}</Text>
              </View>

              <View style={s.flex}>
                <View style={s.labelRow}>
                  <Text style={[s.label, !on && s.labelOff]}>{metricLabel(id as MetricKey, preferences.locale)}</Text>
                  {PRO_STATS.includes(id) ? <ProBadge /> : null}
                </View>
                <Text style={s.blurb}>{STAT_BLURBS[id]}</Text>
              </View>

              <View style={s.moves}>
                <Pressable
                  accessibilityLabel={`Move ${metricLabel(id as MetricKey, preferences.locale)} up`}
                  disabled={index === 0}
                  onPress={() => move(id, -1)}
                  style={[s.move, index === 0 && s.moveOff]}
                >
                  <Text style={[s.moveText, index === 0 && s.moveTextOff]}>▲</Text>
                </Pressable>
                <Pressable
                  accessibilityLabel={`Move ${metricLabel(id as MetricKey, preferences.locale)} down`}
                  disabled={index === order.length - 1}
                  onPress={() => move(id, 1)}
                  style={[s.move, index === order.length - 1 && s.moveOff]}
                >
                  <Text style={[s.moveText, index === order.length - 1 && s.moveTextOff]}>▼</Text>
                </Pressable>
              </View>

              {locked ? (
                <Pressable onPress={() => router.push("/pro" as never)} hitSlop={8} style={s.unlock}>
                  <Text style={s.unlockText}>Unlock</Text>
                </Pressable>
              ) : (
                <Switch
                  value={on}
                  onValueChange={() => toggle(id)}
                  trackColor={{ false: theme.line, true: theme.accent }}
                  thumbColor="#fff"
                  ios_backgroundColor={theme.line}
                />
              )}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.bg },
  flex: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.line,
  },
  cancel: { color: theme.accent, fontSize: 14, fontFamily: fonts.bold, fontWeight: "700" },
  topTitle: { color: theme.ink, fontSize: 11, fontFamily: fonts.black, fontWeight: "900", letterSpacing: 1.5, textTransform: "uppercase" },
  resetText: { color: theme.ink2, fontSize: 13, fontFamily: fonts.bold, fontWeight: "700" },
  list: { paddingHorizontal: 18, paddingTop: 14 },
  lede: { color: theme.ink2, fontSize: 12, lineHeight: 18, marginBottom: 14 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    marginBottom: 10,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.line,
    backgroundColor: theme.surface,
  },
  rowOff: { opacity: 0.55 },
  groupTitle: { color: theme.accent, fontSize: 10, fontFamily: fonts.black, fontWeight: "900", letterSpacing: 1.5, textTransform: "uppercase", marginTop: 26, marginBottom: 8 },
  groupBlurb: { color: theme.muted, fontSize: 12, lineHeight: 17, marginBottom: 14 },
  labelRow: { flexDirection: "row", alignItems: "center", gap: 7 },
  unlock: { borderRadius: 12, borderWidth: 1, borderColor: theme.accent, paddingHorizontal: 11, paddingVertical: 6 },
  unlockText: { color: theme.accent, fontSize: 11, fontFamily: fonts.black, fontWeight: "900", letterSpacing: 0.5 },
  rank: { width: 26, height: 26, borderRadius: 13, backgroundColor: theme.accentSoft, alignItems: "center", justifyContent: "center" },
  rankText: { color: theme.accent, fontSize: 11, fontFamily: fonts.black, fontWeight: "900" },
  rankTextOff: { color: theme.muted },
  label: { color: theme.ink, fontSize: 14, fontFamily: fonts.black, fontWeight: "900" },
  labelOff: { color: theme.ink2 },
  blurb: { color: theme.muted, fontSize: 10, marginTop: 3 },
  moves: { gap: 4 },
  move: { width: 26, height: 22, borderRadius: 7, borderWidth: 1, borderColor: theme.lineStrong, alignItems: "center", justifyContent: "center" },
  moveOff: { borderColor: theme.line, opacity: 0.4 },
  moveText: { color: theme.ink, fontSize:10 },
  moveTextOff: { color: theme.muted },
});
