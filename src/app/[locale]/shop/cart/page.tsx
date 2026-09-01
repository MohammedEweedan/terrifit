import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteShell } from "@/components/layout/SiteShell";
import { CartView } from "@/components/shop/CartView";
import { isLocale } from "@/i18n/config";
import { getPagesCopy } from "@/i18n/pages";

export const metadata: Metadata = {
  title: "Your bag — Terrifit",
  // The bag is per-visitor and has nothing to offer a search result.
  robots: { index: false, follow: true },
};

export default async function CartPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return (
    <SiteShell locale={locale} className="sh-site">
      <CartView locale={locale} copy={getPagesCopy(locale).shop} />
    </SiteShell>
  );
}
