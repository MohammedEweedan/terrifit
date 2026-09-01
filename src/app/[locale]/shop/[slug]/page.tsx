import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteShell } from "@/components/layout/SiteShell";
import { ProductDetail } from "@/components/shop/ProductDetail";
import { isLocale, locales } from "@/i18n/config";
import { getPagesCopy } from "@/i18n/pages";
import { findProduct, products } from "@/lib/shop/catalog";

export function generateStaticParams() {
  return locales.flatMap((locale) => products.map((product) => ({ locale, slug: product.slug })));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const product = findProduct(slug);
  if (!isLocale(locale) || !product) return {};
  const title = `${product.name} — ${product.tagline}`;
  return {
    title,
    description: product.description.slice(0, 300),
    alternates: { canonical: `/${locale}/shop/${slug}` },
    openGraph: { title, description: product.description.slice(0, 300), type: "website" },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const product = findProduct(slug);
  if (!isLocale(locale) || !product) notFound();
  return (
    <SiteShell locale={locale} className="sh-site">
      <ProductDetail locale={locale} product={product} copy={getPagesCopy(locale).shop} />
    </SiteShell>
  );
}
