import { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Easing, Image, StyleSheet, View } from "react-native";
import { TerrifitMark } from "./TerrifitMark";
import { theme } from "@/theme";

/** The launch colourways, in the order they slide through. */
const BANDS = [
  { id: "ember", image: "/media/band/ember.png", tint: "#ff5a1f" },
  { id: "bubblegum", image: "/media/band/bubblegum.png", tint: "#ff7ab8" },
  { id: "black", image: "/media/band/black.png", tint: "#8b9099" },
  { id: "graphite", image: "/media/band/graphite.png", tint: "#b9bfc7" },
  { id: "midnight", image: "/media/band/midnight.png", tint: "#7d93c4" },
  { id: "stone", image: "/media/band/stone.png", tint: "#a9a9a9" },
  { id: "olive", image: "/media/band/olive.png", tint: "#5a7d5a" },
];

/**
 * What the ring is made of.
 *
 * The four strap colourways, plus the member's own accent — so the ring says
 * two things at once: these are the colours V1 comes in, and the app's colour
 * is one you picked and can change.
 */
const RING_COLOURS = ["#ff5a1f", "#ff7ab8", "#8b9099", "#b9bfc7", "#7d93c4"];

/** How long each colourway holds on screen before the next is pushed in. */
const HOLD_MS = 2400;
const SLIDE_MS = 560;
/** Marks around the ring, evenly spaced with clear air between them. */
const MARKS = 12;
const MARK_SIZE = 20;
/** One full turn of the ring. Slow enough to notice only if you look. */
const ORBIT_MS = 26_000;

/**
 * The band, turning through its colourways inside a ring of Terrifit marks.
 *
 * The ring is fixed — it is a border made of the brand mark, not a dial, so
 * nothing about it should suggest a reading. Every mark is the same size and
 * they are spaced to touch, which is what makes it read as one ring rather
 * than a scattering of logos.
 *
 * The bands are pushed in from the right on a loop. The index drives the
 * animation rather than the other way round: orchestrating both from one
 * callback meant a `setValue` landing mid-flight on a native-driven value,
 * which is silently dropped and left the carousel stuck on its first band.
 */
export function BandCarousel({ size = 300, asset }: { size?: number; asset: (path: string) => string }) {
  const [index, setIndex] = useState(0);
  const slide = useRef(new Animated.Value(0)).current;
  const orbit = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const timer = setInterval(() => setIndex((current) => (current + 1) % BANDS.length), HOLD_MS + SLIDE_MS);
    return () => clearInterval(timer);
  }, []);

  // Runs whenever the band changes: in from the right, and settle.
  useEffect(() => {
    slide.setValue(1);
    Animated.timing(slide, {
      toValue: 0,
      duration: SLIDE_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [index, slide]);

  useEffect(() => {
    const spin = Animated.loop(
      Animated.timing(orbit, { toValue: 1, duration: ORBIT_MS, easing: Easing.linear, useNativeDriver: true }),
    );
    spin.start();
    return () => spin.stop();
  }, [orbit]);


  const radius = size * 0.455;

  // The accent takes every third place, so the member's colour is threaded
  // through the strap colours rather than sitting apart from them.
  const ringColour = (position: number) =>
    position % 3 === 0 ? theme.accent : RING_COLOURS[position % RING_COLOURS.length];

  const marks = useMemo(
    () =>
      Array.from({ length: MARKS }, (_, i) => {
        const radians = (i / MARKS) * Math.PI * 2;
        return { x: Math.cos(radians) * radius, y: Math.sin(radians) * radius };
      }),
    [radius],
  );

  const band = BANDS[index];

  return (
    <View style={[s.stage, { width: size, height: size }]} pointerEvents="none">
      {/* No aurora here. This carousel is what somebody sees before they own
          anything, and lighting an unowned band the same way the paired screen
          lights theirs made the two states indistinguishable. The light is a
          reward for having one, not decoration on the shop window. */}
      {/* One ring, turning clockwise as a whole. Every mark is the same size
          and stays upright — each is counter-rotated by exactly what the ring
          adds — so they travel round the circle rather than tumbling. */}
      <Animated.View
        style={[
          s.ring,
          { transform: [{ rotate: orbit.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] }) }] },
        ]}
      >
        {marks.map((mark, position) => (
          <Animated.View
            key={position}
            style={[
              s.mark,
              {
                transform: [
                  { translateX: mark.x },
                  { translateY: mark.y },
                  { rotate: orbit.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "-360deg"] }) },
                ],
              },
            ]}
          >
            <TerrifitMark size={MARK_SIZE} colour={ringColour(position)} />
          </Animated.View>
        ))}
      </Animated.View>

      <Animated.View
        style={{
          transform: [
            { translateX: slide.interpolate({ inputRange: [0, 1], outputRange: [0, size] }) },
            { scale: slide.interpolate({ inputRange: [0, 1], outputRange: [1, 0.88] }) },
          ],
          opacity: slide.interpolate({ inputRange: [0, 0.6, 1], outputRange: [1, 0.4, 0] }),
        }}
      >
        <Image
          source={{ uri: asset(band.image) }}
          style={{ width: size * 0.78, height: size * 0.78, resizeMode: "contain" }}
        />
      </Animated.View>
    </View>
  );
}

const s = StyleSheet.create({
  // Not clipped: the aurora is meant to leave the stage.
  stage: { alignItems: "center", justifyContent: "center", overflow: "visible" },
  bloom: { position: "absolute", top: -90, alignItems: "center", justifyContent: "center", zIndex: 5 },
  ring: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, alignItems: "center", justifyContent: "center" },
  mark: { position: "absolute", opacity: 0.75 },
});
