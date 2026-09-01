import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppState } from "@/app-state";
import { ProBadge } from "@/components/ProBadge";
import { PRO_STATS, STAT_BLURBS, STAT_LABELS, useStatPreferences } from "@/stats";
import { theme } from "@/theme";

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
  const { order, hidden, visible, toggle, move, reset } = useStatPreferences();
  const shown = visible.filter((id) => isPro || !PRO_STATS.includes(id));

  return (
    <View style={s.screen}>
      <View style={[s.header, { paddingTop: insets.top + 10 }]}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Text style={s.cancel}>Done</Text>
        </Pressable>
        <Text style={s.topTitle}>Your stats</Text>
        <Pressable onPress={reset} hitSlop={10}>
          <Text style={s.resetText}>Reset</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={[s.list, { paddingBottom: insets.bottom + 40 }]}>
        <Text style={s.lede}>
          Everything switched on shows on Today, two across, in this order. {shown.length} showing,{" "}
          {order.length - shown.length} off.
        </Text>

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
                  <Text style={[s.label, !on && s.labelOff]}>{STAT_LABELS[id]}</Text>
                  {PRO_STATS.includes(id) ? <ProBadge /> : null}
                </View>
                <Text style={s.blurb}>{STAT_BLURBS[id]}</Text>
              </View>

              <View style={s.moves}>
                <Pressable
                  accessibilityLabel={`Move ${STAT_LABELS[id]} up`}
                  disabled={index === 0}
                  onPress={() => move(id, -1)}
                  style={[s.move, index === 0 && s.moveOff]}
                >
                  <Text style={[s.moveText, index === 0 && s.moveTextOff]}>▲</Text>
                </Pressable>
                <Pressable
                  accessibilityLabel={`Move ${STAT_LABELS[id]} down`}
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
  cancel: { color: theme.accent, fontSize: 14, fontWeight: "700" },
  topTitle: { color: theme.ink, fontSize: 11, fontWeight: "900", letterSpacing: 1.5, textTransform: "uppercase" },
  resetText: { color: theme.ink2, fontSize: 13, fontWeight: "700" },
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
  labelRow: { flexDirection: "row", alignItems: "center", gap: 7 },
  unlock: { borderRadius: 12, borderWidth: 1, borderColor: theme.accent, paddingHorizontal: 11, paddingVertical: 6 },
  unlockText: { color: theme.accent, fontSize: 11, fontWeight: "900", letterSpacing: 0.5 },
  rank: { width: 26, height: 26, borderRadius: 13, backgroundColor: theme.accentSoft, alignItems: "center", justifyContent: "center" },
  rankText: { color: theme.accent, fontSize: 11, fontWeight: "900" },
  rankTextOff: { color: theme.muted },
  label: { color: theme.ink, fontSize: 14, fontWeight: "900" },
  labelOff: { color: theme.ink2 },
  blurb: { color: theme.muted, fontSize: 10, marginTop: 3 },
  moves: { gap: 4 },
  move: { width: 26, height: 22, borderRadius: 7, borderWidth: 1, borderColor: theme.lineStrong, alignItems: "center", justifyContent: "center" },
  moveOff: { borderColor: theme.line, opacity: 0.4 },
  moveText: { color: theme.ink, fontSize:10 },
  moveTextOff: { color: theme.muted },
});
