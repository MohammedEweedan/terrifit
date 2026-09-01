import { notFound, redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { isLocale } from "@/i18n/config";
import { AdminConsole } from "@/components/admin/AdminConsole";
import { adminAudit, adminMembers, adminOrders, adminOverview, adminPosts } from "@/lib/admin-data";

export const dynamic = "force-dynamic";

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
  if (!admin) redirect(`/${locale}/signin?next=/${locale}/admin`);

  const [overview, members, orders, posts, audit] = await Promise.all([
    adminOverview(),
    adminMembers(),
    adminOrders(),
    adminPosts(),
    adminAudit(),
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
    />
  );
}
