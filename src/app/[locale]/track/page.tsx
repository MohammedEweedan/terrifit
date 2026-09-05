import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteShell } from "@/components/layout/SiteShell";
import { TrackOrder } from "@/components/shop/TrackOrder";
import { isLocale, locales } from "@/i18n/config";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return {
    title: "Track your order · Terrifit",
    description: "Find your Terrifit order with your order number and the email you used. No account needed.",
    alternates: { canonical: `/${locale}/track` },
    // A lookup form has nothing for an index to rank, and every crawl of it is
    // a rate-limit bucket spent on nobody.
    robots: { index: false, follow: true },
  };
}

export default async function TrackPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return (
    <SiteShell locale={locale}>
      <TrackOrder />
    </SiteShell>
  );
}
