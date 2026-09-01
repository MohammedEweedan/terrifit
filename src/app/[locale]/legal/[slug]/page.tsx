import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteShell } from "@/components/layout/SiteShell";
import { LegalPage } from "@/components/legal/LegalPage";
import { isLocale, locales } from "@/i18n/config";
import { findLegal, LEGAL_DOCUMENTS } from "@/lib/legal/content";

export function generateStaticParams() {
  return locales.flatMap((locale) =>
    LEGAL_DOCUMENTS.map((document) => ({ locale, slug: document.slug })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const document = findLegal(slug);
  if (!isLocale(locale) || !document) return {};

  return {
    title: `${document.title} · Terrifit`,
    description: document.summary,
    alternates: { canonical: `/${locale}/legal/${slug}` },
    openGraph: { title: `${document.title} · Terrifit`, description: document.summary, type: "article" },
  };
}

export default async function LegalRoute({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  const document = findLegal(slug);
  if (!document) notFound();

  return (
    <SiteShell locale={locale}>
      <LegalPage locale={locale} document={document} />
    </SiteShell>
  );
}
