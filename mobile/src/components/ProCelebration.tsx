import { useEffect, useMemo, useRef } from "react";
import { Animated, Easing, Modal, Pressable, StyleSheet, useWindowDimensions, View } from "react-native";
import { Text } from "@/components/AppText";
import Svg, { Circle, Defs, RadialGradient, Stop } from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { TerrifitMark } from "./TerrifitMark";
import { fonts, display, theme } from "@/theme";

/** How many sparks fly out of the mark. Enough to read as a burst, not a mess. */
const SPARKS = 22;

/**
 * The moment somebody becomes Pro.
 *
 * A modal over whatever they were looking at, not a screen replacement — the
 * point is that something *happened* to the app they were already in. The mark
 * throws a burst, the ring draws, the wordmark rises, PRO lands under it.
 *
 * Every animated property is opacity or transform so the whole thing runs on
 * the native driver: `width` and colour interpolation would drop it back onto
 * the JS thread, and a stuttering celebration is worse than none.
 */
export function ProCelebration({
  visible,
  yearly,
  onDone,
}: {
  visible: boolean;
  yearly: boolean;
  onDone: () => void;
}) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const burst = useRef(new Animated.Value(0)).current;
  const ring = useRef(new Animated.Value(0)).current;
  const rise = useRef(new Animated.Value(0)).current;
  const pro = useRef(new Animated.Value(0)).current;
  const body = useRef(new Animated.Value(0)).current;
  const glow = useRef(new Animated.Value(0)).current;

  // Fixed per mount so the sparks do not re-scatter on every render.
  const sparks = useMemo(
    () =>
      Array.from({ length: SPARKS }, (_, index) => {
        const angle = (index / SPARKS) * Math.PI * 2 + Math.random() * 0.3;
        const distance = 90 + Math.random() * 90;
        return {
          x: Math.cos(angle) * distance,
          y: Math.sin(angle) * distance,
          size: 3 + Math.random() * 4,
          tone: index % 3 === 0 ? theme.ink : theme.accent,
          delay: Math.random() * 120,
        };
      }),
    [],
  );

  useEffect(() => {
    if (!visible) {
      burst.setValue(0); ring.setValue(0); rise.setValue(0);
      pro.setValue(0); body.setValue(0); glow.setValue(0);
      return;
    }

    Animated.parallel([
      Animated.timing(burst, { toValue: 1, duration: 1100, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.sequence([
        Animated.timing(ring, { toValue: 1, duration: 620, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.spring(rise, { toValue: 1, damping: 14, stiffness: 120, useNativeDriver: true }),
        Animated.timing(pro, { toValue: 1, duration: 380, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(body, { toValue: 1, duration: 400, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]),
    ]).start();

    const breathe = Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration: 2000, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(glow, { toValue: 0, duration: 2000, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]),
    );
    breathe.start();
    return () => breathe.stop();
  }, [visible, burst, ring, rise, pro, body, glow]);

  const size = 190;
  const radius = size / 2 - 6;
  const bloom = Math.min(width, 420);

  return (
    <Modal visible={visible} animationType="fade" transparent={false} onRequestClose={onDone}>
      <View style={[s.page, { paddingTop: insets.top + 50, paddingBottom: insets.bottom + 28 }]}>
        {/* The ambient wash behind everything, breathing on a slow loop. */}
        <Animated.View
          style={[
            s.bloom,
            {
              opacity: glow.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0.95] }),
              transform: [{ scale: glow.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1.06] }) }],
            },
          ]}
          pointerEvents="none"
        >
          <Svg width={bloom} height={bloom}>
            <Defs>
              <RadialGradient id="proBloom" cx="50%" cy="50%" r="50%">
                <Stop offset="0%" stopColor={theme.accent} stopOpacity={0.34} />
                <Stop offset="55%" stopColor={theme.accent} stopOpacity={0.1} />
                <Stop offset="100%" stopColor={theme.accent} stopOpacity={0} />
              </RadialGradient>
            </Defs>
            <Circle cx={bloom / 2} cy={bloom / 2} r={bloom / 2} fill="url(#proBloom)" />
          </Svg>
        </Animated.View>

        <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
          {sparks.map((spark, index) => (
            <Animated.View
              key={index}
              pointerEvents="none"
              style={[
                s.spark,
                {
                  width: spark.size,
                  height: spark.size,
                  borderRadius: spark.size / 2,
                  backgroundColor: spark.tone,
                  opacity: burst.interpolate({ inputRange: [0, 0.15, 0.7, 1], outputRange: [0, 1, 0.8, 0] }),
                  transform: [
                    { translateX: burst.interpolate({ inputRange: [0, 1], outputRange: [0, spark.x] }) },
                    { translateY: burst.interpolate({ inputRange: [0, 1], outputRange: [0, spark.y] }) },
                    { scale: burst.interpolate({ inputRange: [0, 0.4, 1], outputRange: [0.4, 1, 0.5] }) },
                  ],
                },
              ]}
            />
          ))}

          <Animated.View
            style={{
              opacity: ring,
              transform: [{ scale: ring.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] }) }],
            }}
          >
            <Svg width={size} height={size}>
              <Circle cx={size / 2} cy={size / 2} r={radius} stroke={theme.accent} strokeWidth={3} fill="none" />
              <Circle cx={size / 2} cy={size / 2} r={radius} stroke={theme.accent} strokeWidth={22} fill="none" opacity={0.1} />
            </Svg>
          </Animated.View>

          <Animated.View
            style={[
              s.mark,
              {
                opacity: rise,
                transform: [{ scale: rise.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }) }],
              },
            ]}
          >
            <TerrifitMark size={62} />
          </Animated.View>
        </View>

        <Animated.View
          style={{
            opacity: rise,
            transform: [{ translateY: rise.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
            alignItems: "center",
          }}
        >
          <Text style={s.word}>TERRIFIT</Text>
        </Animated.View>

        <Animated.View style={{ opacity: pro, alignItems: "center", marginTop: 4 }}>
          <Text style={s.pro}>PRO</Text>
        </Animated.View>

        <Animated.View
          style={{
            opacity: body,
            transform: [{ translateY: body.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }],
            alignItems: "center",
            paddingHorizontal: 30,
          }}
        >
          <Text style={s.title}>You&apos;re in.</Text>
          <Text style={s.body}>
            {yearly
              ? "Everything is unlocked. Your Terrifuel sample bundle can be chosen separately in the shop, including whey or isolate."
              : "Everything is unlocked. Sleep quality, load, body battery and the insights that read across all of it."}
          </Text>

          <View style={s.unlocked}>
            {["Body battery on Today", "Load and sleep quality", "T Score and heart rate", "Every insight, with the why"].map(
              (line) => (
                <View key={line} style={s.unlockedRow}>
                  <Text style={s.tick}>✓</Text>
                  <Text style={s.unlockedText}>{line}</Text>
                </View>
              ),
            )}
          </View>

          <Pressable onPress={onDone} style={s.button}>
            <Text style={s.buttonText}>Take a look</Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: theme.bg, alignItems: "center", justifyContent: "center" },
  bloom: { position: "absolute", alignItems: "center", justifyContent: "center" },
  spark: { position: "absolute" },
  mark: { position: "absolute" },
  word: { color: theme.ink, fontSize: 26, fontFamily: fonts.black, fontWeight: "900", letterSpacing: 5, marginTop: 22 },
  pro: { color: theme.accent, fontSize: 13, fontFamily: fonts.black, fontWeight: "900", letterSpacing: 8 },
  title: { color: theme.ink, fontFamily: display, fontSize: 38, textTransform: "uppercase", marginTop: 34 },
  body: { color: theme.ink2, fontSize: 14, lineHeight: 21, textAlign: "center", marginTop: 12 },
  unlocked: { alignSelf: "stretch", gap: 9, marginTop: 24 },
  unlockedRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  tick: { color: theme.accent, fontSize: 13, fontFamily: fonts.black, fontWeight: "900" },
  unlockedText: { color: theme.ink2, fontSize: 13 },
  button: {
    height: 52, borderRadius: 26, backgroundColor: theme.accent,
    alignItems: "center", justifyContent: "center", alignSelf: "stretch", marginTop: 30,
  },
  buttonText: { color: "#fff", fontSize: 12, fontFamily: fonts.black, fontWeight: "900", letterSpacing: 1, textTransform: "uppercase" },
});
