import { Linking, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Text } from "@/components/AppText";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import { ModalHeader } from "@/components/ModalHeader";
import { TerrifitSpinner } from "@/components/TerrifitSpinner";
import { useOrders } from "@/data";
import { fonts, display, theme } from "@/theme";
import type { TrackedOrder } from "@/api";
import { usePreferences } from "@/preferences";

/** The journey, in the order it happens. */
const STEPS = [
  { key: "pending", label: "Order placed", body: "We have it and payment is confirmed." },
  { key: "packed", label: "Packed", body: "Boxed and waiting for the carrier." },
  { key: "shipped", label: "On its way", body: "With the carrier and moving." },
  { key: "delivered", label: "Delivered", body: "It arrived." },
] as const;

const INDEX: Record<string, number> = { pending: 0, packed: 1, shipped: 2, delivered: 3 };

/** Nothing more will happen to an order in one of these states. */
const FINISHED = new Set(["delivered", "cancelled"]);

/**
 * Where your orders are.
 *
 * A timeline rather than a status word: the interesting question is not "what
 * state is it in" but "how far along is it and what happens next", and a
 * vertical run of steps answers both without anybody reading a legend.
 */
export default function OrdersScreen() {
  const insets = useSafeAreaInsets();
  const orders = useOrders();

  // Delivered and cancelled are finished; everything else is still moving.
  const all = orders.data?.orders ?? [];
  const inFlight = all.filter((order) => !FINISHED.has(order.fulfillmentStatus));
  const past = all.filter((order) => FINISHED.has(order.fulfillmentStatus));

  return (
    <View style={s.page}>
      <ModalHeader title="Your orders" />

      <ScrollView
        contentContainerStyle={[s.content, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {orders.loading && !orders.data ? <TerrifitSpinner style={{ marginTop: 60, alignSelf: "center" }} /> : null}

        {orders.data?.orders.length === 0 ? (
          <View style={s.empty}>
            <Text style={s.emptyTitle}>No orders yet</Text>
            <Text style={s.emptyBody}>Orders show up here the moment you place one, with tracking as it moves, and stay here afterwards.</Text>
          </View>
        ) : null}

        {/* Split rather than one long list. Somebody opening this screen is
            almost always asking about a parcel that has not arrived; a
            delivered order from March sitting above it buries the answer.
            Everything is still on the page, which is what makes it history. */}
        {inFlight.length > 0 ? (
          <>
            <Text style={s.groupHead}>On the way</Text>
            {inFlight.map((order) => <OrderCard key={order.number} order={order} />)}
          </>
        ) : null}

        {past.length > 0 ? (
          <>
            <Text style={s.groupHead}>Past orders</Text>
            {past.map((order) => <OrderCard key={order.number} order={order} />)}
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}

function OrderCard({ order }: { order: TrackedOrder }) {
  const preferences = usePreferences();
  const cancelled = order.fulfillmentStatus === "cancelled";
  const reached = INDEX[order.fulfillmentStatus] ?? 0;
  const stampFor = (key: string) =>
    key === "packed" ? order.packedAt : key === "shipped" ? order.shippedAt : key === "delivered" ? order.deliveredAt : order.placedAt;

  return (
    <View style={s.card}>
      <View style={s.head}>
        <View style={s.flex}>
          <Text style={s.number}>{order.number}</Text>
          <Text style={s.placed}>
            {new Date(order.placedAt).toLocaleDateString(undefined, { day: "numeric", month: "long" })}
            {" · "}
            {preferences.money(order.totalCents, order.currency)}
          </Text>
        </View>
        <Text style={[s.state, cancelled && s.stateOff]}>
          {cancelled ? "Cancelled" : STEPS[reached]?.label ?? "Order placed"}
        </Text>
      </View>

      {order.sandbox ? (
        <Text style={s.sandbox}>Recorded in test mode — nothing was charged.</Text>
      ) : null}

      {cancelled ? null : (
        <View style={s.timeline}>
          {STEPS.map((step, index) => {
            const done = index <= reached;
            const stamp = done ? stampFor(step.key) : null;
            return (
              <View key={step.key} style={s.step}>
                <View style={s.rail}>
                  <View style={[s.node, done && s.nodeOn]}>
                    {done ? <Text style={s.tick}>✓</Text> : null}
                  </View>
                  {index < STEPS.length - 1 ? <View style={[s.line, index < reached && s.lineOn]} /> : null}
                </View>

                <View style={s.stepText}>
                  <Text style={[s.stepLabel, done && s.stepLabelOn]}>{step.label}</Text>
                  <Text style={s.stepBody}>{step.body}</Text>
                  {stamp ? (
                    <Text style={s.stamp}>
                      {new Date(stamp).toLocaleDateString(undefined, { day: "numeric", month: "short" })}
                    </Text>
                  ) : null}
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* The link only appears once there is a real number behind it. */}
      {order.trackingUrl ? (
        <Pressable
          onPress={() => void Linking.openURL(order.trackingUrl as string).catch(() => {})}
          style={s.track}
        >
          <View style={s.flex}>
            <Text style={s.trackCarrier}>{order.carrier}</Text>
            <Text style={s.trackNumber}>{order.trackingNumber}</Text>
          </View>
          <Svg width={16} height={16} viewBox="0 0 24 24">
            <Path
              d="M14 4h6v6M20 4 9.5 14.5M18 14v5a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 19V7.5A1.5 1.5 0 0 1 5 6h5"
              stroke={theme.accent}
              strokeWidth={1.8}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </Pressable>
      ) : order.trackingNumber ? (
        <Text style={s.trackPlain}>Tracking: {order.trackingNumber}</Text>
      ) : null}

      <View style={s.lines}>
        {order.items.map((item) => (
          <Text key={`${item.slug}-${item.variant ?? ""}`} style={s.itemLine} numberOfLines={1}>
            {item.quantity} × {item.title}
            {item.variant ? ` · ${item.variant}` : ""}
          </Text>
        ))}
      </View>

      {order.shipsTo ? <Text style={s.shipsTo}>{order.shipsTo}</Text> : null}
    </View>
  );
}

const s = StyleSheet.create({
  groupHead: {
    color: theme.ink2, fontSize: 10, fontFamily: fonts.black, fontWeight: "900",
    letterSpacing: 1.6, textTransform: "uppercase", marginTop: 18, marginBottom: 10,
  },
  page: { flex: 1, backgroundColor: theme.bg },
  flex: { flex: 1 },
  content: { paddingHorizontal: 18, paddingTop: 16 },

  empty: { paddingVertical: 50, alignItems: "center" },
  emptyTitle: { color: theme.ink, fontSize: 17, fontFamily: fonts.black, fontWeight: "900" },
  emptyBody: { color: theme.muted, fontSize: 13, lineHeight: 19, textAlign: "center", marginTop: 9, maxWidth: 280 },

  card: {
    borderRadius: 22, borderWidth: 1, borderColor: theme.line,
    backgroundColor: theme.surface, padding: 18, marginBottom: 14,
  },
  head: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  number: { color: theme.ink, fontFamily: display, fontSize: 22 },
  placed: { color: theme.muted, fontSize: 12, marginTop: 4 },
  state: { color: theme.accent, fontSize: 10, fontFamily: fonts.black, fontWeight: "900", letterSpacing: 1, textTransform: "uppercase" },
  stateOff: { color: theme.muted },
  sandbox: { color: theme.fair, fontSize: 11, lineHeight: 16, marginTop: 10 },

  timeline: { marginTop: 20 },
  step: { flexDirection: "row", gap: 14 },
  rail: { alignItems: "center", width: 22 },
  node: {
    width: 22, height: 22, borderRadius: 11, borderWidth: 2,
    borderColor: theme.line, backgroundColor: theme.surface,
    alignItems: "center", justifyContent: "center",
  },
  nodeOn: { backgroundColor: theme.accent, borderColor: theme.accent },
  tick: { color: "#fff", fontSize: 11, fontFamily: fonts.black, fontWeight: "900" },
  line: { width: 2, flex: 1, minHeight: 26, backgroundColor: theme.line },
  lineOn: { backgroundColor: theme.accent },
  stepText: { flex: 1, paddingBottom: 18 },
  stepLabel: { color: theme.muted, fontSize: 14, fontFamily: fonts.black, fontWeight: "900" },
  stepLabelOn: { color: theme.ink },
  stepBody: { color: theme.muted, fontSize: 12, lineHeight: 17, marginTop: 3 },
  stamp: { color: theme.accent, fontSize: 11, fontFamily: fonts.black, fontWeight: "800", marginTop: 5 },

  track: {
    flexDirection: "row", alignItems: "center", gap: 12,
    borderRadius: 16, borderWidth: 1, borderColor: theme.accent,
    backgroundColor: theme.accentSoft, paddingHorizontal: 15, paddingVertical: 13, marginTop: 4,
  },
  trackCarrier: { color: theme.accent, fontSize: 10, fontFamily: fonts.black, fontWeight: "900", letterSpacing: 1.1, textTransform: "uppercase" },
  trackNumber: { color: theme.ink, fontSize: 14, fontFamily: fonts.black, fontWeight: "800", marginTop: 4 },
  trackPlain: { color: theme.ink2, fontSize: 13, marginTop: 4 },

  lines: { marginTop: 16, gap: 5 },
  itemLine: { color: theme.ink2, fontSize: 13 },
  shipsTo: { color: theme.muted, fontSize: 11, lineHeight: 16, marginTop: 12 },
});
