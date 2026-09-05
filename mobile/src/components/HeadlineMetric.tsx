import { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Easing,
  PanResponder,
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";
import { Text } from "@/components/AppText";
import { AuroraLine } from "./AuroraLine";
import { fonts, display, theme } from "@/theme";
import { usePreferences } from "@/preferences";
import type { Headline } from "@/headline";

/** How far a drag has to travel before it counts as a swipe. */
const THRESHOLD = 48;

/**
 * The headline figure at the top of Today.
 *
 * Centred, with the number carrying the weight and everything else deferring
 * to it: an eyebrow above, and the comparison tucked at its lower right in a
 * smaller face so it reads as a footnote to the figure rather than a competing
 * line of its own.
 *
 * More than one chosen headline turns it into a carousel — swipe across, or use
 * the arrows, which are there because a swipe is invisible until somebody
 * happens to try it.
 */
export function HeadlineMetric({
  headlines,
  onPress,
}: {
  headlines: Headline[];
  onPress?: (headline: Headline) => void;
}) {
  const { width } = useWindowDimensions();
  const { t } = usePreferences();
  const [index, setIndex] = useState(0);
  const drag = useRef(new Animated.Value(0)).current;
  const fade = useRef(new Animated.Value(1)).current;

  // The responder is built once; a ref keeps it seeing the current index.
  const position = useRef(0);
  position.current = index;
  const count = headlines.length;
  const total = useRef(count);
  total.current = count;


  function go(direction: -1 | 1) {
    const next = position.current + direction;
    if (next < 0 || next >= total.current) return;

    // Cross-fade rather than slide: the figures are different lengths and a
    // slide makes them jump sideways as they change.
    Animated.sequence([
      Animated.timing(fade, { toValue: 0, duration: 130, easing: Easing.in(Easing.quad), useNativeDriver: true }),
      Animated.timing(fade, { toValue: 1, duration: 220, delay: 40, easing: Easing.out(Easing.quad), useNativeDriver: true }),
    ]).start();
    setTimeout(() => setIndex(next), 150);
  }

  const responder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_event, gesture) =>
          total.current > 1 && Math.abs(gesture.dx) > 10 && Math.abs(gesture.dx) > Math.abs(gesture.dy) * 1.5,
        onPanResponderMove: (_event, gesture) => drag.setValue(gesture.dx),
        onPanResponderRelease: (_event, gesture) => {
          if (Math.abs(gesture.dx) > THRESHOLD) go(gesture.dx < 0 ? 1 : -1);
          Animated.spring(drag, { toValue: 0, damping: 18, stiffness: 220, useNativeDriver: true }).start();
        },
      }),
    // `go` is stable enough: it reads position and total through refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [drag],
  );

  const headline = headlines[Math.min(index, headlines.length - 1)];
  if (!headline) return null;

  const first = index === 0;
  const last = index === headlines.length - 1;

  return (
    <View style={s.wrap} {...responder.panHandlers}>
      {/* The light behind the figure, breathing. */}
      <View pointerEvents="none" style={s.bloom}>
        <AuroraLine width={width * 1.4} height={300} tint={headline.tone} spread={0.5} />
      </View>

      <Animated.View
        style={[
          s.stage,
          {
            opacity: fade,
            transform: [
              { translateX: drag.interpolate({ inputRange: [-160, 160], outputRange: [-20, 20], extrapolate: "clamp" }) },
            ],
          },
        ]}
      >
        <Pressable onPress={onPress ? () => onPress(headline) : undefined} style={s.tap}>
          <Text style={[s.eyebrow, { color: headline.tone }]}>{headline.eyebrow}</Text>

          {/* The figure and its unit share a baseline; the caption hangs off
              the bottom-right corner so the number stays the centre of it. */}
          <View style={s.figureRow}>
            <Text style={s.figure}>{headline.value ?? "—"}</Text>
            {headline.suffix ? (
              <View style={s.suffixSlot}>
                <Text style={s.suffix} numberOfLines={1}>
                  {headline.suffix}
                </Text>
              </View>
            ) : null}
          </View>

          <View style={s.captionBlock}>
            <Text style={s.caption} numberOfLines={2}>
              {headline.value == null ? t("noReading") : headline.caption}
            </Text>
          </View>
        </Pressable>
      </Animated.View>

      {headlines.length > 1 ? (
        <>
          <Pressable
            onPress={() => go(-1)}
            disabled={first}
            hitSlop={14}
            accessibilityLabel="Previous headline"
            style={[s.arrow, s.arrowLeft]}
          >
            <Text style={[s.arrowText, first && s.arrowOff]}>‹</Text>
          </Pressable>

          <Pressable
            onPress={() => go(1)}
            disabled={last}
            hitSlop={14}
            accessibilityLabel="Next headline"
            style={[s.arrow, s.arrowRight]}
          >
            <Text style={[s.arrowText, last && s.arrowOff]}>›</Text>
          </Pressable>

          <View style={s.dots}>
            {headlines.map((item, position) => (
              <View key={item.id} style={[s.dot, position === index && s.dotOn]} />
            ))}
          </View>
        </>
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { alignItems: "center", justifyContent: "center", marginTop: -22, paddingBottom: 14, overflow: "visible" },
  // Sits above everything and clipped by nothing: the light is the first thing
  // you see and it should reach past the header, not stop in a rectangle.
  bloom: { position: "absolute", top: -52, alignItems: "center", justifyContent: "center", zIndex: 100000 },
  stage: { alignItems: "center", zIndex: 100001 },
  tap: { alignItems: "center" },

  eyebrow: {
    fontSize: 11, fontFamily: fonts.black, fontWeight: "900", letterSpacing: 2.2,
    textTransform: "uppercase", marginBottom: 10,
  },
  // A 96pt face needs a line box near 1.2× or iOS clips its ascender; the gap
  // that creates is taken back with a negative margin rather than a short box.
  // The figure sits dead centre and the unit is absolutely placed beside it,
  // so adding or removing a suffix never shifts the number off the axis.
  figureRow: { alignItems: "center", justifyContent: "center" },
  figure: {
    color: theme.ink, fontFamily: display, fontSize: 96, lineHeight: 118,
    marginTop: -8, marginBottom: -24, includeFontPadding: false,
  },
  suffixSlot: { position: "absolute", left: "100%", bottom: 16, paddingLeft: 10 },
  suffix: { color: theme.ink2, fontSize: 15, fontFamily: fonts.black, fontWeight: "800" },

  // Centred on the same axis as the eyebrow and the figure. It used to hang off
  // the figure's right edge as a footnote, which left the whole block looking
  // off-centre because two of its three lines were centred and one was not.
  captionBlock: { maxWidth: 280, marginTop: 8 },
  caption: { color: theme.muted, fontSize: 12, lineHeight: 17, textAlign: "center" },

  arrow: { position: "absolute", top: 62, width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  arrowLeft: { left: 0 },
  arrowRight: { right: 0 },
  arrowText: { color: theme.accent, fontSize: 30, fontFamily: fonts.black, fontWeight: "900" },
  arrowOff: { color: theme.lineStrong },

  dots: { flexDirection: "row", gap: 6, marginTop: 16 },
  dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: theme.lineStrong },
  dotOn: { backgroundColor: theme.accent, width: 16 },
});
