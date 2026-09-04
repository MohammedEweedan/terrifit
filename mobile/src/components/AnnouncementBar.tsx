import { useEffect, useRef, useState } from "react";
import { Animated, Easing, Pressable, StyleSheet, View } from "react-native";
import { Text } from "@/components/AppText";
import { useRouter } from "expo-router";
import Svg, { Path } from "react-native-svg";
import { useNotifications } from "@/data";
import { fonts, theme } from "@/theme";

/** How long a bar sits before it slides away on its own. */
const LINGER_MS = 12_000;

/** Pixels a second. Slow enough to read without chasing it. */
const SPEED = 34;

/** The gap between the two copies, which is also the seam width. */
const GAP = 48;

/**
 * A single line of news, directly under the header.
 *
 * The thinnest thing that can carry a notification without becoming a screen.
 * It shows the newest unread item and tickers it past — a phone is never wide
 * enough to hold a sentence, so unlike the web version there is no static case
 * to measure for. Tapping opens the full list; the cross dismisses it for this
 * session only, because a bar that stays dismissed forever stops working.
 *
 * It renders nothing when there is nothing unread, so it costs no vertical
 * space on an ordinary day. That is the only reason it can live above the fold.
 */
export function AnnouncementBar() {
  const router = useRouter();
  const notices = useNotifications();
  const [dismissed, setDismissed] = useState<string | null>(null);
  const [runWidth, setRunWidth] = useState(0);

  const latest = notices.data?.notifications?.find((item) => !item.read) ?? null;
  const showing = latest && latest.id !== dismissed ? latest : null;

  const reveal = useRef(new Animated.Value(0)).current;
  const scroll = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!showing) {
      reveal.setValue(0);
      return;
    }
    Animated.timing(reveal, {
      toValue: 1,
      duration: 260,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    // Slides away on its own. The badge on the bell keeps the count, so
    // nothing is lost by the bar leaving.
    const timer = setTimeout(() => setDismissed(showing.id), LINGER_MS);
    return () => clearTimeout(timer);
  }, [showing, reveal]);

  // The loop starts once the copy has been measured, and travels exactly one
  // copy's width so the duplicate lands where the original began — no seam.
  useEffect(() => {
    if (!showing || runWidth === 0) return;
    const distance = runWidth + GAP;
    scroll.setValue(0);
    const loop = Animated.loop(
      Animated.timing(scroll, {
        toValue: 1,
        duration: (distance / SPEED) * 1000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [showing, runWidth, scroll]);

  if (!showing) return null;

  const line = (measure: boolean) => (
    <View
      style={s.run}
      onLayout={measure ? (event) => setRunWidth(event.nativeEvent.layout.width) : undefined}
    >
      <View style={s.dot} />
      <Text numberOfLines={1} style={s.text}>
        <Text style={s.title}>{showing.title}</Text>
        {showing.body ? `  ${showing.body}` : ""}
      </Text>
    </View>
  );

  return (
    <Animated.View
      style={[
        s.wrap,
        {
          opacity: reveal,
          transform: [{ translateY: reveal.interpolate({ inputRange: [0, 1], outputRange: [-10, 0] }) }],
        },
      ]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${showing.title}. ${showing.body}`}
        onPress={() => {
          setDismissed(showing.id);
          router.push("/notifications" as never);
        }}
        style={s.bar}
      >
        <View style={s.viewport}>
          <Animated.View
            style={[
              s.track,
              {
                transform: [
                  {
                    translateX: scroll.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, -(runWidth + GAP)],
                    }),
                  },
                ],
              },
            ]}
          >
            {line(true)}
            {/* The second copy is what makes the loop seamless. Hidden from
                assistive tech — it is the same sentence twice. */}
            <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
              {line(false)}
            </View>
          </Animated.View>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Dismiss"
          hitSlop={12}
          onPress={() => setDismissed(showing.id)}
          style={s.close}
        >
          <Svg width={11} height={11} viewBox="0 0 24 24">
            <Path d="M5 5 19 19M19 5 5 19" stroke={theme.muted} strokeWidth={2.4} strokeLinecap="round" />
          </Svg>
        </Pressable>
      </Pressable>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  wrap: { paddingBottom: 8 },
  bar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    height: 30,
    paddingHorizontal: 11,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: theme.accentLine,
    backgroundColor: theme.accentSoft,
    overflow: "hidden",
  },
  // `minWidth: 0` is what lets a flex child clip rather than grow to its
  // content, which is the whole mechanism the ticker runs on.
  viewport: { flex: 1, minWidth: 0, overflow: "hidden" },
  track: { flexDirection: "row", alignItems: "center", gap: GAP },
  run: { flexDirection: "row", alignItems: "center", gap: 7 },
  dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: theme.accent },
  text: { color: theme.ink2, fontSize: 11.5, lineHeight: 15 },
  title: { color: theme.ink, fontFamily: fonts.black, fontWeight: "800" },
  close: { width: 16, height: 16, alignItems: "center", justifyContent: "center" },
});
