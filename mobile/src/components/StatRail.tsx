import { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Easing, PanResponder, Pressable, StyleSheet, View } from "react-native";
import { Text } from "@/components/AppText";
import { useRouter } from "expo-router";
import { AnimatedNumber } from "./AnimatedNumber";
import { ProBadge } from "./ProBadge";
import { fonts, theme } from "@/theme";
import { PRO_STATS, useStatPreferences, type Stat, type StatId } from "@/stats";
import { usePreferences } from "@/preferences";

/** Two per row, with the gap taken out of the width rather than the padding. */
const COLUMNS = 2;
/** Roughly a tile plus its gap. Used to turn a drag into a target index. */
const CELL_HEIGHT = 142;

/**
 * Every metric you have chosen, in two columns.
 *
 * Reordering is a long press and a drag, the way icons move on a home screen.
 * It replaced a pair of arrows on every tile: those cost two permanent controls
 * on each card to do something people touch once, and they could only ever swap
 * with a neighbour.
 */
export function StatRail({ stats }: { stats: Stat[] }) {
  const router = useRouter();
  const { order, hidden, reorder } = useStatPreferences();
  const { t } = usePreferences();
  const [dragging, setDragging] = useState<StatId | null>(null);

  if (stats.length === 0) return null;

  /** Where a tile ends up, from how far it was dragged. */
  function drop(id: StatId, dx: number, dy: number) {
    const from = stats.findIndex((stat) => stat.id === id);
    if (from < 0) return;

    const across = Math.round(dx / 180);
    const down = Math.round(dy / CELL_HEIGHT);
    const to = Math.max(0, Math.min(stats.length - 1, from + across + down * COLUMNS));
    if (to === from) return;

    // The visible list is the member's order minus what is switched off, so a
    // move is applied to the full order rather than the filtered view.
    const visible = stats.map((stat) => stat.id);
    const next = [...visible];
    next.splice(to, 0, next.splice(from, 1)[0]);
    reorder([...next, ...order.filter((item) => hidden.includes(item))]);
  }

  return (
    <View style={s.wrap}>
      <View style={s.grid}>
        {stats.map((stat, index) => (
          <StatRow
            key={stat.id}
            stat={stat}
            index={index}
            dragging={dragging === stat.id}
            dimmed={dragging != null && dragging !== stat.id}
            onPickUp={() => setDragging(stat.id)}
            onDrop={(dx, dy) => {
              setDragging(null);
              drop(stat.id, dx, dy);
            }}
            onPress={() => router.push(`/metric/${stat.id}` as never)}
          />
        ))}
      </View>

      <Text style={s.hint}>
        {dragging ? t("dropIt") : t("holdToMove")}
      </Text>

      <Pressable
        accessibilityLabel="Choose which metrics show"
        onPress={() => router.push("/customise-stats" as never)}
        style={s.customise}
      >
        <Text style={s.customiseText}>{t("customise")}</Text>
        <Text style={s.customiseArrow}>›</Text>
      </Pressable>
    </View>
  );
}

function StatRow({
  stat, index, dragging, dimmed, onPickUp, onDrop, onPress,
}: {
  stat: Stat;
  index: number;
  dragging: boolean;
  dimmed: boolean;
  onPickUp: () => void;
  onDrop: (dx: number, dy: number) => void;
  onPress: () => void;
}) {
  const bar = useRef(new Animated.Value(0)).current;
  const enter = useRef(new Animated.Value(0)).current;
  const move = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const lift = useRef(new Animated.Value(0)).current;
  const isPro = PRO_STATS.includes(stat.id);

  // The responder is built once, so the current pick-up state is read via refs.
  const held = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    Animated.timing(enter, {
      toValue: 1, duration: 380, delay: 120 + index * 55,
      easing: Easing.out(Easing.cubic), useNativeDriver: true,
    }).start();
    Animated.timing(bar, {
      toValue: stat.value == null ? 0 : stat.fill,
      duration: 700, delay: 180 + index * 55,
      easing: Easing.out(Easing.cubic), useNativeDriver: false,
    }).start();
  }, [bar, enter, stat.value, stat.fill, index]);

  const responder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onPanResponderGrant: () => {
          // Long press, not a drag threshold: the grid sits in a scroll view,
          // and claiming a downward drag immediately would break scrolling.
          timer.current = setTimeout(() => {
            held.current = true;
            onPickUp();
            // A short haptic-shaped pop: the tile lifts and the grid dims, so
            // the pick-up is felt rather than guessed at.
            Animated.spring(lift, {
              toValue: 1, damping: 12, stiffness: 320, mass: 0.7, useNativeDriver: true,
            }).start();
          }, 240);
        },
        onPanResponderMove: (_event, gesture) => {
          if (!held.current) {
            // Moved before the hold landed — treat it as a scroll and let go.
            if (Math.abs(gesture.dy) > 6 || Math.abs(gesture.dx) > 6) {
              if (timer.current) clearTimeout(timer.current);
            }
            return;
          }
          move.setValue({ x: gesture.dx, y: gesture.dy });
        },
        onPanResponderTerminationRequest: () => !held.current,
        onPanResponderRelease: (_event, gesture) => {
          if (timer.current) clearTimeout(timer.current);
          if (!held.current) {
            // A tap: no hold, no travel.
            if (Math.abs(gesture.dx) < 6 && Math.abs(gesture.dy) < 6) onPress();
            return;
          }
          held.current = false;
          onDrop(gesture.dx, gesture.dy);
          // Settles rather than snaps: the tile has already moved in the list
          // underneath, so this is the last few pixels of travel.
          Animated.parallel([
            Animated.spring(move, {
              toValue: { x: 0, y: 0 }, damping: 22, stiffness: 300, mass: 0.8, useNativeDriver: true,
            }),
            Animated.spring(lift, {
              toValue: 0, damping: 20, stiffness: 300, mass: 0.8, useNativeDriver: true,
            }),
          ]).start();
        },
      }),
    // The callbacks are recreated each render but read through the closure only
    // at gesture time, which is after any re-render that changed them.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [move, lift],
  );

  return (
    <Animated.View
      {...responder.panHandlers}
      style={[
        s.cell,
        dragging && s.cellDragging,
        {
          opacity: dimmed ? 0.4 : enter,
          transform: [
            { translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) },
            { translateX: move.x },
            { translateY: move.y },
            { scale: lift.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] }) },
            { rotate: lift.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "-1.5deg"] }) },
          ],
        },
      ]}
    >
      <View style={[s.row, isPro && s.rowPro, dragging && s.rowDragging]}>
        {isPro ? (
          <View style={s.proPill}>
            <ProBadge />
          </View>
        ) : null}

        <Text style={s.label} numberOfLines={1}>{stat.label}</Text>
        <AnimatedNumber value={stat.value} format={stat.format} delay={180 + index * 55} style={s.value} />

        <View style={s.track}>
          <Animated.View
            style={[
              s.fill,
              {
                backgroundColor: stat.tone,
                width: bar.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] }),
              },
            ]}
          />
        </View>
      </View>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  wrap: { borderTopWidth: 1, borderTopColor: theme.line, paddingTop: 4 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  cell: { width: "48.4%" },
  // Lifted above its neighbours while held.
  cellDragging: { zIndex: 10, elevation: 10 },
  // Everything else steps back so the held tile is unmistakably the one moving.
  cellDimmed: { opacity: 0.4 },
  row: {
    paddingVertical: 18, paddingHorizontal: 14, borderRadius: 18,
    borderWidth: 1, borderColor: theme.line, backgroundColor: theme.surface,
    minHeight: 118, alignItems: "center", justifyContent: "center",
  },
  rowPro: { borderColor: theme.accent },
  rowDragging: {
    borderColor: theme.accent,
    shadowColor: "#000", shadowOpacity: 0.35, shadowRadius: 18, shadowOffset: { width: 0, height: 10 },
  },
  proPill: { position: "absolute", top: 9, right: 9, zIndex: 2 },
  label: { color: theme.muted, fontSize: 10, fontFamily: fonts.black, fontWeight: "900", letterSpacing: 1.2, textTransform: "uppercase", textAlign: "center" },
  value: { color: theme.ink, fontSize: 26, fontFamily: fonts.black, fontWeight: "900", letterSpacing: -0.8, textAlign: "center", marginTop: 8 },
  track: { alignSelf: "stretch", height: 3, borderRadius: 2, backgroundColor: theme.line, marginTop: 14, overflow: "hidden" },
  fill: { height: 3, borderRadius: 2 },
  hint: { color: theme.muted, fontSize: 10, textAlign: "center", marginTop: 14, letterSpacing: 0.4 },
  customise: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 14 },
  customiseText: { color: theme.ink2, fontSize: 11, fontFamily: fonts.black, fontWeight: "900", letterSpacing: 1.2, textTransform: "uppercase" },
  customiseArrow: { color: theme.ink2, fontSize: 16 },
});
