import { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";
import { Text } from "@/components/AppText";
import { fonts, theme } from "@/theme";

/**
 * Where you are in a multi-step flow.
 *
 * A row of dots joined by a line, filling left to right as steps complete. It
 * answers the two questions somebody has three fields into a checkout: how much
 * is left, and can I go back. Done steps are solid, the current one is ringed,
 * and the ones ahead are outlines — so the state reads without the labels.
 */
export function StepDots({
  steps,
  current,
  onJump,
}: {
  steps: string[];
  /** Zero-based. */
  current: number;
  /** Called when a completed step is tapped. Steps ahead are never tappable. */
  onJump?: (index: number) => void;
}) {
  const progress = useRef(new Animated.Value(0)).current;
  const span = Math.max(1, steps.length - 1);

  useEffect(() => {
    Animated.timing(progress, {
      toValue: current / span,
      duration: 320,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [progress, current, span]);

  return (
    <View style={s.wrap}>
      <View style={s.track}>
        {/* The line is inset by half a dot at each end so it runs between the
            centres rather than past them. */}
        <View style={s.rail} />
        <Animated.View
          style={[
            s.railFill,
            { width: progress.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] }) },
          ]}
        />

        {steps.map((label, index) => {
          const done = index < current;
          const active = index === current;
          return (
            <View key={label} style={s.stop}>
              <Animated.View style={[s.dot, done && s.dotDone, active && s.dotActive]}>
                {done ? <Text style={s.tick}>✓</Text> : null}
              </Animated.View>
            </View>
          );
        })}
      </View>

      <View style={s.labels}>
        {steps.map((label, index) => (
          <Text
            key={label}
            numberOfLines={1}
            onPress={index < current && onJump ? () => onJump(index) : undefined}
            style={[s.label, index === current && s.labelOn, index < current && s.labelDone]}
          >
            {label}
          </Text>
        ))}
      </View>
    </View>
  );
}

const DOT = 20;

const s = StyleSheet.create({
  wrap: { paddingHorizontal: 18, paddingTop: 16, paddingBottom: 18 },
  track: { height: DOT, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  rail: {
    position: "absolute",
    left: DOT / 2,
    right: DOT / 2,
    height: 2,
    borderRadius: 1,
    backgroundColor: theme.line,
  },
  railFill: {
    position: "absolute",
    left: DOT / 2,
    height: 2,
    borderRadius: 1,
    backgroundColor: theme.accent,
    // Same inset as the rail, so a full bar lands on the last dot's centre.
    maxWidth: "100%",
  },
  stop: { width: DOT, alignItems: "center" },
  dot: {
    width: DOT,
    height: DOT,
    borderRadius: DOT / 2,
    borderWidth: 2,
    borderColor: theme.line,
    backgroundColor: theme.bg,
    alignItems: "center",
    justifyContent: "center",
  },
  dotDone: { backgroundColor: theme.accent, borderColor: theme.accent },
  dotActive: { borderColor: theme.accent, backgroundColor: theme.bg, transform: [{ scale: 1.15 }] },
  tick: { color: "#fff", fontSize: 11, fontFamily: fonts.black, fontWeight: "900" },
  labels: { flexDirection: "row", justifyContent: "space-between", marginTop: 9 },
  label: {
    flex: 1,
    color: theme.muted,
    fontSize: 9,
    fontFamily: fonts.black, fontWeight: "900",
    letterSpacing: 0.7,
    textTransform: "uppercase",
    textAlign: "center",
  },
  labelOn: { color: theme.accent },
  labelDone: { color: theme.ink2 },
});
