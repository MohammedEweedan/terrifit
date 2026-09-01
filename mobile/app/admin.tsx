import { useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { updateAdminOrder, type AdminOrder } from "@/api";
import { useAppState } from "@/app-state";
import { useAdminOrders, useAdminOverview } from "@/data";
import { useSession } from "@/session";
import { display, theme } from "@/theme";

const money = (cents: number) => `$${(cents / 100).toFixed(2)}`;

/**
 * The console, on a phone.
 *
 * Not a copy of the web one — this is the half that gets used away from a
 * desk: how the business is doing, and moving orders along. Anything that
 * changes somebody's account stays on the website, where there is room to
 * show what you are about to do.
 */
export default function AdminScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { token } = useSession();
  const { profile } = useAppState();
  const overview = useAdminOverview();
  const orders = useAdminOrders();
  const [working, setWorking] = useState<string | null>(null);

  if (profile && !profile.user.isAdmin) {
    return (
      <View style={[s.page, s.centre, { paddingTop: insets.top + 40 }]}>
        <Text style={s.denied}>Staff only</Text>
        <Text style={s.deniedBody}>This account doesn&apos;t have console access.</Text>
        <Pressable onPress={() => router.back()} style={s.secondary}>
          <Text style={s.secondaryText}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  async function move(order: AdminOrder, body: Record<string, string>, label: string) {
    if (!token) return;
    setWorking(order.id);
    const result = await updateAdminOrder(token, order.id, body).catch(() => null);
    setWorking(null);
    if (!result) {
      Alert.alert("Couldn't update", "That order was not changed.");
      return;
    }
    orders.reload();
    overview.reload();
    Alert.alert(order.number, `${label}.`);
  }

  const data = overview.data;

  return (
    <View style={s.page}>
      <View style={[s.top, { paddingTop: insets.top + 10 }]}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Text style={s.back}>‹ Back</Text>
        </Pressable>
        <Text style={s.topTitle}>Console</Text>
        <View style={{ width: 46 }} />
      </View>

      <ScrollView
        contentContainerStyle={[s.content, { paddingBottom: insets.bottom + 40 }]}
        refreshControl={undefined}
      >
        {overview.loading && !data ? <ActivityIndicator color={theme.accent} style={{ marginTop: 40 }} /> : null}

        {data ? (
          <View style={s.grid}>
            <Stat label="Members" value={String(data.members.total)} note={`${data.members.newThisWeek} this week`} />
            <Stat label="Pro" value={String(data.members.pro)} note="Paying members" />
            <Stat label="Waitlist" value={String(data.waitlist)} note="Pre-launch" />
            <Stat label="Orders" value={String(data.orders.total)} note={`${data.orders.thisWeek} this week`} />
            <Stat label="Revenue" value={money(data.orders.revenueCents)} note="Paid only" />
            <Stat label="Bands" value={String(data.devices)} note="V1 paired" />
          </View>
        ) : null}

        <Text style={s.section}>Orders</Text>
        {(orders.data?.orders ?? []).length === 0 && !orders.loading ? (
          <Text style={s.note}>No orders yet.</Text>
        ) : null}

        {(orders.data?.orders ?? []).map((order) => (
          <View key={order.id} style={s.order}>
            <View style={s.orderTop}>
              <View style={s.flex}>
                <View style={s.numberRow}>
                  <Text style={s.number}>{order.number}</Text>
                  {order.sandbox ? <Text style={s.testBadge}>TEST</Text> : null}
                </View>
                <Text style={s.customer}>
                  {order.name} · {order.email}
                </Text>
              </View>
              <Text style={s.total}>{money(order.totalCents)}</Text>
            </View>

            {order.items.map((item) => (
              <Text key={`${item.title}-${item.variantLabel ?? ""}`} style={s.item}>
                {item.quantity} × {item.title}
                {item.variantLabel ? ` · ${item.variantLabel}` : ""}
              </Text>
            ))}

            {order.address ? <Text style={s.address}>{order.address}</Text> : null}

            <View style={s.statuses}>
              <Pill label={order.paymentStatus} tone={order.paymentStatus === "paid" ? theme.good : order.paymentStatus === "refunded" ? theme.poor : theme.fair} />
              <Pill label={order.fulfillmentStatus} tone={order.fulfillmentStatus === "fulfilled" ? theme.good : theme.muted} />
              <Text style={s.placed}>{new Date(order.createdAt).toLocaleDateString()}</Text>
            </View>

            <View style={s.actions}>
              {order.paymentStatus !== "paid" ? (
                <Pressable
                  disabled={working === order.id}
                  onPress={() => void move(order, { paymentStatus: "paid" }, "Marked paid")}
                  style={s.action}
                >
                  <Text style={s.actionText}>Mark paid</Text>
                </Pressable>
              ) : null}
              {order.fulfillmentStatus !== "fulfilled" ? (
                <Pressable
                  disabled={working === order.id}
                  onPress={() => void move(order, { fulfillmentStatus: "fulfilled" }, "Marked shipped")}
                  style={s.action}
                >
                  <Text style={s.actionText}>Mark shipped</Text>
                </Pressable>
              ) : null}
            </View>
          </View>
        ))}

        <Text style={s.note}>
          Marking an order refunded is done on the website — it records a refund a human performed in the payment
          provider, and that deserves more room than a phone gives it.
        </Text>
      </ScrollView>
    </View>
  );
}

function Stat({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <View style={s.stat}>
      <Text style={s.statLabel}>{label}</Text>
      <Text style={s.statValue}>{value}</Text>
      <Text style={s.statNote}>{note}</Text>
    </View>
  );
}

function Pill({ label, tone }: { label: string; tone: string }) {
  return (
    <View style={[s.pill, { borderColor: tone }]}>
      <Text style={[s.pillText, { color: tone }]}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: theme.bg },
  flex: { flex: 1 },
  centre: { alignItems: "center", paddingHorizontal: 30 },
  top: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 18, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: theme.line },
  back: { color: theme.accent, fontSize: 14, fontWeight: "700", width: 46 },
  topTitle: { color: theme.ink, fontSize: 11, fontWeight: "900", letterSpacing: 1.5, textTransform: "uppercase" },
  content: { paddingHorizontal: 18, paddingTop: 16 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  stat: { width: "31.5%", borderRadius: 16, borderWidth: 1, borderColor: theme.line, backgroundColor: theme.surface, padding: 12 },
  statLabel: { color: theme.muted, fontSize: 10, fontWeight: "900", letterSpacing: 1, textTransform: "uppercase" },
  statValue: { color: theme.ink, fontFamily: display, fontSize: 22, marginTop: 6 },
  statNote: { color: theme.muted, fontSize: 10, marginTop: 3 },
  section: { color: theme.accent, fontSize: 10, fontWeight: "900", letterSpacing: 1.5, textTransform: "uppercase", marginTop: 28, marginBottom: 12 },
  order: { borderRadius: 18, borderWidth: 1, borderColor: theme.line, backgroundColor: theme.surface, padding: 15, marginBottom: 12 },
  orderTop: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  numberRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  number: { color: theme.ink, fontSize: 15, fontWeight: "900", letterSpacing: 1 },
  testBadge: { color: theme.fair, fontSize: 10, fontWeight: "900", borderWidth: 1, borderColor: theme.fair, borderRadius: 4, paddingHorizontal: 5, paddingVertical: 1, overflow: "hidden" },
  customer: { color: theme.muted, fontSize: 11, marginTop: 4 },
  total: { color: theme.ink, fontFamily: display, fontSize: 20 },
  item: { color: theme.ink2, fontSize: 12, marginTop: 8 },
  address: { color: theme.muted, fontSize: 11, marginTop: 8 },
  statuses: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 12 },
  pill: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 4 },
  pillText: { fontSize: 10, fontWeight: "900", textTransform: "uppercase" },
  placed: { color: theme.muted, fontSize: 10, marginLeft: "auto" },
  actions: { flexDirection: "row", gap: 8, marginTop: 12 },
  action: { borderRadius: 999, borderWidth: 1, borderColor: theme.lineStrong, paddingHorizontal: 14, paddingVertical: 9 },
  actionText: { color: theme.ink, fontSize: 11, fontWeight: "800" },
  note: { color: theme.muted, fontSize: 11, lineHeight: 17, marginTop: 16 },
  denied: { color: theme.ink, fontFamily: display, fontSize: 30, textTransform: "uppercase" },
  deniedBody: { color: theme.ink2, fontSize: 14, textAlign: "center", marginTop: 10 },
  secondary: { height: 48, borderRadius: 24, borderWidth: 1, borderColor: theme.lineStrong, paddingHorizontal: 26, alignItems: "center", justifyContent: "center", marginTop: 22 },
  secondaryText: { color: theme.ink, fontSize: 11, fontWeight: "900", letterSpacing: 1, textTransform: "uppercase" },
});
