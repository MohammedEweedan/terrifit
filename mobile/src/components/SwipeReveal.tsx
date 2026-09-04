import { useEffect, useMemo, useRef } from "react";
import { Animated, Easing, PanResponder, StyleSheet, View } from "react-native";
import { Text } from "@/components/AppText";
import { fonts, theme } from "@/theme";

/** How far a drag has to travel before it counts as a swipe. */
const THRESHOLD = 44;
/** How long the hint stays up on open. */
const HINT_MS = 2600;

/**
 * Swipe across to show or hide what is inside.
 *
 * A toggle for something you set once and then forget, so it should not sit
 * permanently beside the thing it governs collecting glances. A swipe leaves
 * nothing on screen; a hint appears once when the modal opens, says which way
 * to go, and fades out.
 *
 * `PanResponder` rather than the gesture library: this is a single horizontal
 * drag with no competing gestures, and it keeps the component free of the
 * reanimated/worklets version pinning the rest of the app is stuck on.
 */
export function SwipeReveal({
  revealed,
  onChange,
  children,
  hidden,
}: {
  revealed: boolean;
  onChange: (next: boolean) => void;
  children: React.ReactNode;
  /** Stands in for the content when hidden. */
  hidden: React.ReactNode;
}) {
  const drag = useRef(new Animated.Value(0)).current;
  const hint = useRef(new Animated.Value(0)).current;

  // Read through a ref so the responder, created once, always sees the
  // current value instead of the one from its first render.
  const state = useRef(revealed);
  state.current = revealed;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(hint, { toValue: 1, duration: 320, delay: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.delay(HINT_MS),
      Animated.timing(hint, { toValue: 0, duration: 420, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, [hint]);

  const responder = useMemo(
    () =>
      PanResponder.create({
        // Only claim horizontal drags, so the sheet still scrolls vertically.
        onMoveShouldSetPanResponder: (_event, gesture) =>
          Math.abs(gesture.dx) > 8 && Math.abs(gesture.dx) > Math.abs(gesture.dy) * 1.5,
        onPanResponderMove: (_event, gesture) => drag.setValue(gesture.dx),
        onPanResponderRelease: (_event, gesture) => {
          const travelled = Math.abs(gesture.dx) > THRESHOLD;
          // Left hides, right reveals — and a swipe the wrong way for the
          // current state is a no-op rather than a confusing flip.
          if (travelled) {
            if (gesture.dx < 0 && state.current) onChange(false);
            if (gesture.dx > 0 && !state.current) onChange(true);
          }
          Animated.spring(drag, { toValue: 0, damping: 18, stiffness: 220, useNativeDriver: true }).start();
        },
      }),
    [drag, onChange],
  );

  return (
    <View style={s.wrap} {...responder.panHandlers}>
      <Animated.View style={{ transform: [{ translateX: drag.interpolate({ inputRange: [-120, 120], outputRange: [-24, 24], extrapolate: "clamp" }) }] }}>
        {revealed ? children : hidden}
      </Animated.View>

      <Animated.View pointerEvents="none" style={[s.hint, { opacity: hint }]}>
        <Text style={s.hintText}>{revealed ? "‹ Swipe to hide" : "Swipe to reveal ›"}</Text>
      </Animated.View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { alignSelf: "stretch", alignItems: "center", justifyContent: "center" },
  hint: { position: "absolute", bottom: -16 },
  hintText: { color: theme.muted, fontSize: 10, fontFamily: fonts.black, fontWeight: "900", letterSpacing: 1.2, textTransform: "uppercase" },
});
