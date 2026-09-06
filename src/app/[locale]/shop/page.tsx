import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteShell } from "@/components/layout/SiteShell";
import { ShopCatalog } from "@/components/shop/ShopCatalog";
import { isLocale, locales } from "@/i18n/config";
import { getPagesCopy } from "@/i18n/pages";
import { listProducts } from "@/lib/shop/catalog-store";

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
  const { meta } = getPagesCopy(locale).shop;
  return {
    title: meta.title,
    description: meta.description,
    alternates: { canonical: `/${locale}/shop` },
    openGraph: { title: meta.title, description: meta.description, type: "website" },
  };
}

export default async function ShopPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ category?: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const products = await listProducts();
  const { category } = await searchParams;
  return (
    <SiteShell locale={locale} className="sh-site">
      <ShopCatalog key={category ?? "all"} initialCategory={category} locale={locale} copy={getPagesCopy(locale).shop} products={products} />
    </SiteShell>
  );
}
