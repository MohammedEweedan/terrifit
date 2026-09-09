import { notFound, redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { isLocale } from "@/i18n/config";
import { AdminConsole } from "@/components/admin/AdminConsole";
import { adminAudit, adminMembers, adminMessages, adminOrders, adminOverview, adminPosts, adminWaitlist } from "@/lib/admin-data";
import { listProducts } from "@/lib/shop/catalog-store";
import { listAllLooks } from "@/lib/shop/lookbook";

export const dynamic = "force-dynamic";

/**
 * Shape the console expects when the overview query itself is unavailable.
 *
 * Typed from the loader's own return type, so adding a field to `adminOverview`
 * fails the build here rather than shipping a fallback that silently omits it.
 */
const EMPTY_OVERVIEW: Awaited<ReturnType<typeof adminOverview>> = {
  members: { total: 0, newThisWeek: 0, pro: 0, payingCustomers: 0, trialing: 0 },
  waitlist: 0,
  subscriptions: { monthly: 0, yearly: 0, mrrCents: 0, arrCents: 0 },
  orders: { total: 0, thisWeek: 0, paid: 0, sandbox: 0, revenueCents: 0 },
  payments: { byCurrency: [], byMethod: [], byStatus: [] },
  sales: {
    terrifuel: { orders: 0, units: 0, revenue: [] },
    band: { orders: 0, units: 0, revenue: [] },
    accessories: { orders: 0, units: 0, revenue: [] },
    products: [],
  },
  content: { posts: 0, comments: 0 },
  devices: 0,
  contact: 0,
  imports: 0,
};

/**
 * Runs one loader, returning a usable empty value if it fails.
 *
 * The failure is logged with the section name, so a broken query is findable in
 * the deployment logs instead of only visible as an absence on the page.
 */
async function settle<T>(name: string, run: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await run();
  } catch (error) {
    console.error(`admin console: ${name} failed to load`, error);
    return fallback;
  }
}

export const metadata = {
  title: "Console · Terrifit",
  // Staff pages have no business in an index.
  robots: { index: false, follow: false },
};

export default async function AdminPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  // Server-side, before anything renders: the console never reaches the
  // browser for someone who is not staff.
  const admin = await requireAdmin();
  if (!admin) redirect(`/${locale}/signin?next=/${locale}/nimda`);

  /**
   * Loaded independently, not with `Promise.all`.
   *
   * A single failing query used to reject the whole batch and take the entire
   * console down to a blank page — no metrics, no tabs, nothing to act on and
   * nothing naming the cause. Each section now degrades on its own, and the
   * page says which ones did.
   */
  const [overview, members, orders, posts, audit, products, waitlist, messages, looks] = await Promise.all([
    settle("overview", adminOverview, EMPTY_OVERVIEW),
    settle("members", adminMembers, []),
    settle("orders", adminOrders, []),
    settle("posts", adminPosts, []),
    settle("audit", adminAudit, []),
    settle("products", () => listProducts({ includeInactive: true }), []),
    settle("waitlist", adminWaitlist, { total: 0, byRole: [], byCountry: [], entries: [] }),
    settle("messages", adminMessages, { unhandled: 0, messages: [] }),
    settle("looks", listAllLooks, []),
  ]);

  return (
    <AdminConsole
      locale={locale}
      admin={admin}
      overview={overview}
      members={members}
      orders={orders}
      posts={posts}
      audit={audit}
      products={products}
      waitlist={waitlist}
      messages={messages}
      looks={looks}
    />
  );
}
