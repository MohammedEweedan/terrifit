import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BandExperience } from "@/components/band/BandExperience";
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
  const { meta } = getPagesCopy(locale).band;
  return {
    title: meta.title,
    description: meta.description,
    alternates: { canonical: `/${locale}/band` },
    openGraph: { title: meta.title, description: meta.description, type: "website" },
  };
}

export default async function BandPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return (
    <SiteShell locale={locale}>
      <BandExperience locale={locale} copy={getPagesCopy(locale).band} />
    </SiteShell>
  );
}
