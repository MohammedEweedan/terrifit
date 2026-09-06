import { getAppDownloads } from "@/lib/app-downloads";
import { PRICING } from "@/lib/health/plan";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AppShowcasePage } from "@/components/app/AppShowcasePage";
import { SiteShell } from "@/components/layout/SiteShell";
import { isLocale, locales } from "@/i18n/config";
import { getPagesCopy } from "@/i18n/pages";


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
  const { meta } = getPagesCopy(locale).appPage;
  return {
    title: meta.title,
    description: meta.description,
    alternates: { canonical: `/${locale}/app` },
    openGraph: { title: meta.title, description: meta.description, type: "website" },
  };
}

/**
 * Lived at `/platform` until the navigation started calling it "App" — a URL
 * that disagrees with the link that reached it is a small dishonesty worth one
 * redirect to avoid. `/platform` now 308s here, and the signed-in web app moved
 * to `/dashboard` to free the path.
 */
export default async function AppPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return (
    <SiteShell locale={locale}>
      <AppShowcasePage locale={locale} copy={getPagesCopy(locale).appPage} downloads={getAppDownloads()} monthly={new Intl.NumberFormat(locale,{style:"currency",currency:"USD"}).format(PRICING.monthly.cents/100)} />
    </SiteShell>
  );
}
