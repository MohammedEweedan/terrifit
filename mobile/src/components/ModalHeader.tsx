import { Platform, Pressable, StyleSheet, View } from "react-native";
import { Text } from "@/components/AppText";
import Svg, { Path } from "react-native-svg";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { usePreferences } from "@/preferences";
import { OrderTrackButton } from "./OrderTrackButton";
import { fonts, arabicBold, bodyBlack, theme } from "@/theme";

/**
 * The bar across the top of a modal.
 *
 * A modal sheet is presented *below* the status bar — iOS slides the card down
 * and the notch belongs to the page behind it — so adding the full safe-area
 * top inset here stacked a second gap on top of the first. That is where the
 * high lip above every modal title came from. On iOS the sheet needs a small
 * fixed pad; a full-screen presentation still needs the real inset, so the
 * platform decides rather than every screen guessing.
 *
 * The X is on the right because that is where a close control lives on a sheet.
 * `left` keeps whatever the screen already had there — a Back or Cancel — and
 * the title stays optically centred either way.
 */
export function ModalHeader({
  title,
  left,
  right,
  onClose,
  fullScreen = false,
}: {
  /** A string, or anything a screen wants in the middle — a lockup, a mark. */
  title: string | React.ReactNode;
  /**
   * Anything the screen wants on the left. A Reset, a Cancel, a Back.
   * With nothing passed, the left slot carries the order tracker, so an order
   * in flight is reachable from a sheet as well as from a tab.
   */
  left?: React.ReactNode;
  /** Replaces the close button when a screen needs its own action there. */
  right?: React.ReactNode;
  onClose?: () => void;
  fullScreen?: boolean;
}) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { locale } = usePreferences();

  const top = fullScreen || Platform.OS !== "ios" ? insets.top + 10 : 14;

  return (
    <View style={[s.bar, { paddingTop: top }]}>
      <View style={s.side}>{left ?? <OrderTrackButton />}</View>

      {typeof title === "string" ? (
        <Text numberOfLines={1} style={[s.title, { fontFamily: locale === "ar" ? arabicBold : bodyBlack, letterSpacing: locale === "ar" ? 0 : 1.5 }]}>
          {title}
        </Text>
      ) : (
        <View style={s.titleNode}>{title}</View>
      )}

      <View style={[s.side, s.right]}>
        {right ?? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close"
            hitSlop={12}
            onPress={onClose ?? (() => router.back())}
            style={s.close}
          >
            <Svg width={15} height={15} viewBox="0 0 24 24">
              <Path
                d="M5 5l14 14M19 5 5 19"
                stroke={theme.ink2}
                strokeWidth={2.2}
                strokeLinecap="round"
              />
            </Svg>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  bar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.line,
  },
  // Equal flanks so the title sits optically centred whatever is beside it.
  side: { minWidth: 64, flexDirection: "row", alignItems: "center" },
  right: { justifyContent: "flex-end" },
  title: {
    flex: 1,
    textAlign: "center",
    color: theme.ink,
    fontSize: 11,
    fontFamily: fonts.black, fontWeight: "900",
    textTransform: "uppercase",
  },
  titleNode: { flex: 1, alignItems: "center", justifyContent: "center" },
  close: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.raised,
  },
});
