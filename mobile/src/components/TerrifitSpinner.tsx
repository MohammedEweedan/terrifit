import { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import Svg, { Path } from "react-native-svg";
import { theme } from "@/theme";

const AnimatedPath = Animated.createAnimatedComponent(Path);

/**
 * The four tiles of the mark, in clockwise order.
 *
 * Order matters: the animation reads as rotation only if the tiles light in the
 * order an eye traces a circle. Top-left, top-right, bottom-right, bottom-left.
 * Paths are copied verbatim from `TerrifitMark` — if one changes, both do.
 */
const TILES = [
  "M3 1.5H5A5.5 5.5 0 0 1 10.5 7V9A1.5 1.5 0 0 1 9 10.5H3A1.5 1.5 0 0 1 1.5 9V3A1.5 1.5 0 0 1 3 1.5Z",
  "M15 1.5H21A1.5 1.5 0 0 1 22.5 3V5A5.5 5.5 0 0 1 17 10.5H15A1.5 1.5 0 0 1 13.5 9V3A1.5 1.5 0 0 1 15 1.5Z",
  "M15 13.5H21A1.5 1.5 0 0 1 22.5 15V21A1.5 1.5 0 0 1 21 22.5H19A5.5 5.5 0 0 1 13.5 17V15A1.5 1.5 0 0 1 15 13.5Z",
  "M7 13.5H9A1.5 1.5 0 0 1 10.5 15V21A1.5 1.5 0 0 1 9 22.5H3A1.5 1.5 0 0 1 1.5 21V19A5.5 5.5 0 0 1 7 13.5Z",
];

/** One full turn. Slow enough to read as deliberate, not as a stutter. */
const CYCLE_MS = 1400;

/**
 * The loading spinner: the Terrifit mark, turning.
 *
 * Each tile fades up and down a quarter-cycle behind the one before it, so the
 * brightness travels clockwise around the grid without anything moving. It is
 * the brand mark doing the waiting rather than a system spinner that could
 * belong to any app.
 *
 * `opacity` on an SVG path cannot use the native driver, so this runs on the JS
 * thread. That is fine for four interpolations and is the only way to animate
 * inside an SVG without swapping to four absolutely-positioned views, which
 * would break the moment the mark's geometry changed.
 */
export function TerrifitSpinner({
  size = 28,
  colour = theme.accent,
  style,
  /** When false the mark is drawn solid and still, ready to start turning. */
  spinning = true,
}: {
  size?: number;
  colour?: string;
  style?: StyleProp<ViewStyle>;
  spinning?: boolean;
}) {
  const turn = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!spinning) {
      turn.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.timing(turn, {
        toValue: 1,
        duration: CYCLE_MS,
        easing: Easing.linear,
        useNativeDriver: false,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [turn, spinning]);

  return (
    <View style={[{ width: size, height: size }, style]} accessibilityRole="progressbar" accessibilityLabel="Loading">
      <Svg width={size} height={size} viewBox="0 0 24 24">
        {TILES.map((path, index) => (
          <AnimatedPath
            key={path}
            d={path}
            fill={colour}
            // Each tile peaks a quarter-turn after the previous one. The ramp
            // is wide so tiles overlap and the light sweeps rather than blinks,
            // and it wraps at both ends so the loop has no visible seam.
            opacity={
              spinning
                ? turn.interpolate({
                    inputRange: phaseFor(index),
                    outputRange: [0.18, 0.18, 1, 0.18, 0.18],
                  })
                : 1
            }
          />
        ))}
      </Svg>
    </View>
  );
}

/**
 * Where in the cycle a tile peaks, as five ascending stops.
 *
 * `interpolate` requires a strictly increasing input range, so a tile whose
 * peak would fall off either end is clamped rather than wrapped — the first and
 * last tiles lose a little of their ramp, which is invisible at this speed and
 * far simpler than running two interpolations per tile.
 */
function phaseFor(index: number): [number, number, number, number, number] {
  const peak = index / TILES.length;
  const ramp = 0.16;
  const stops = [peak - ramp * 2, peak - ramp, peak, peak + ramp, peak + ramp * 2];
  const clamped = stops.map((stop) => Math.min(1, Math.max(0, stop)));

  // Nudge any collapsed stops apart so the range stays strictly increasing.
  for (let i = 1; i < clamped.length; i += 1) {
    if (clamped[i] <= clamped[i - 1]) clamped[i] = clamped[i - 1] + 0.0001;
  }
  return clamped as [number, number, number, number, number];
}

export const spinnerStyles = StyleSheet.create({
  centred: { alignItems: "center", justifyContent: "center", paddingVertical: 28 },
});
