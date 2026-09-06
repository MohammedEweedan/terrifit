import { useRef, type ReactNode } from "react";
import { Animated, RefreshControl, StyleSheet, View } from "react-native";
import { Text } from "@/components/AppText";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { TerrifitSpinner } from "./TerrifitSpinner";
import { ScrollContext } from "@/scroll";
import { AnnouncementBar } from "./AnnouncementBar";
import { usePreferences } from "@/preferences";
import { fonts, arabicBlack, bodyBlack, display, theme } from "@/theme";

type Props = {
  /**
   * Floating controls, drawn over the list rather than inside it.
   *
   * Anything absolutely positioned inside the ScrollView anchors to the scroll
   * content and travels with it; a floating action button placed there sinks
   * below the fold and hides behind the tab bar.
   */
  overlay?: ReactNode;
  title: string;
  eyebrow?: string;
  /** Sits on the title row, right-aligned. A cart, a filter, a history link. */
  titleAction?: React.ReactNode;
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
export function Screen({ title, eyebrow, titleAction, refreshing = false, onRefresh, children, header, overlay }: Props) {
  const insets = useSafeAreaInsets();
  const { locale } = usePreferences();
  const scrollY = useRef(new Animated.Value(0)).current;
  const arabic = locale === "ar";

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
                // The system indicator is hidden rather than removed:
                // RefreshControl owns the pull gesture and the rubber-banding,
                // and reimplementing those to change a spinner would be a bad
                // trade. Our mark is drawn over the space it leaves.
                tintColor="transparent"
                colors={["transparent"]}
                progressViewOffset={insets.top + HEADER_HEIGHT}
              />
            ) : undefined
          }
        >
          {title || eyebrow ? (
            <View style={s.header}>
              <View style={s.headerText}>
                {eyebrow ? <Text style={[s.eyebrow, { fontFamily: arabic ? arabicBlack : bodyBlack, letterSpacing: arabic ? 0 : 2 }]}>{eyebrow}</Text> : null}
                {title ? <Text style={[s.title, { fontFamily: arabic ? arabicBlack : display, letterSpacing: arabic ? 0 : undefined }]}>{title}</Text> : null}
              </View>
              {titleAction}
            </View>
          ) : null}
          {children}
        </Animated.ScrollView>

        {overlay}

        {/* Sits where the system spinner would have been, and is driven by the
            pull itself: `contentOffset.y` goes negative as the list is dragged
            past the top, so the mark fades and grows in with the gesture and
            starts turning once the refresh actually fires. */}
        {onRefresh ? (
          <Animated.View
            pointerEvents="none"
            style={[
              s.refresh,
              {
                top: insets.top + HEADER_HEIGHT - 6,
                opacity: refreshing
                  ? 1
                  : scrollY.interpolate({ inputRange: [-70, -12, 0], outputRange: [1, 0, 0], extrapolate: "clamp" }),
                transform: [
                  {
                    scale: refreshing
                      ? 1
                      : scrollY.interpolate({ inputRange: [-70, -12], outputRange: [1, 0.6], extrapolate: "clamp" }),
                  },
                ],
              },
            ]}
          >
            <TerrifitSpinner size={26} spinning={refreshing} />
          </Animated.View>
        ) : null}

        {header ? (
          <View pointerEvents="box-none" style={[s.pinned, { paddingTop: insets.top }]}>
            {/* The ground behind the header, not the header itself. At rest it
                is invisible, so the aurora at the top of the page bleeds up
                through it instead of stopping at a rectangle. It reaches full
                opacity by the time anything solid could scroll underneath. */}
            <Animated.View
              pointerEvents="none"
              style={[StyleSheet.absoluteFill, { backgroundColor: theme.bg, opacity: border }]}
            />
            <View style={s.pinnedInner}>
              {header}
              {/* One line of news under the mark. Renders nothing when there is
                  nothing unread, so it costs no height on an ordinary day. */}
              <AnnouncementBar />
            </View>
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
  pinned: { position: "absolute", top: 0, left: 0, right: 0 },
  pinnedInner: { paddingHorizontal: 18 },
  hairline: { height: 1, backgroundColor: theme.line },
  refresh: { position: "absolute", left: 0, right: 0, alignItems: "center" },
  header: { flexDirection: "row", alignItems: "flex-end", gap: 14, marginBottom: 20 },
  headerText: { flex: 1 },
  eyebrow: { color: theme.accent, fontSize: 10, fontFamily: fonts.black, fontWeight: "800", textTransform: "uppercase" },
  title: {
    color: theme.ink,
    fontSize: 34,
    lineHeight: 42,
    textTransform: "uppercase",
    marginTop: 2,
    paddingTop: 5,
  },
});
