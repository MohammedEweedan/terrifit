import { useEffect, useMemo, useRef } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";
import Svg, { Defs, Ellipse, Stop, RadialGradient as SvgRadial } from "react-native-svg";
import { theme } from "@/theme";

/** Each ribbon drifts on its own clock, so the band never repeats visibly. */
const RIBBONS = [
  { width: 190, height: 54, hue: theme.accent, opacity: 0.55, period: 5200, travel: 46, rise: -0.22, delay: 0 },
  { width: 150, height: 44, hue: "#ff8a4c", opacity: 0.45, period: 6800, travel: -38, rise: 0.06, delay: 900 },
  { width: 230, height: 34, hue: theme.accent, opacity: 0.32, period: 8200, travel: 30, rise: 0.26, delay: 400 },
  { width: 110, height: 62, hue: "#ffb27a", opacity: 0.3, period: 4600, travel: -52, rise: -0.04, delay: 1500 },
];

/**
 * A band of orange light, drifting.
 *
 * Stands in for a number somebody has chosen not to see: something is there,
 * it is alive, and it says nothing. Built from overlapping soft-edged ellipses
 * on independent loops rather than an animated path — a path whose `d` changes
 * every frame is redrawn on the JS thread, and this runs entirely on
 * transforms, which do not.
 */
export function AuroraLine({
  width = 240,
  height = 64,
  /** Overrides the accent, so the band's own colourway can light the stage. */
  tint,
  /**
   * How far the ribbons spread vertically. 1 fills the box as a curtain;
   * 0 stacks them into a single band of light, which is what you want when
   * the aurora sits behind one line of text rather than a whole hero.
   */
  spread = 1,
  /** How many ribbons to draw. Fewer reads as one light, not a sky. */
  count = RIBBONS.length,
}: {
  width?: number;
  height?: number;
  tint?: string;
  spread?: number;
  count?: number;
}) {
  // Fixed per mount so the ribbons keep their phase across re-renders.
  const drifts = useRef(RIBBONS.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    const loops = drifts.map((drift, index) => {
      const { period, delay } = RIBBONS[index];
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(drift, { toValue: 1, duration: period, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(drift, { toValue: 0, duration: period, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ]),
      );
    });
    loops.forEach((loop) => loop.start());
    return () => loops.forEach((loop) => loop.stop());
  }, [drifts]);

  const shapes = useMemo(
    () =>
      RIBBONS.slice(0, count).map((ribbon, index) => ({
        ...ribbon,
        id: `aurora-${tint ?? "accent"}-${index}`.replace(/[^a-zA-Z0-9-]/g, ""),
      })),
    [tint, count],
  );

  const scale = width / 240;

  return (
    <View style={[s.wrap, { width, height }]} pointerEvents="none" accessibilityElementsHidden>
      {shapes.map((ribbon, index) => (
        <Animated.View
          key={ribbon.id}
          style={[
            s.ribbon,
            {
              opacity: drifts[index].interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.35, 1, 0.35] }),
              transform: [
                { translateX: drifts[index].interpolate({ inputRange: [0, 1], outputRange: [-ribbon.travel, ribbon.travel] }) },
                // Each ribbon sits at its own height, so the curtain fills the
                // box rather than stacking every layer on one line.
                { translateY: ribbon.rise * height * spread },
                { scaleY: drifts[index].interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.7, 1.15, 0.7] }) },
              ],
            },
          ]}
        >
          <Svg width={ribbon.width * scale} height={ribbon.height * scale}>
            <Defs>
              <SvgRadial id={ribbon.id} cx="50%" cy="50%" rx="50%" ry="50%">
                <Stop offset="0%" stopColor={tint ?? ribbon.hue} stopOpacity={ribbon.opacity} />
                <Stop offset="55%" stopColor={tint ?? ribbon.hue} stopOpacity={ribbon.opacity * 0.35} />
                <Stop offset="100%" stopColor={tint ?? ribbon.hue} stopOpacity={0} />
              </SvgRadial>
            </Defs>
            <Ellipse
              cx={(ribbon.width * scale) / 2}
              cy={(ribbon.height * scale) / 2}
              rx={(ribbon.width * scale) / 2}
              ry={(ribbon.height * scale) / 2}
              fill={`url(#${ribbon.id})`}
            />
          </Svg>
        </Animated.View>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { alignItems: "center", justifyContent: "center" },
  ribbon: { position: "absolute" },
});
