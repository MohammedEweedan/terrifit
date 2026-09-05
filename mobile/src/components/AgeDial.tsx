import { useEffect, useMemo, useRef } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";
import { Text } from "@/components/AppText";
import Svg, { Defs, Path, Stop, RadialGradient as SvgRadial } from "react-native-svg";
import { fonts, display, theme } from "@/theme";

/**
 * The wave rings.
 *
 * Each is a circle whose radius rises and falls with angle — two sine terms at
 * frequencies that do not divide into each other, so the crests never line up
 * into an obvious rosette. The counts are high and the amplitudes small on
 * purpose: five big lobes is a starfish, fourteen shallow ones is water. They
 * sit at slightly different radii and turn at different speeds in alternating
 * directions, which is what makes the whole thing look like it is moving
 * *through* itself instead of simply spinning.
 */
const RINGS = [
  { radius: 0.315, amp: 0.022, freq: 8, phase: 0.0, width: 2.0, opacity: 1.00, seconds: 18, reverse: false },
  { radius: 0.352, amp: 0.028, freq: 11, phase: 1.1, width: 1.6, opacity: 0.80, seconds: 24, reverse: true },
  { radius: 0.387, amp: 0.022, freq: 14, phase: 2.3, width: 1.2, opacity: 0.58, seconds: 31, reverse: false },
  { radius: 0.418, amp: 0.018, freq: 17, phase: 0.6, width: 1.0, opacity: 0.38, seconds: 39, reverse: true },
] as const;

/**
 * The figure inside a ring of moving water.
 *
 * Three attempts got here. A ring of ticks was a *scale*, which implied a range
 * this number does not have — nobody knows where 19 sits between the best and
 * worst possible fitness age. A corona of rays was a firework: all spike, no
 * body, and the figure covered its core.
 *
 * Waves say the only true thing: the number is alive and it moves. Nothing here
 * encodes a value — the rings are identical whatever the reading, so they can
 * never overstate what the estimate actually knows.
 *
 * The motion is a rotation, not a redraw. Recomputing four 180-point paths on
 * every frame would run on the JavaScript thread and stutter; rotating four finished
 * paths at different speeds runs on the native driver and holds 60fps, and the
 * eye reads travelling waves either way.
 */
export function AgeDial({
  value,
  label,
  delta,
  pill,
  size = 320,
  tone = theme.accent,
}: {
  /** The figure in the middle, already formatted. */
  value: string;
  label: string;
  /** The comparison, above the figure. Omitted while it is being hidden. */
  delta?: string;
  /** One measured fact under the figure, so the number has provenance. */
  pill?: string;
  size?: number;
  tone?: string;
}) {
  const rise = useRef(new Animated.Value(0)).current;
  const open = useRef(new Animated.Value(0)).current;
  // One driver per ring, each looping on its own clock.
  const spins = useRef(RINGS.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(open, { toValue: 1, duration: 620, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(rise, { toValue: 1, duration: 420, delay: 120, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();

    const loops = spins.map((spin, index) =>
      Animated.loop(
        Animated.timing(spin, {
          toValue: 1,
          duration: RINGS[index].seconds * 1000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ),
    );
    loops.forEach((loop) => loop.start());
    return () => loops.forEach((loop) => loop.stop());
  }, [open, rise, spins]);

  // Paths are geometry, not state: built once per size and reused every frame.
  const paths = useMemo(
    () => RINGS.map((ring) => wavePath(size / 2, size / 2, size * ring.radius, size * ring.amp, ring.freq, ring.phase)),
    [size],
  );

  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      {RINGS.map((ring, index) => (
        <Animated.View
          key={ring.freq}
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            {
              opacity: open,
              transform: [
                // Opening from slightly inside gives the rings somewhere to
                // arrive from, so the dial settles rather than appearing.
                { scale: open.interpolate({ inputRange: [0, 1], outputRange: [0.88, 1] }) },
                {
                  rotate: spins[index].interpolate({
                    inputRange: [0, 1],
                    outputRange: ring.reverse ? ["360deg", "0deg"] : ["0deg", "360deg"],
                  }),
                },
              ],
            },
          ]}
        >
          <Svg width={size} height={size}>
            <Defs>
              <SvgRadial id={`wave${index}`} cx="50%" cy="50%" rx="50%" ry="50%">
                {/* The rings sit between 63% and 84% of this gradient's radius,
                    so every stop before 60% is invisible and the band they
                    actually cross has to be the accent. Two earlier versions
                    came out indigo whatever colour the member had picked: the
                    first put the cool tone at 60%, the second reached full
                    indigo at 100% and the outer two rings sat close enough to
                    catch it. The cool tone is now half-mixed with the accent,
                    mostly accent, so the outer edge cools without turning
                    a warm accent pink. */}
                <Stop offset="0%" stopColor={lift(tone, 0.6)} stopOpacity={1} />
                <Stop offset="62%" stopColor={lift(tone, 0.24)} stopOpacity={1} />
                <Stop offset="86%" stopColor={tone} stopOpacity={1} />
                <Stop offset="100%" stopColor={mix(tone, theme.sleep, 0.25)} stopOpacity={0.9} />
              </SvgRadial>
            </Defs>
            <Path
              d={paths[index]}
              fill="none"
              stroke={`url(#wave${index})`}
              strokeWidth={ring.width}
              strokeOpacity={ring.opacity}
              strokeLinecap="round"
            />
          </Svg>
        </Animated.View>
      ))}

      <Animated.View
        style={[
          s.centre,
          {
            opacity: rise,
            transform: [{ translateY: rise.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }],
          },
        ]}
      >
        {delta ? <Text style={s.delta}>{delta}</Text> : null}
        <Text style={s.value}>{value}</Text>
        <Text style={[s.label, { color: tone }]}>{label}</Text>
        {pill ? (
          <View style={[s.pill, { borderColor: tone }]}>
            <Text style={[s.pillText, { color: tone }]}>{pill}</Text>
          </View>
        ) : null}
      </Animated.View>
    </View>
  );
}

/**
 * A closed circle whose radius undulates with angle.
 *
 * 180 steps is smooth at every size this is drawn at and keeps the path string
 * short enough to build cheaply.
 */
function wavePath(cx: number, cy: number, radius: number, amp: number, freq: number, phase: number): string {
  const steps = 180;
  let d = "";
  for (let i = 0; i <= steps; i += 1) {
    const t = (i / steps) * Math.PI * 2;
    const r = radius + amp * Math.sin(freq * t + phase) + amp * 0.42 * Math.sin(freq * 1.7 * t + phase * 1.4);
    const x = cx + Math.cos(t) * r;
    const y = cy + Math.sin(t) * r;
    d += `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
  }
  return `${d}Z`;
}

/** Lifts a hex toward white, for the bright inner edge of the gradient. */
function lift(hex: string, amount: number): string {
  const value = hex.replace("#", "");
  if (value.length < 6) return hex;
  const channel = (i: number) => {
    const n = parseInt(value.slice(i, i + 2), 16);
    return Math.round(n + (255 - n) * amount).toString(16).padStart(2, "0");
  };
  return `#${channel(0)}${channel(2)}${channel(4)}`;
}

/** Blends two hex colours, `amount` of the second into the first. */
function mix(a: string, b: string, amount: number): string {
  const parse = (hex: string) => {
    const v = hex.replace("#", "");
    if (v.length < 6) return null;
    return [0, 2, 4].map((i) => parseInt(v.slice(i, i + 2), 16));
  };
  const [x, y] = [parse(a), parse(b)];
  if (!x || !y) return a;
  const channel = (i: number) =>
    Math.round(x[i] + (y[i] - x[i]) * amount).toString(16).padStart(2, "0");
  return `#${channel(0)}${channel(1)}${channel(2)}`;
}

const s = StyleSheet.create({
  centre: { position: "absolute", alignItems: "center" },
  delta: { color: theme.ink2, fontSize: 12, marginBottom: 4 },
  value: {
    color: theme.ink, fontFamily: display, fontSize: 64, lineHeight: 76,
    marginBottom: -8, includeFontPadding: false,
  },
  label: { fontSize: 10, fontFamily: fonts.black, fontWeight: "900", letterSpacing: 2, textTransform: "uppercase" },
  pill: {
    marginTop: 10, paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 11, borderWidth: 1,
  },
  pillText: { fontSize: 10, fontFamily: fonts.black, fontWeight: "900", letterSpacing: 0.6 },
});
