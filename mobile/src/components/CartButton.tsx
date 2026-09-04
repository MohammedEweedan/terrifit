import { Pressable, StyleSheet, View } from "react-native";
import { Text } from "@/components/AppText";
import Svg, { Circle, Path } from "react-native-svg";
import { useRouter } from "expo-router";
import { useCart } from "@/cart";
import { fonts, theme } from "@/theme";

/**
 * The bag, on the Fuel title row.
 *
 * A trolley rather than the tote used in the tab bar: this one is a place you
 * go, and the two read as different things at a glance instead of the same
 * icon appearing twice on one screen. Renders nothing when the bag is empty —
 * a permanent zero is noise.
 */
export function CartButton() {
  const router = useRouter();
  const cart = useCart();
  if (cart.count === 0) return null;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Your bag, ${cart.count} ${cart.count === 1 ? "item" : "items"}`}
      onPress={() => router.push("/cart" as never)}
      hitSlop={10}
      style={s.button}
    >
      <Svg width={22} height={22} viewBox="0 0 24 24">
        <Path
          d="M2.5 3h2.2l2.4 11.2a1.6 1.6 0 0 0 1.6 1.3h8.6a1.6 1.6 0 0 0 1.6-1.2L21 7H6"
          stroke={theme.accent}
          strokeWidth={1.8}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Circle cx={9.5} cy={20} r={1.5} fill={theme.accent} />
        <Circle cx={17.5} cy={20} r={1.5} fill={theme.accent} />
      </Svg>

      <View style={s.count}>
        <Text style={s.countText}>{cart.count > 9 ? "9+" : cart.count}</Text>
      </View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  button: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 1,
    borderColor: theme.accent,
    backgroundColor: theme.accentSoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  count: {
    position: "absolute",
    top: -4,
    right: -4,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 5,
    backgroundColor: theme.accent,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: theme.bg,
  },
  countText: { color: "#fff", fontSize: 11, fontFamily: fonts.black, fontWeight: "900" },
});
