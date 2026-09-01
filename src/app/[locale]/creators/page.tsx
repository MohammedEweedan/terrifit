import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CreatorsExperience } from "@/components/creators/CreatorsExperience";
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
  const { meta } = getPagesCopy(locale).creators;
  return {
    title: meta.title,
    description: meta.description,
    alternates: { canonical: `/${locale}/creators` },
    openGraph: { title: meta.title, description: meta.description, type: "website" },
  };
}

export default async function CreatorsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return (
    <SiteShell locale={locale}>
      <CreatorsExperience locale={locale} copy={getPagesCopy(locale).creators} />
    </SiteShell>
  );
}
