import { Pressable, StyleSheet, View } from "react-native";
import { Text } from "@/components/AppText";
import Svg, { Defs, Rect, Stop, LinearGradient as SvgGradient } from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { TabIcon, type TabName } from "./TabIcon";
import { useCart } from "@/cart";
import { usePreferences } from "@/preferences";
import { fonts, arabicBold, bodyBlack, scheme, theme } from "@/theme";

const visible: Record<string, { label: "home" | "maps" | "fuel" | "you" | "v1"; icon: TabName }> = {
  index: { label: "home", icon: "home" },
  maps: { label: "maps", icon: "maps" },
  band: { label: "v1", icon: "band" },
  shop: { label: "fuel", icon: "shop" },
  profile: { label: "you", icon: "profile" },
};

type TabRoute = { key: string; name: string; params?: object };
type TabBarProps = {
  state: { routes: TabRoute[]; index: number };
  descriptors: Record<string, { options: { tabBarAccessibilityLabel?: string } }>;
  navigation: {
    emit: (event: { type: string; target: string; canPreventDefault?: boolean }) => { defaultPrevented?: boolean };
    navigate: (name: string, params?: object) => void;
  };
};

/**
 * The floating tab bar.
 *
 * The softening under the bar is a gradient scrim, not a real blur.
 * `expo-blur` is a native module, so on any binary built before it was added it
 * renders as a red "Unimplemented component" box straight across the tab bar —
 * which is worse than no blur at all, and it would do the same to anyone
 * running an older build after an update. A gradient needs nothing native, so
 * it works on every build and cannot fail this way.
 */
export function PremiumTabBar(props: object) {
  const { state, descriptors, navigation } = props as TabBarProps;
  const { locale, t } = usePreferences();
  const insets = useSafeAreaInsets();
  const cart = useCart();
  const routes = state.routes.filter((route) => visible[route.name]);

  // The bar is orange in both themes, so the glyph on it flips instead.
  const bandGlyph = scheme === "dark" ? "#ffffff" : "#101114";

  return (
    <View pointerEvents="box-none" style={[s.frame, { paddingBottom: Math.max(insets.bottom - 6, 2) }]}>
      {/* Content fades out into the page under the bar rather than sliding
          under a hard edge. Sits behind the bar and never takes a tap. */}
      <View pointerEvents="none" style={[s.scrim, { height: 96 + Math.max(insets.bottom, 8) }]}>
        <Svg width="100%" height="100%">
          <Defs>
            <SvgGradient id="tabScrim" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor={theme.bg} stopOpacity={0} />
              <Stop offset="45%" stopColor={theme.bg} stopOpacity={0.72} />
              <Stop offset="100%" stopColor={theme.bg} stopOpacity={1} />
            </SvgGradient>
          </Defs>
          <Rect x={0} y={0} width="100%" height="100%" fill="url(#tabScrim)" />
        </Svg>
      </View>

      <View style={s.bar}>
        {routes.map((route) => {
          const index = state.routes.findIndex((item) => item.key === route.key);
          const focused = state.index === index;
          const isBand = route.name === "band";
          const isShop = route.name === "shop";
          const item = visible[route.name];
          const options = descriptors[route.key].options;
          const label = item.label === "v1" ? "V1" : t(item.label);

          function go() {
            const event = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
            if (!focused && !event.defaultPrevented) navigation.navigate(route.name, route.params);
          }

          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={focused ? { selected: true } : {}}
              accessibilityLabel={
                isShop && cart.count > 0
                  ? `${options.tabBarAccessibilityLabel ?? label}, ${cart.count} in your bag`
                  : options.tabBarAccessibilityLabel ?? label
              }
              onPress={go}
              onLongPress={() => navigation.emit({ type: "tabLongPress", target: route.key })}
              style={s.item}
            >
              <View style={[s.iconBox, focused && !isBand && s.iconBoxOn, isBand && s.bandBox]}>
                <TabIcon
                  name={item.icon}
                  size={isBand ? 27 : 22}
                  colour={isBand ? bandGlyph : focused ? theme.accent : theme.muted}
                />

                {/* How many things are waiting in the bag, over the glyph. */}
                {isShop && cart.count > 0 ? (
                  <View style={s.badge}>
                    <Text style={s.badgeText}>{cart.count > 9 ? "9+" : cart.count}</Text>
                  </View>
                ) : null}
              </View>

              {/* V1 carries no caption: the filled orange tile is the label. */}
              {isBand ? null : (
                <Text numberOfLines={1} style={[s.label, { fontFamily: locale === "ar" ? arabicBold : bodyBlack }, focused && s.labelOn]}>
                  {label}
                </Text>
              )}
              {focused && !isBand ? <View style={s.dot} /> : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  frame: { position: "absolute", left: 12, right: 12, bottom: 0 },
  scrim: { position: "absolute", left: -12, right: -12, bottom: 0 },
  bar: {
    height: 72,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: theme.accentLine,
    backgroundColor: theme.surface,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 7,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 18,
  },
  item: { flex: 1, height: 64, alignItems: "center", justifyContent: "center", gap: 3 },
  iconBox: { width: 38, height: 34, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  iconBoxOn: { backgroundColor: theme.accentSoft },
  // Always filled, whether or not it is the current tab — V1 is the product,
  // not one of five equal destinations.
  bandBox: {
    width: 54,
    height: 48,
    borderRadius: 18,
    backgroundColor: theme.accent,
    shadowColor: theme.accent,
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  label: { color: theme.muted, fontSize: 10, fontFamily: fonts.black, fontWeight: "900", letterSpacing: 0.5, textTransform: "uppercase" },
  labelOn: { color: theme.accent },
  dot: { position: "absolute", bottom: 2, width: 3, height: 3, borderRadius: 2, backgroundColor: theme.accent },
  badge: {
    position: "absolute",
    top: -3,
    right: 1,
    minWidth: 17,
    height: 17,
    borderRadius: 9,
    paddingHorizontal: 4,
    backgroundColor: theme.accent,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: theme.surface,
  },
  badgeText: { color: "#fff", fontSize: 10, fontFamily: fonts.black, fontWeight: "900" },
});
