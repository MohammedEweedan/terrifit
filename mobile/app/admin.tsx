import { useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Text } from "@/components/AppText";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { updateAdminOrder, type AdminOrder, type AdminSalesMetric } from "@/api";
import { useAppState } from "@/app-state";
import { useAdminCatalog, useAdminOrders, useAdminOverview } from "@/data";
import { useSession } from "@/session";
import { fonts, display, theme } from "@/theme";
import { TerrifitSpinner } from "@/components/TerrifitSpinner";

type Tab = "overview" | "products" | "orders" | "revenue";

const tabs: Array<{ id: Tab; label: string }> = [
  { id: "overview", label: "Overview" },
  { id: "products", label: "Products" },
  { id: "orders", label: "Orders" },
  { id: "revenue", label: "Revenue" },
];

const money = (cents: number, currency = "USD") =>
  new Intl.NumberFormat("en", { style: "currency", currency }).format(cents / 100);

const salesRevenue = (metric: AdminSalesMetric) =>
  metric.revenue.length > 0
    ? metric.revenue.map((entry) => money(entry.cents, entry.currency)).join(" · ")
    : "No paid sales";

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
  const catalog = useAdminCatalog();
  const [working, setWorking] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("overview");

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
        {overview.loading && !data ? <TerrifitSpinner style={{ marginTop: 40 }} /> : null}

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.tabs}>
          {tabs.map((item) => (
            <Pressable key={item.id} onPress={() => setTab(item.id)} style={[s.tab, tab === item.id && s.tabOn]}>
              <Text style={[s.tabText, tab === item.id && s.tabTextOn]}>{item.label}</Text>
            </Pressable>
          ))}
        </ScrollView>

        {tab === "overview" && data ? (
          <>
            <View style={s.grid}>
              <Stat label="Total users" value={String(data.members.total)} note={`${data.members.newThisWeek} joined this week`} />
              <Stat label="Paying customers" value={String(data.members.payingCustomers)} note={`${data.members.pro} total Pro access`} />
              <Stat label="Pro trials" value={String(data.members.trialing)} note="Not counted as paying" />
              <Stat label="MRR" value={money(data.subscriptions.mrrCents)} note={`${data.subscriptions.monthly} monthly · ${data.subscriptions.yearly} annual`} />
              <Stat label="ARR" value={money(data.subscriptions.arrCents)} note="MRR × 12" />
              <Stat label="Paid orders" value={String(data.orders.paid)} note={`${data.orders.thisWeek} all orders this week`} />
            </View>
            <Text style={s.section}>Sales by business line</Text>
            <SalesCard title="Terrifuel" metric={data.sales.terrifuel} detail="Supplements and bundles" />
            <SalesCard title="V1 bands" metric={data.sales.band} detail={`${data.devices} devices paired`} />
            <SalesCard title="Accessories" metric={data.sales.accessories} detail="Straps, chargers and shakers" />
            <Text style={s.note}>Commercial KPIs exclude {data.orders.sandbox} test {data.orders.sandbox === 1 ? "order" : "orders"}.</Text>
          </>
        ) : null}

        {tab === "products" ? <>
          <View style={s.sectionHead}>
            <Text style={[s.section, s.sectionTight]}>Products & inventory</Text>
            <Pressable onPress={() => router.push({ pathname: "/admin-product", params: { slug: "new" } } as never)} style={s.addProduct}>
              <Text style={s.addProductText}>+ Product</Text>
            </Pressable>
          </View>
          {(catalog.data?.products ?? []).map((product) => {
          const stock = product.variants.length > 0
            ? product.variants.reduce((total, variant) => total + variant.stockQuantity, 0)
            : product.stockQuantity;
          return (
            <Pressable
              key={product.slug}
              onPress={() => router.push({ pathname: "/admin-product", params: { slug: product.slug } } as never)}
              style={[s.product, !product.active && s.productOff]}
            >
              <View style={s.flex}>
                <View style={s.productTitleRow}>
                  <Text style={s.productName}>{product.name}</Text>
                  {!product.active ? <Text style={s.draftBadge}>ARCHIVED</Text> : null}
                  {product.featured ? <Text style={s.featuredBadge}>FEATURED</Text> : null}
                </View>
                <Text style={s.productMeta}>{product.category} · {product.variants.length} variants · {product.slug}</Text>
              </View>
              <View style={s.stockBlock}><Text style={[s.stockValue, stock <= product.lowStockThreshold && { color: theme.fair }]}>{stock}</Text><Text style={s.stockLabel}>stock</Text></View>
              <Text style={s.arrow}>›</Text>
            </Pressable>
          );
          })}
          {catalog.loading && !catalog.data ? <TerrifitSpinner style={{ marginTop: 20 }} /> : null}
        </> : null}

        {tab === "orders" ? <>
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
              <Text style={s.total}>{money(order.totalCents, order.currency)}</Text>
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
        </> : null}

        {tab === "revenue" && data ? <>
          <Text style={s.section}>Payment metrics</Text>
          {data.payments.byCurrency.length === 0 ? <Text style={s.note}>No live paid or refunded orders yet.</Text> : null}
          {data.payments.byCurrency.map((bucket) => (
            <View key={bucket.currency} style={s.revenueCard}>
              <View style={s.revenueTop}><Text style={s.revenueName}>{bucket.currency}</Text><Text style={s.revenueNet}>{money(bucket.netCents, bucket.currency)} net</Text></View>
              <View style={s.revenueGrid}>
                <Mini label="Gross" value={money(bucket.grossCents, bucket.currency)} />
                <Mini label="Refunded" value={money(bucket.refundedCents, bucket.currency)} />
                <Mini label="Paid orders" value={String(bucket.paidOrders)} />
                <Mini label="AOV" value={money(bucket.averageOrderCents, bucket.currency)} />
              </View>
            </View>
          ))}
          <Text style={s.section}>Payment methods</Text>
          {data.payments.byMethod.map((method) => (
            <View key={method.method} style={s.metricRow}>
              <View style={s.flex}><Text style={s.productName}>{method.method}</Text><Text style={s.productMeta}>{method.revenue.map((item) => `${item.currency} ${money(item.netCents, item.currency)} net`).join(" · ") || "No captured payments"}</Text></View>
              <Text style={s.metricUnits}>{method.orders}</Text>
            </View>
          ))}
          <Text style={s.section}>Product performance</Text>
          {data.sales.products.length === 0 ? <Text style={s.note}>Product sales will appear after the first live paid order.</Text> : null}
          {data.sales.products.map((product) => (
            <View key={product.slug} style={s.metricRow}>
              <View style={s.flex}><Text style={s.productName}>{product.name}</Text><Text style={s.productMeta}>{product.brand} · {product.orders} orders · {salesRevenue(product)}</Text></View>
              <View style={s.stockBlock}><Text style={s.metricUnits}>{product.units}</Text><Text style={s.stockLabel}>units</Text></View>
            </View>
          ))}
          <Text style={s.note}>Gross, refunds and net stay in their original currencies; unlike a combined dollar total, these figures remain auditable.</Text>
        </> : null}
      </ScrollView>
    </View>
  );
}

function SalesCard({ title, metric, detail }: { title: string; metric: AdminSalesMetric; detail: string }) {
  return <View style={s.salesCard}><View style={s.flex}><Text style={s.salesTitle}>{title}</Text><Text style={s.productMeta}>{detail} · {metric.orders} paid orders</Text><Text style={s.salesRevenue}>{salesRevenue(metric)}</Text></View><View style={s.salesUnits}><Text style={s.statValue}>{metric.units}</Text><Text style={s.stockLabel}>units</Text></View></View>;
}

function Mini({ label, value }: { label: string; value: string }) {
  return <View style={s.mini}><Text style={s.statLabel}>{label}</Text><Text style={s.miniValue}>{value}</Text></View>;
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
  back: { color: theme.accent, fontSize: 14, fontFamily: fonts.bold, fontWeight: "700", width: 46 },
  topTitle: { color: theme.ink, fontSize: 11, fontFamily: fonts.black, fontWeight: "900", letterSpacing: 1.5, textTransform: "uppercase" },
  content: { paddingHorizontal: 18, paddingTop: 16 },
  tabs: { gap: 8, paddingBottom: 18 },
  tab: { height: 38, borderRadius: 19, borderWidth: 1, borderColor: theme.line, paddingHorizontal: 16, alignItems: "center", justifyContent: "center" },
  tabOn: { borderColor: theme.accent, backgroundColor: theme.accentSoft },
  tabText: { color: theme.muted, fontSize: 10, fontFamily: fonts.black, fontWeight: "900", letterSpacing: 0.7, textTransform: "uppercase" },
  tabTextOn: { color: theme.accent },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  stat: { width: "31.5%", borderRadius: 16, borderWidth: 1, borderColor: theme.line, backgroundColor: theme.surface, padding: 12 },
  statLabel: { color: theme.muted, fontSize: 10, fontFamily: fonts.black, fontWeight: "900", letterSpacing: 1, textTransform: "uppercase" },
  statValue: { color: theme.ink, fontFamily: display, fontSize: 22, marginTop: 6 },
  statNote: { color: theme.muted, fontSize: 10, marginTop: 3 },
  section: { color: theme.accent, fontSize: 10, fontFamily: fonts.black, fontWeight: "900", letterSpacing: 1.5, textTransform: "uppercase", marginTop: 28, marginBottom: 12 },
  sectionHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 28, marginBottom: 12 },
  sectionTight: { marginTop: 0, marginBottom: 0 },
  addProduct: { minHeight: 34, borderRadius: 17, borderWidth: 1, borderColor: theme.accent, paddingHorizontal: 13, alignItems: "center", justifyContent: "center" },
  addProductText: { color: theme.accent, fontSize: 10, fontFamily: fonts.black, fontWeight: "900", letterSpacing: 0.7, textTransform: "uppercase" },
  product: { minHeight: 76, flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 18, borderWidth: 1, borderColor: theme.line, backgroundColor: theme.surface, paddingHorizontal: 15, marginBottom: 9 },
  productOff: { opacity: 0.55 },
  productTitleRow: { flexDirection: "row", alignItems: "center", gap: 7 },
  productName: { color: theme.ink, fontSize: 14, fontFamily: fonts.black, fontWeight: "900" },
  productMeta: { color: theme.muted, fontSize: 10, marginTop: 5 },
  draftBadge: { color: theme.muted, borderWidth: 1, borderColor: theme.lineStrong, borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2, overflow: "hidden", fontSize: 8, fontFamily: fonts.black, fontWeight: "900" },
  featuredBadge: { color: theme.accent, borderWidth: 1, borderColor: theme.accent, borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2, overflow: "hidden", fontSize: 8, fontFamily: fonts.black, fontWeight: "900" },
  stockBlock: { alignItems: "center", minWidth: 44 },
  stockValue: { color: theme.ink, fontFamily: display, fontSize: 22 },
  stockLabel: { color: theme.muted, fontSize: 8, fontFamily: fonts.black, fontWeight: "800", textTransform: "uppercase" },
  arrow: { color: theme.muted, fontSize: 24 },
  salesCard: { minHeight: 92, flexDirection: "row", alignItems: "center", gap: 14, borderRadius: 18, borderWidth: 1, borderColor: theme.line, backgroundColor: theme.surface, padding: 15, marginBottom: 9 },
  salesTitle: { color: theme.ink, fontSize: 16, fontFamily: fonts.black, fontWeight: "900" },
  salesRevenue: { color: theme.accent, fontSize: 12, fontFamily: fonts.black, fontWeight: "800", marginTop: 8 },
  salesUnits: { minWidth: 54, alignItems: "center" },
  revenueCard: { borderRadius: 18, borderWidth: 1, borderColor: theme.line, backgroundColor: theme.surface, padding: 15, marginBottom: 10 },
  revenueTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 12 },
  revenueName: { color: theme.accent, fontSize: 13, fontFamily: fonts.black, fontWeight: "900", letterSpacing: 1 },
  revenueNet: { color: theme.ink, fontSize: 14, fontFamily: fonts.black, fontWeight: "900" },
  revenueGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 14 },
  mini: { width: "48%", borderRadius: 12, backgroundColor: theme.bg, padding: 10 },
  miniValue: { color: theme.ink, fontSize: 13, fontFamily: fonts.black, fontWeight: "800", marginTop: 5 },
  metricRow: { minHeight: 72, flexDirection: "row", alignItems: "center", gap: 12, borderBottomWidth: 1, borderBottomColor: theme.line, paddingVertical: 12 },
  metricUnits: { color: theme.ink, fontFamily: display, fontSize: 22 },
  order: { borderRadius: 18, borderWidth: 1, borderColor: theme.line, backgroundColor: theme.surface, padding: 15, marginBottom: 12 },
  orderTop: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  numberRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  number: { color: theme.ink, fontSize: 15, fontFamily: fonts.black, fontWeight: "900", letterSpacing: 1 },
  testBadge: { color: theme.fair, fontSize: 10, fontFamily: fonts.black, fontWeight: "900", borderWidth: 1, borderColor: theme.fair, borderRadius: 4, paddingHorizontal: 5, paddingVertical: 1, overflow: "hidden" },
  customer: { color: theme.muted, fontSize: 11, marginTop: 4 },
  total: { color: theme.ink, fontFamily: display, fontSize: 20 },
  item: { color: theme.ink2, fontSize: 12, marginTop: 8 },
  address: { color: theme.muted, fontSize: 11, marginTop: 8 },
  statuses: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 12 },
  pill: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 4 },
  pillText: { fontSize: 10, fontFamily: fonts.black, fontWeight: "900", textTransform: "uppercase" },
  placed: { color: theme.muted, fontSize: 10, marginLeft: "auto" },
  actions: { flexDirection: "row", gap: 8, marginTop: 12 },
  action: { borderRadius: 999, borderWidth: 1, borderColor: theme.lineStrong, paddingHorizontal: 14, paddingVertical: 9 },
  actionText: { color: theme.ink, fontSize: 11, fontFamily: fonts.black, fontWeight: "800" },
  note: { color: theme.muted, fontSize: 11, lineHeight: 17, marginTop: 16 },
  denied: { color: theme.ink, fontFamily: display, fontSize: 30, textTransform: "uppercase" },
  deniedBody: { color: theme.ink2, fontSize: 14, textAlign: "center", marginTop: 10 },
  secondary: { height: 48, borderRadius: 24, borderWidth: 1, borderColor: theme.lineStrong, paddingHorizontal: 26, alignItems: "center", justifyContent: "center", marginTop: 22 },
  secondaryText: { color: theme.ink, fontSize: 11, fontFamily: fonts.black, fontWeight: "900", letterSpacing: 1, textTransform: "uppercase" },
});
