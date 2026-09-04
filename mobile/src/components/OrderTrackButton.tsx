import { Pressable, StyleSheet, View } from "react-native";
import { Text } from "@/components/AppText";
import { useRouter } from "expo-router";
import Svg, { Path } from "react-native-svg";
import { useOrders } from "@/data";
import { usePreferences } from "@/preferences";
import { theme } from "@/theme";

/**
 * Anything in flight, one tap away, from wherever you are.
 *
 * It sits in the top-left of every screen that has a bar — tabs through
 * `AppHeader`, sheets and stack screens through `ModalHeader` — because an
 * order somebody is waiting on should never be something they have to go
 * looking for, and "where is my order" is the question a shop gets asked most.
 *
 * It renders nothing when there is nothing in flight, so it is never an empty
 * affordance on an account that has not bought anything.
 */
export function OrderTrackButton() {
  const router = useRouter();
  const orders = useOrders();
  const { t } = usePreferences();
  const active = orders.data?.active ?? 0;

  if (active <= 0) return null;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${active} ${t("orders")}`}
      onPress={() => router.push("/orders" as never)}
      style={s.button}
      hitSlop={8}
    >
      <Svg width={17} height={17} viewBox="0 0 24 24">
        <Path
          d="M3.5 7.5 12 3l8.5 4.5v9L12 21l-8.5-4.5v-9ZM3.5 7.5 12 12m0 9v-9m8.5-4.5L12 12"
          stroke={theme.accent}
          strokeWidth={1.7}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
      {active > 1 ? (
        <View style={s.count}>
          <Text style={s.countText}>{active > 9 ? "9+" : active}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const s = StyleSheet.create({
  button: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: theme.accent, backgroundColor: theme.accentSoft,
  },
  count: {
    position: "absolute", top: -2, right: -2, minWidth: 16, height: 16, borderRadius: 8,
    paddingHorizontal: 4, backgroundColor: theme.accent,
    alignItems: "center", justifyContent: "center", borderWidth: 1.5, borderColor: theme.bg,
  },
  countText: { color: "#fff", fontSize: 9, fontWeight: "900" },
});
