import { prisma } from "@/lib/db";
import { PRICING } from "@/lib/health/plan";
import { listProducts } from "@/lib/shop/catalog-store";

type MoneyBucket = {
  currency: string;
  grossCents: number;
  refundedCents: number;
  netCents: number;
  paidOrders: number;
  refundedOrders: number;
  averageOrderCents: number;
};

type SalesMetric = {
  units: number;
  orders: number;
  revenue: Array<{ currency: string; cents: number }>;
};

function moneyBuckets(
  orders: Array<{ currency: string; totalCents: number; paymentStatus: string }>,
): MoneyBucket[] {
  const buckets = new Map<string, MoneyBucket>();
  for (const order of orders) {
    const currency = order.currency.toUpperCase();
    const bucket = buckets.get(currency) ?? {
      currency,
      grossCents: 0,
      refundedCents: 0,
      netCents: 0,
      paidOrders: 0,
      refundedOrders: 0,
      averageOrderCents: 0,
    };
    if (order.paymentStatus === "paid") {
      bucket.grossCents += order.totalCents;
      bucket.paidOrders += 1;
    } else if (order.paymentStatus === "refunded") {
      bucket.refundedCents += order.totalCents;
      bucket.refundedOrders += 1;
    }
    bucket.netCents = bucket.grossCents - bucket.refundedCents;
    bucket.averageOrderCents = bucket.paidOrders > 0 ? Math.round(bucket.grossCents / bucket.paidOrders) : 0;
    buckets.set(currency, bucket);
  }
  return [...buckets.values()].sort((a, b) => a.currency.localeCompare(b.currency));
}

function emptySalesMetric(): SalesMetric {
  return { units: 0, orders: 0, revenue: [] };
}

function addSale(
  metric: SalesMetric,
  orderId: string,
  currency: string,
  cents: number,
  units: number,
  orderIds: Set<string>,
) {
  metric.units += units;
  orderIds.add(orderId);
  metric.orders = orderIds.size;
  const existing = metric.revenue.find((entry) => entry.currency === currency);
  if (existing) existing.cents += cents;
  else metric.revenue.push({ currency, cents });
}

/**
 * The console's queries, in one place.
 *
 * The page renders them server-side — it is already dynamic and already behind
 * a staff check, so there is no reason to make the browser ask five times for
 * data the server can hand over with the HTML. The `/api/admin/*` routes use
 * the same functions, for anything that needs them over the wire.
 */
export async function adminOverview() {
  const weekAgo = new Date(Date.now() - 7 * 86_400_000);
  const [members, newMembers, pro, payingCustomers, trialing, byInterval, waitlist, orders, recentOrders, commercialOrders, posts, comments, bands, contact, imports, catalog] =
    await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { createdAt: { gte: weekAgo } } }),
      prisma.user.count({ where: { plan: "pro" } }),
      prisma.user.count({ where: { plan: "pro", stripeSubscriptionId: { not: null } } }),
      prisma.user.count({ where: { plan: "trial", trialEndsAt: { gt: new Date() } } }),
      prisma.user.groupBy({
        by: ["planInterval"],
        where: { plan: "pro", stripeSubscriptionId: { not: null } },
        _count: true,
      }),
      prisma.waitlistEntry.count(),
      prisma.order.count(),
      prisma.order.count({ where: { createdAt: { gte: weekAgo } } }),
      prisma.order.findMany({
        where: { sandbox: false, paymentStatus: { in: ["paid", "refunded"] } },
        select: {
          id: true,
          currency: true,
          totalCents: true,
          paymentStatus: true,
          paymentMethod: true,
          items: { select: { slug: true, title: true, unitCents: true, quantity: true } },
        },
      }),
      prisma.post.count(),
      prisma.comment.count(),
      prisma.bandDevice.count(),
      prisma.contactMessage.count(),
      prisma.healthImport.count(),
      listProducts({ includeInactive: true }),
    ]);

  // Recurring revenue, normalised to a month. A yearly plan is a twelfth of
  // its price here rather than the whole thing, because MRR that jumps by £39
  // on one signup and stays flat for a year is not a number you can steer by.
  const countFor = (interval: string) =>
    byInterval.find((row) => row.planInterval === interval)?._count ?? 0;
  const monthly = countFor("monthly");
  const yearly = countFor("yearly");
  const mrrCents = monthly * PRICING.monthly.cents + Math.round((yearly * PRICING.yearly.cents) / 12);

  const productBySlug = new Map(catalog.map((product) => [product.slug, product]));
  const sales = {
    terrifuel: emptySalesMetric(),
    band: emptySalesMetric(),
    accessories: emptySalesMetric(),
  };
  const orderSets = {
    terrifuel: new Set<string>(),
    band: new Set<string>(),
    accessories: new Set<string>(),
  };
  const products = new Map<string, SalesMetric & { slug: string; name: string; category: string; brand: string }>();
  const productOrderSets = new Map<string, Set<string>>();
  const paidOrders = commercialOrders.filter((order) => order.paymentStatus === "paid");
  for (const order of paidOrders) {
    const currency = order.currency.toUpperCase();
    for (const item of order.items) {
      const product = productBySlug.get(item.slug);
      const category = product?.category ?? "unknown";
      const brand = product?.brand ?? "Unknown";
      const itemCents = item.unitCents * item.quantity;
      const productMetric = products.get(item.slug) ?? {
        slug: item.slug,
        name: product?.name ?? item.title,
        category,
        brand,
        ...emptySalesMetric(),
      };
      const productOrders = productOrderSets.get(item.slug) ?? new Set<string>();
      addSale(productMetric, order.id, currency, itemCents, item.quantity, productOrders);
      products.set(item.slug, productMetric);
      productOrderSets.set(item.slug, productOrders);

      const area = brand.toUpperCase() === "TERRIFUEL" || category === "fuel"
        ? "terrifuel"
        : category === "band"
          ? "band"
          : category === "accessories"
            ? "accessories"
            : null;
      if (area) addSale(sales[area], order.id, currency, itemCents, item.quantity, orderSets[area]);
    }
  }
  for (const metric of Object.values(sales)) metric.revenue.sort((a, b) => a.currency.localeCompare(b.currency));
  const paymentMethods = [...new Set(commercialOrders.map((order) => order.paymentMethod))]
    .map((method) => ({
      method,
      orders: commercialOrders.filter((order) => order.paymentStatus === "paid" && order.paymentMethod === method).length,
      revenue: moneyBuckets(commercialOrders.filter((order) => order.paymentMethod === method)),
    }))
    .sort((a, b) => b.orders - a.orders);
  const statuses = await prisma.order.groupBy({
    by: ["paymentStatus"],
    where: { sandbox: false },
    _count: true,
  });
  const sandboxOrders = await prisma.order.count({ where: { sandbox: true } });

  return {
    members: { total: members, newThisWeek: newMembers, pro, payingCustomers, trialing },
    subscriptions: {
      monthly,
      yearly,
      mrrCents,
      // The obvious annualisation, so nobody has to do it in their head.
      arrCents: mrrCents * 12,
    },
    waitlist,
    orders: {
      total: orders,
      thisWeek: recentOrders,
      paid: paidOrders.length,
      sandbox: sandboxOrders,
      revenueCents: moneyBuckets(commercialOrders).find((bucket) => bucket.currency === "USD")?.netCents ?? 0,
    },
    payments: {
      byCurrency: moneyBuckets(commercialOrders),
      byMethod: paymentMethods,
      byStatus: statuses.map((row) => ({ status: row.paymentStatus, orders: row._count })),
    },
    sales: {
      ...sales,
      products: [...products.values()]
        .map((metric) => ({ ...metric, revenue: metric.revenue.sort((a, b) => a.currency.localeCompare(b.currency)) }))
        .sort((a, b) => b.units - a.units),
    },
    content: { posts, comments },
    devices: bands,
    contact,
    imports,
  };
}

export async function adminMembers(query = "", take = 50) {
  const users = await prisma.user.findMany({
    where: query
      ? { OR: [{ email: { contains: query } }, { name: { contains: query } }, { handle: { contains: query } }] }
      : undefined,
    orderBy: { createdAt: "desc" },
    take: Math.min(100, take),
    select: {
      id: true, email: true, name: true, handle: true, role: true, plan: true,
      isAdmin: true, createdAt: true,
      _count: { select: { posts: true, metrics: true, bands: true } },
    },
  });

  return users.map((user) => ({
    id: user.id,
    email: user.email,
    name: user.name,
    handle: user.handle,
    role: user.role,
    plan: user.plan,
    isAdmin: user.isAdmin,
    createdAt: user.createdAt.toISOString(),
    posts: user._count.posts,
    metricDays: user._count.metrics,
    bands: user._count.bands,
  }));
}

export async function adminOrders(status?: string | null, query = "") {
  const orders = await prisma.order.findMany({
    where: {
      ...(status && status !== "all" ? { paymentStatus: status } : {}),
      ...(query ? { OR: [{ number: { contains: query.toUpperCase() } }, { email: { contains: query } }] } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { items: true },
  });

  return orders.map((order) => ({
    id: order.id,
    number: order.number,
    email: order.email,
    name: order.name,
    totalCents: order.totalCents,
    currency: order.currency,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    fulfillmentStatus: order.fulfillmentStatus,
    sandbox: order.sandbox,
    createdAt: order.createdAt.toISOString(),
    items: order.items.map((item) => ({
      title: item.title,
      variantLabel: item.variant,
      quantity: item.quantity,
      unitPriceCents: item.unitCents,
    })),
    address: order.line1
      ? [order.line1, order.line2, order.city, order.postcode, order.country].filter(Boolean).join(", ")
      : null,
  }));
}

export async function adminPosts() {
  const posts = await prisma.post.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { author: { select: { id: true, name: true, handle: true, email: true } } },
  });

  return posts.map((post) => ({
    id: post.id,
    kind: post.kind,
    body: post.body,
    mediaUrl: post.mediaUrl,
    visibility: post.visibility,
    likeCount: post.likeCount,
    commentCount: post.commentCount,
    createdAt: post.createdAt.toISOString(),
    author: post.author,
  }));
}

export async function adminAudit() {
  const entries = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { actor: { select: { name: true, email: true } } },
  });

  return entries.map((entry) => ({
    id: entry.id,
    action: entry.action,
    target: entry.target,
    detail: entry.detail,
    actor: entry.actor,
    createdAt: entry.createdAt.toISOString(),
  }));
}

/**
 * The waitlist, with the demand signal that actually drives decisions.
 *
 * The list is the business right now — the founding hundred, the market mix and
 * which parts of the product people said they wanted — and none of it was
 * visible anywhere outside the database.
 */
export async function adminWaitlist(query = "", take = 200) {
  const where = query.trim()
    ? {
        OR: [
          { email: { contains: query.trim(), mode: "insensitive" as const } },
          { name: { contains: query.trim(), mode: "insensitive" as const } },
          { referralCode: { equals: query.trim().toUpperCase() } },
        ],
      }
    : {};

  const [entries, total, byRole, byCountry] = await Promise.all([
    prisma.waitlistEntry.findMany({ where, orderBy: { position: "asc" }, take }),
    prisma.waitlistEntry.count(),
    prisma.waitlistEntry.groupBy({ by: ["role"], _count: { _all: true } }),
    prisma.waitlistEntry.groupBy({ by: ["country"], _count: { _all: true }, orderBy: { _count: { country: "desc" } }, take: 8 }),
  ]);

  return {
    total,
    byRole: byRole.map((row) => ({ role: row.role, count: row._count._all })).sort((a, b) => b.count - a.count),
    byCountry: byCountry.map((row) => ({ country: row.country, count: row._count._all })),
    entries: entries.map((entry) => ({
      id: entry.id,
      email: entry.email,
      name: entry.name,
      role: entry.role,
      country: entry.country,
      position: entry.position,
      referrals: entry.referrals,
      referralCode: entry.referralCode,
      referredByCode: entry.referredByCode,
      // Stored as a JSON string; a malformed row must not take the page down.
      features: ((): string[] => {
        try {
          const parsed: unknown = JSON.parse(entry.features);
          return Array.isArray(parsed) ? parsed.map(String) : [];
        } catch {
          return [];
        }
      })(),
      handle: entry.handle,
      audienceSize: entry.audienceSize,
      createdAt: entry.createdAt.toISOString(),
    })),
  };
}

/**
 * Contact messages, unhandled first.
 *
 * `ContactMessage.handled` has existed since the form shipped with nothing able
 * to set it, so every message anyone has ever sent has sat unread in a table.
 */
export async function adminMessages(take = 200) {
  const [messages, unhandled] = await Promise.all([
    prisma.contactMessage.findMany({
      orderBy: [{ handled: "asc" }, { createdAt: "desc" }],
      take,
    }),
    prisma.contactMessage.count({ where: { handled: false } }),
  ]);

  return {
    unhandled,
    messages: messages.map((message) => ({
      id: message.id,
      topic: message.topic,
      name: message.name,
      email: message.email,
      message: message.message,
      locale: message.locale,
      handled: message.handled,
      createdAt: message.createdAt.toISOString(),
    })),
  };
}
