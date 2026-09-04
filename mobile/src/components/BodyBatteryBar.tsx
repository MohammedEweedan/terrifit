import { useEffect, useRef, useState } from "react";
import { Animated, Easing, StyleSheet, View, type LayoutChangeEvent } from "react-native";
import { Text } from "@/components/AppText";
import Svg, { Defs, Rect, Stop, LinearGradient as SvgGradient } from "react-native-svg";
import { CardTitle } from "./CardTitle";
import { fonts, theme } from "@/theme";
import type { BodyBattery } from "@/api";
import { metricLabel } from "@/metric-labels";
import { usePreferences } from "@/preferences";

/**
 * The reservoir, across the top of a Pro dashboard.
 *
 * Sleep charges it and the day drains it, and unlike every score on this
 * screen it carries over — which is the whole reason it is a bar and not
 * another dial. A run of short nights digs a hole you can watch, and that is
 * the thing a paying member gets that a free one does not.
 */
export function BodyBatteryBar({ battery }: { battery: BodyBattery }) {
  const { locale } = usePreferences();
  const level = battery.current;
  const charged = battery.charged;

  // Measured rather than percentage-based: an SVG inside a percentage-width
  // parent has no intrinsic size to resolve "100%" against and collapses to a
  // sliver. Pixels are unambiguous.
  const [width, setWidth] = useState(0);
  const fill = useRef(new Animated.Value(0)).current;
  const share = level == null ? 0 : Math.max(0, Math.min(100, level)) / 100;

  useEffect(() => {
    if (width === 0) return;
    Animated.timing(fill, {
      toValue: share * width,
      duration: 900,
      delay: 200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [fill, share, width]);

  const onLayout = (event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width);

  const tone = level == null ? theme.muted : level >= 60 ? theme.good : level >= 30 ? theme.fair : theme.poor;

  return (
    <View style={s.wrap}>
      <CardTitle icon="battery" title={metricLabel("bodyBattery", locale)} />

      <View style={s.meter}>
        <View style={s.track} onLayout={onLayout}>
        <Animated.View style={[s.fillWrap, { width: fill }]}>
          {width > 0 ? (
            // The gradient is drawn at full track width and revealed by the
            // clipping wrapper, so its colours stay put as the bar grows
            // rather than squashing along with it.
            <Svg width={width} height={10}>
              <Defs>
                <SvgGradient id="batteryFill" x1="0" y1="0" x2="1" y2="0">
                  <Stop offset="0%" stopColor={theme.accent} />
                  <Stop offset="100%" stopColor={tone} />
                </SvgGradient>
              </Defs>
              <Rect x={0} y={0} width={width} height={10} rx={5} fill="url(#batteryFill)" />
            </Svg>
          ) : null}
        </Animated.View>

          {/* Where it sat when you woke, as a notch to read today against. */}
          {charged != null && width > 0 ? (
            <View style={[s.notch, { left: (Math.max(0, Math.min(100, charged)) / 100) * width - 2 }]} />
          ) : null}
        </View>

        <Text style={[s.value, { color: tone }]}>{level == null ? "—" : Math.round(level)}</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { marginBottom: 20 },
  label: {
    color: theme.muted, fontSize: 10, fontFamily: fonts.black, fontWeight: "900", letterSpacing: 1.4,
    textTransform: "uppercase", marginBottom: 10,
  },
  // The reading sits at the end of the meter rather than floating above it, so
  // the eye lands on the number where the bar stops.
  meter: { flexDirection: "row", alignItems: "center", gap: 12 },
  value: { fontSize: 22, fontFamily: fonts.black, fontWeight: "900", letterSpacing: -0.6, minWidth: 34, textAlign: "right" },
  track: { flex: 1, height: 10, borderRadius: 5, backgroundColor: theme.line, overflow: "hidden", justifyContent: "center" },
  fillWrap: { height: 10, borderRadius: 5, overflow: "hidden" },
  notch: { position: "absolute", top: 0, bottom: 0, width: 2, backgroundColor: theme.lineStrong, zIndex: 2 },
});
