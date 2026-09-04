import { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";
import { Text } from "@/components/AppText";
import { fonts, theme } from "@/theme";
import type { FitnessFactor } from "@/api";

/**
 * What went into the number, each on its own scale.
 *
 * A bullet list said the same things but made them all look equally weighted
 * and gave no sense of where a reading sat. A bar per input answers "is this
 * good" at a glance, and the badge on the right says which way it pushed the
 * estimate — which is the part somebody can act on.
 */
export function FactorBars({ factors }: { factors: FitnessFactor[] }) {
  if (factors.length === 0) return null;

  return (
    <View style={s.list}>
      {factors.map((factor, index) => (
        <FactorRow key={factor.label} factor={factor} index={index} />
      ))}
    </View>
  );
}

function FactorRow({ factor, index }: { factor: FitnessFactor; index: number }) {
  const fill = useRef(new Animated.Value(0)).current;
  const enter = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(enter, {
      toValue: 1, duration: 380, delay: 120 + index * 70,
      easing: Easing.out(Easing.cubic), useNativeDriver: true,
    }).start();
    Animated.timing(fill, {
      toValue: Math.max(0, Math.min(1, factor.position)),
      duration: 800, delay: 200 + index * 70,
      easing: Easing.out(Easing.cubic), useNativeDriver: false,
    }).start();
  }, [fill, enter, factor.position, index]);

  const tone =
    factor.effect === "younger" ? theme.good : factor.effect === "older" ? theme.fair : theme.ink2;

  return (
    <Animated.View
      style={[
        s.row,
        {
          opacity: enter,
          transform: [{ translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }],
        },
      ]}
    >
      <View style={s.head}>
        <Text style={s.label} numberOfLines={1}>{factor.label}</Text>
        <Text style={s.value}>{factor.value}</Text>
      </View>

      <View style={s.track}>
        <Animated.View
          style={[
            s.fill,
            { backgroundColor: tone, width: fill.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] }) },
          ]}
        />
      </View>

      <View style={s.foot}>
        <Text style={s.note} numberOfLines={1}>{factor.note}</Text>
        {factor.effect !== "neutral" ? (
          <View style={[s.badge, { borderColor: tone }]}>
            <Text style={[s.badgeText, { color: tone }]}>
              {factor.effect === "younger" ? "↓ younger" : "↑ older"}
            </Text>
          </View>
        ) : null}
      </View>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  list: { gap: 4 },
  row: {
    borderRadius: 16, borderWidth: 1, borderColor: theme.line,
    backgroundColor: theme.surface, paddingHorizontal: 15, paddingVertical: 13, marginBottom: 9,
  },
  head: { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", gap: 12 },
  label: { color: theme.ink2, fontSize: 12, fontFamily: fonts.black, fontWeight: "800", letterSpacing: 0.3, flex: 1 },
  value: { color: theme.ink, fontSize: 16, fontFamily: fonts.black, fontWeight: "900", letterSpacing: -0.3 },
  track: { height: 5, borderRadius: 3, backgroundColor: theme.line, overflow: "hidden", marginTop: 10 },
  fill: { height: 5, borderRadius: 3 },
  foot: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10, marginTop: 9 },
  note: { color: theme.muted, fontSize: 11, flex: 1 },
  badge: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3 },
  badgeText: { fontSize: 9, fontFamily: fonts.black, fontWeight: "900", letterSpacing: 0.5, textTransform: "uppercase" },
});
