import { useEffect, useRef, useState } from "react";
import { Animated, Easing, Modal, StyleSheet, View } from "react-native";
import Storage from "expo-sqlite/kv-store";
import { TerrifitMark } from "./TerrifitMark";
import { TRANSITION_KEY, theme } from "@/theme";

/** Long enough to read as deliberate, short enough not to feel like loading. */
export const COVER_FADE = 260;
const FADE_OUT = 420;

/**
 * The wipe that hides a palette change.
 *
 * Changing the theme or the accent has to reload the JS bundle — every screen
 * builds its StyleSheet when it is imported, so the palette is fixed for the
 * life of a bundle and the only honest way to change it is to load a new one.
 * Left alone that reads as the app crashing and coming back.
 *
 * So the swap is covered from both sides. The old bundle fades this in and
 * leaves a flag; the new bundle finds the flag, starts with the same cover
 * already opaque, and fades it out. The two halves are identical, so the
 * reload happens inside a wipe nobody sees the seam of.
 */
export function ThemeTransition() {
  const cover = useRef(new Animated.Value(0)).current;
  const mark = useRef(new Animated.Value(0)).current;
  const [active, setActive] = useState(() => {
    // Read synchronously: an async read would let one frame of the new palette
    // show before the cover mounted, which is the flash this exists to remove.
    try {
      return Storage.getItemSync(TRANSITION_KEY) === "1";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (!active) return;

    // Coming out of a reload: start covered, then reveal the new palette.
    cover.setValue(1);
    mark.setValue(1);
    void Storage.setItem(TRANSITION_KEY, "0").catch(() => {});

    Animated.sequence([
      Animated.delay(120),
      Animated.parallel([
        Animated.timing(mark, { toValue: 0, duration: 220, easing: Easing.in(Easing.quad), useNativeDriver: true }),
        Animated.timing(cover, { toValue: 0, duration: FADE_OUT, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]),
    ]).start(() => setActive(false));
  }, [active, cover, mark]);

  if (!active) return null;

  return (
    <Animated.View pointerEvents="none" style={[s.cover, { opacity: cover }]}>
      <Animated.View
        style={{
          opacity: mark,
          transform: [{ scale: mark.interpolate({ inputRange: [0, 1], outputRange: [1.25, 1] }) }],
        }}
      >
        <TerrifitMark size={44} />
      </Animated.View>
    </Animated.View>
  );
}

/**
 * The other half: fades a cover in over the *current* palette while the setter
 * runs behind it.
 *
 * Purely presentational, deliberately. An earlier version drove the setter
 * from this animation's completion callback, which meant that when the cover
 * stopped being rendered the theme silently stopped changing at all — a
 * presentation bug that disabled the feature. Now the caller runs the setter
 * itself and this only hides the reload, so the worst a bug here can do is
 * make the swap look abrupt.
 */
export function SwapCover({
  /** The palette being moved to. Defaults to the current one, which is right
   *  for an accent change — only light and dark move the background. */
  background = theme.bg,
}: {
  background?: string;
}) {
  const cover = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(cover, {
      toValue: 1,
      duration: COVER_FADE,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [cover]);

  return (
    // In a Modal because the cover has to hide the tab bar and the header too,
    // and neither is inside the screen that renders this. Left as a plain
    // absolutely-positioned view it covered the scroll content only, so the
    // chrome around it sat there in the old palette until the reload landed —
    // which is the flicker this whole mechanism exists to remove.
    <Modal transparent statusBarTranslucent animationType="none" visible onRequestClose={() => {}}>
      {/* Swallows taps: the bundle is about to go away, and a second tap on a
          control underneath would queue a reload the app never comes back to. */}
      <Animated.View pointerEvents="auto" style={[s.cover, { backgroundColor: background, opacity: cover }]}>
        <TerrifitMark size={44} />
      </Animated.View>
    </Modal>
  );
}

const s = StyleSheet.create({
  cover: {
    position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: theme.bg,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
  },
});
