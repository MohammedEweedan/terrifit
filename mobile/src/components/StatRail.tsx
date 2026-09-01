import { useEffect, useRef } from "react";
import { Animated, Easing, Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { AnimatedNumber } from "./AnimatedNumber";
import { theme } from "@/theme";
import { useStatPreferences, type Stat } from "@/stats";

/**
 * Every metric you have chosen, in two columns.
 *
 * These used to page three at a time behind arrows, which hid two thirds of
 * what somebody had explicitly asked to see. A grid shows all of it — the page
 * scrolls anyway, and a metric you have to go looking for may as well be
 * switched off.
 *
 * On Pro each tile grows a pair of arrows that swap it with its neighbour, so
 * the grid can be rearranged where you are looking at it rather than on a
 * settings screen. Free members reorder in Customise, which still works.
 */
export function StatRail({ stats, pro = false }: { stats: Stat[]; pro?: boolean }) {
  const router = useRouter();
  const { move } = useStatPreferences();
  if (stats.length === 0) return null;

  return (
    <View style={s.wrap}>
      <View style={s.grid}>
        {stats.map((stat, index) => (
          <StatRow
            key={stat.id}
            stat={stat}
            index={index}
            pro={pro}
            first={index === 0}
            last={index === stats.length - 1}
            onMove={(direction) => move(stat.id, direction)}
            onPress={() => router.push(`/metric/${stat.id}` as never)}
          />
        ))}
      </View>

      <Pressable
        accessibilityLabel="Choose which metrics show"
        onPress={() => router.push("/customise-stats" as never)}
        style={s.customise}
      >
        <Text style={s.customiseText}>Customise</Text>
        <Text style={s.customiseArrow}>›</Text>
      </Pressable>
    </View>
  );
}

function StatRow({
  stat, index, pro, first, last, onMove, onPress,
}: {
  stat: Stat;
  index: number;
  pro: boolean;
  first: boolean;
  last: boolean;
  onMove: (direction: -1 | 1) => void;
  onPress: () => void;
}) {
  const bar = useRef(new Animated.Value(0)).current;
  const enter = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(enter, {
      toValue: 1,
      duration: 380,
      delay: 120 + index * 55,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
    Animated.timing(bar, {
      toValue: stat.value == null ? 0 : stat.fill,
      duration: 700,
      delay: 180 + index * 55,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [bar, enter, stat.value, stat.fill, index]);

  return (
    <Animated.View
      style={[
        s.cell,
        {
          opacity: enter,
          transform: [{ translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }],
        },
      ]}
    >
      <Pressable onPress={onPress} style={s.row} accessibilityLabel={`${stat.label} over time`}>
        <View style={s.head}>
          <View style={s.labelRow}>
            <Text style={s.label} numberOfLines={1}>{stat.label}</Text>
            {pro ? (
              <View style={s.arrows}>
                <Pressable
                  onPress={() => onMove(-1)}
                  disabled={first}
                  hitSlop={8}
                  accessibilityLabel={`Move ${stat.label} earlier`}
                >
                  <Text style={[s.arrow, first && s.arrowOff]}>‹</Text>
                </Pressable>
                <Pressable
                  onPress={() => onMove(1)}
                  disabled={last}
                  hitSlop={8}
                  accessibilityLabel={`Move ${stat.label} later`}
                >
                  <Text style={[s.arrow, last && s.arrowOff]}>›</Text>
                </Pressable>
              </View>
            ) : null}
          </View>
          <AnimatedNumber value={stat.value} format={stat.format} delay={180 + index * 55} style={s.value} />
        </View>

        <View style={s.track}>
          <Animated.View
            style={[
              s.fill,
              {
                backgroundColor: stat.tone,
                width: bar.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] }),
              },
            ]}
          />
        </View>

        <View style={s.foot}>
          <Text style={s.delta} numberOfLines={2}>
            {stat.value == null ? "No reading yet" : stat.delta}
          </Text>
          <Text style={s.chevron}>›</Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  wrap: { borderTopWidth: 1, borderTopColor: theme.line, paddingTop: 4 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  // Two per row, with the gap taken out of the width rather than the padding.
  cell: { width: "48.4%" },
  row: {
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.line,
    backgroundColor: theme.surface,
    minHeight: 132,
  },
  head: { gap: 6 },
  labelRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 6 },
  label: { color: theme.muted, fontSize: 10, fontWeight: "900", letterSpacing: 1.2, textTransform: "uppercase", flex: 1 },
  arrows: { flexDirection: "row", gap: 10, marginRight: -2 },
  arrow: { color: theme.accent, fontSize: 17, fontWeight: "900", lineHeight: 18 },
  arrowOff: { color: theme.lineStrong },
  value: { color: theme.ink, fontSize: 21, fontWeight: "900", letterSpacing: -0.5 },
  track: { height: 3, borderRadius: 2, backgroundColor: theme.line, marginTop: 10, overflow: "hidden" },
  fill: { height: 3, borderRadius: 2 },
  foot: { flexDirection: "row", alignItems: "flex-start", gap: 6, marginTop: 9 },
  delta: { color: theme.muted, fontSize: 11, lineHeight: 15, flex: 1 },
  chevron: { color: theme.muted, fontSize: 16, lineHeight: 18 },
  customise: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 16 },
  customiseText: { color: theme.ink2, fontSize: 11, fontWeight: "900", letterSpacing: 1.2, textTransform: "uppercase" },
  customiseArrow: { color: theme.ink2, fontSize: 16 },
});
