import { useRef, type ReactNode } from "react";
import { Animated, RefreshControl, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ScrollContext } from "@/scroll";
import { display, theme } from "@/theme";

type Props = {
  title: string;
  eyebrow?: string;
  refreshing?: boolean;
  onRefresh?: () => void;
  children: ReactNode;
  header?: ReactNode;
};

/**
 * The shared page frame: safe-area padding, the Anton title, pull-to-refresh.
 *
 * The header is pinned rather than scrolled away, so the brand mark stays put
 * directly under the camera housing on every phone. It sits on a solid ground
 * because content passing behind a transparent bar reads as a rendering fault,
 * and it grows a hairline once you have scrolled past it.
 */
export function Screen({ title, eyebrow, refreshing = false, onRefresh, children, header }: Props) {
  const insets = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;

  // Header row plus breathing room, so a screen with no title still clears it.
  const HEADER_HEIGHT = 74;
  const border = scrollY.interpolate({
    inputRange: [0, 40],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  return (
    <ScrollContext.Provider value={scrollY}>
      <View style={s.flex}>
        <Animated.ScrollView
          style={s.scroll}
          contentContainerStyle={[
            s.content,
            { paddingTop: insets.top + (header ? HEADER_HEIGHT : 16), paddingBottom: 120 },
          ]}
          scrollEventThrottle={16}
          onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
            useNativeDriver: true,
          })}
          refreshControl={
            onRefresh ? (
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={theme.accent}
                colors={[theme.accent]}
                progressViewOffset={insets.top + HEADER_HEIGHT}
              />
            ) : undefined
          }
        >
          {title || eyebrow ? (
            <View style={s.header}>
              {eyebrow ? <Text style={s.eyebrow}>{eyebrow}</Text> : null}
              {title ? <Text style={s.title}>{title}</Text> : null}
            </View>
          ) : null}
          {children}
        </Animated.ScrollView>

        {header ? (
          <View pointerEvents="box-none" style={[s.pinned, { paddingTop: insets.top }]}>
            <View style={s.pinnedInner}>{header}</View>
            <Animated.View style={[s.hairline, { opacity: border }]} />
          </View>
        ) : null}
      </View>
    </ScrollContext.Provider>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1, backgroundColor: theme.bg },
  scroll: { flex: 1, backgroundColor: theme.bg },
  content: { paddingHorizontal: 18 },
  pinned: { position: "absolute", top: 0, left: 0, right: 0, backgroundColor: theme.bg },
  pinnedInner: { paddingHorizontal: 18 },
  hairline: { height: 1, backgroundColor: theme.line },
  header: { marginBottom: 20 },
  eyebrow: { color: theme.accent, fontSize: 10, fontWeight: "800", letterSpacing: 2, textTransform: "uppercase" },
  title: {
    color: theme.ink,
    fontFamily: display,
    fontSize: 34,
    lineHeight: 42,
    textTransform: "uppercase",
    marginTop: 2,
    paddingTop: 5,
  },
});
