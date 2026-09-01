import { prisma } from "@/lib/db";
import { PRICING } from "@/lib/health/plan";

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
  const [members, newMembers, pro, trialing, byInterval, waitlist, orders, recentOrders, revenue, posts, comments, bands, contact, imports] =
    await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { createdAt: { gte: weekAgo } } }),
      prisma.user.count({ where: { plan: "pro" } }),
      prisma.user.count({ where: { plan: "trial", trialEndsAt: { gt: new Date() } } }),
      prisma.user.groupBy({ by: ["planInterval"], where: { plan: "pro" }, _count: true }),
      prisma.waitlistEntry.count(),
      prisma.order.count(),
      prisma.order.count({ where: { createdAt: { gte: weekAgo } } }),
      prisma.order.aggregate({ _sum: { totalCents: true }, where: { paymentStatus: "paid" } }),
      prisma.post.count(),
      prisma.comment.count(),
      prisma.bandDevice.count(),
      prisma.contactMessage.count(),
      prisma.healthImport.count(),
    ]);

  // Recurring revenue, normalised to a month. A yearly plan is a twelfth of
  // its price here rather than the whole thing, because MRR that jumps by £39
  // on one signup and stays flat for a year is not a number you can steer by.
  const countFor = (interval: string) =>
    byInterval.find((row) => row.planInterval === interval)?._count ?? 0;
  const monthly = countFor("monthly");
  const yearly = countFor("yearly");
  const mrrCents = monthly * PRICING.monthly.cents + Math.round((yearly * PRICING.yearly.cents) / 12);

  return {
    members: { total: members, newThisWeek: newMembers, pro, trialing },
    subscriptions: {
      monthly,
      yearly,
      mrrCents,
      // The obvious annualisation, so nobody has to do it in their head.
      arrCents: mrrCents * 12,
    },
    waitlist,
    orders: { total: orders, thisWeek: recentOrders, revenueCents: revenue._sum?.totalCents ?? 0 },
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
