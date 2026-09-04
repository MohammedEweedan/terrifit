import { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { TerrifitSpinner } from "./TerrifitSpinner";
import { theme } from "@/theme";

const AnimatedPath = Animated.createAnimatedComponent(Path);

/** Tick and cross share a stroke length so one dash animation drives both. */
const MARKS = {
  ok: { d: "M12 25.5 L20.5 34 L36 15", length: 44 },
  fail: { d: "M15 15 L33 33 M33 15 L15 33", length: 51 },
} as const;

export type ConfirmState = "working" | "ok" | "fail";

/**
 * The moment an order lands, or does not.
 *
 * It is the same mark that turns on pull-to-refresh — the loader people already
 * know from every other wait in this app — and it resolves in place into a
 * green tick or a red cross. Reusing the refresh spinner rather than inventing
 * a second loading state is the point: one object means "Terrifit is working",
 * everywhere, and the answer arrives by that object changing rather than by it
 * disappearing and something else taking its place.
 *
 * Green and red are fixed rather than taken from the member's accent. A result
 * this binary should not be rendered in a colour somebody chose for decoration
 * — if their accent were red, a successful order would look like a failure.
 */
export function OrderConfirmed({
  state,
  size = 92,
}: {
  state: ConfirmState;
  size?: number;
}) {
  const settle = useRef(new Animated.Value(0)).current;
  /** The loader's own opacity. Reaches zero before the result is drawn. */
  const fade = useRef(new Animated.Value(1)).current;
  const draw = useRef(new Animated.Value(0)).current;

  const resolved = state !== "working";
  const mark = state === "fail" ? MARKS.fail : MARKS.ok;
  const colour = state === "fail" ? theme.poor : theme.good;

  useEffect(() => {
    if (!resolved) {
      settle.setValue(0);
      fade.setValue(1);
      draw.setValue(0);
      return;
    }
    Animated.sequence([
      // A single overshoot as the turning stops, so the resolve has a beat.
      Animated.timing(settle, { toValue: 1, duration: 320, easing: Easing.out(Easing.back(2)), useNativeDriver: false }),
      // The mark clears out completely before the result is drawn. Overlapping
      // the two read as two things stacked on each other; letting the loader
      // leave first makes the tick feel like what it turned into.
      Animated.timing(fade, { toValue: 0, duration: 220, easing: Easing.in(Easing.quad), useNativeDriver: false }),
      Animated.timing(draw, { toValue: 1, duration: 380, easing: Easing.out(Easing.cubic), useNativeDriver: false }),
    ]).start();
  }, [resolved, settle, fade, draw]);

  return (
    <View
      style={[s.wrap, { width: size, height: size }]}
      accessibilityRole="image"
      accessibilityLabel={state === "working" ? "Placing your order" : state === "ok" ? "Order placed" : "Order failed"}
    >
      {/* A soft disc of the result colour, only once there is a result. */}
      <Animated.View
        style={[
          s.halo,
          {
            width: size * 1.5,
            height: size * 1.5,
            borderRadius: size * 0.75,
            backgroundColor: colour,
            opacity: settle.interpolate({ inputRange: [0, 1], outputRange: [0, 0.13] }),
            transform: [{ scale: settle.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] }) }],
          },
        ]}
      />

      {/* The refresh loader. It keeps turning until there is an answer, holds
          still for a beat, then clears out entirely so the result has the
          space to itself. */}
      <Animated.View
        style={{
          transform: [{ scale: settle.interpolate({ inputRange: [0, 0.6, 1], outputRange: [1, 1.14, 1] }) }],
          opacity: fade,
        }}
      >
        <TerrifitSpinner
          size={size}
          spinning={!resolved}
          colour={resolved ? colour : theme.accent}
        />
      </Animated.View>

      {/* Drawn with a dash offset so the stroke travels rather than fading in. */}
      {resolved ? (
        <Animated.View style={[s.mark, { opacity: draw.interpolate({ inputRange: [0, 0.04, 1], outputRange: [0, 1, 1] }) }]}>
          <Svg width={size} height={size} viewBox="0 0 48 48">
            <AnimatedPath
              d={mark.d}
              stroke={colour}
              strokeWidth={5}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
              strokeDasharray={mark.length}
              strokeDashoffset={draw.interpolate({ inputRange: [0, 1], outputRange: [mark.length, 0] })}
            />
          </Svg>
        </Animated.View>
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { alignItems: "center", justifyContent: "center" },
  halo: { position: "absolute" },
  mark: { position: "absolute" },
});
