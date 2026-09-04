import { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";
import { Text } from "@/components/AppText";
import Svg, { Defs, G, Line, Stop, LinearGradient as SvgGradient } from "react-native-svg";
import { fonts, display, theme } from "@/theme";

const AnimatedG = Animated.createAnimatedComponent(G);

/** Ticks around the dial. Enough to read as a scale, not so many it turns solid. */
const TICKS = 64;
/** The arc the ticks cover, centred on the top. */
const SWEEP = 300;

/**
 * The headline figure on a ring of ticks.
 *
 * The ticks are the point: a plain circle says nothing, but a scale with a lit
 * portion says where this number sits in the range it could have taken. The
 * lit run grows from the left, so a lower age lights less of the dial and the
 * shape carries the reading before the digits are read.
 */
export function AgeDial({
  value,
  label,
  fraction,
  size = 230,
  tone = theme.accent,
}: {
  /** The figure in the middle, already formatted. */
  value: string;
  label: string;
  /** How much of the scale is lit, 0–1. */
  fraction: number;
  size?: number;
  tone?: string;
}) {
  const sweep = useRef(new Animated.Value(0)).current;
  const rise = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(sweep, {
        toValue: Math.max(0, Math.min(1, fraction)),
        duration: 1200,
        easing: Easing.out(Easing.cubic),
        // Tick opacity is driven per-frame, which the native driver cannot do.
        useNativeDriver: false,
      }),
      Animated.timing(rise, { toValue: 1, duration: 620, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, [sweep, rise, fraction]);

  const centre = size / 2;
  const outer = centre - 6;
  const inner = outer - 16;

  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <Svg width={size} height={size}>
        <Defs>
          <SvgGradient id="dialTick" x1="0" y1="1" x2="1" y2="0">
            <Stop offset="0%" stopColor={tone} stopOpacity={0.55} />
            <Stop offset="100%" stopColor={tone} stopOpacity={1} />
          </SvgGradient>
        </Defs>

        {Array.from({ length: TICKS }, (_, index) => {
          // Start at the lower left and run clockwise, leaving a gap at the
          // bottom so the scale has a beginning and an end.
          const angle = (-90 - SWEEP / 2 + (index / (TICKS - 1)) * SWEEP) * (Math.PI / 180);
          const x1 = centre + Math.cos(angle) * inner;
          const y1 = centre + Math.sin(angle) * inner;
          const x2 = centre + Math.cos(angle) * outer;
          const y2 = centre + Math.sin(angle) * outer;
          const at = index / (TICKS - 1);

          return (
            <AnimatedG key={index}>
              <Line
                x1={x1} y1={y1} x2={x2} y2={y2}
                stroke={theme.lineStrong}
                strokeWidth={2}
                strokeLinecap="round"
                opacity={0.35}
              />
              <AnimatedLine
                x1={x1} y1={y1} x2={x2} y2={y2}
                stroke="url(#dialTick)"
                strokeWidth={2.6}
                strokeLinecap="round"
                // Lit only once the sweep has passed this tick, with a short
                // ramp so the leading edge glows rather than snapping on.
                opacity={sweep.interpolate({
                  inputRange: [Math.max(0, at - 0.03), at, 1],
                  outputRange: [0, 1, 1],
                  extrapolate: "clamp",
                })}
              />
            </AnimatedG>
          );
        })}
      </Svg>

      <Animated.View
        style={[
          s.centre,
          {
            opacity: rise,
            transform: [{ translateY: rise.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }],
          },
        ]}
      >
        <Text style={s.value}>{value}</Text>
        <Text style={[s.label, { color: tone }]}>{label}</Text>
      </Animated.View>
    </View>
  );
}

const AnimatedLine = Animated.createAnimatedComponent(Line);

const s = StyleSheet.create({
  centre: { position: "absolute", alignItems: "center" },
  value: {
    color: theme.ink, fontFamily: display, fontSize: 76, lineHeight: 92,
    marginBottom: -14, includeFontPadding: false,
  },
  label: { fontSize: 10, fontFamily: fonts.black, fontWeight: "900", letterSpacing: 2, textTransform: "uppercase" },
});
