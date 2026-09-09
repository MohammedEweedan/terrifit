import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteShell } from "@/components/layout/SiteShell";
import { Shot } from "@/components/ui/Shot";
import { isLocale, locales } from "@/i18n/config";
import { getPagesCopy } from "@/i18n/pages";
import { storefrontCopy } from "@/i18n/storefront";
import { listShopProducts } from "@/lib/shop/catalog-store";
import { listLooks } from "@/lib/shop/lookbook";
import { formatMoney } from "@/lib/shop/money";

export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const text = storefrontCopy(locale);
  return {
    title: `${text.collection} — Terrifit`,
    description: text.shopBody,
    alternates: { canonical: `/${locale}/lookbook` },
  };
}

/**
 * The lookbook: styled photographs, each one shoppable.
 *
 * Every look resolves its featured slugs against the sellable catalogue, so a
 * shot can never link to something that has been hidden or withdrawn — the
 * failure mode of a hand-maintained lookbook is a beautiful page full of dead
 * links.
 */
export default async function LookbookPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const text = storefrontCopy(locale);
  const shop = getPagesCopy(locale).shop;
  const [looks, products] = await Promise.all([listLooks().catch(() => []), listShopProducts().catch(() => [])]);
  const bySlug = new Map(products.map((product) => [product.slug, product]));

  return (
    <SiteShell locale={locale}>
      <div className="lb-page">
        <header className="lb-head tf-shell">
          <p className="lb-eyebrow">{text.shopEyebrow}</p>
          <h1>{text.collection}</h1>
          <p className="lb-lede">{text.shopBody}</p>
        </header>

        {looks.length === 0 ? (
          <section className="tf-shell lb-empty">
            <p>{text.shopBody}</p>
            <Link className="lb-cta" href={`/${locale}/shop`}>{text.shopAll}</Link>
          </section>
        ) : (
          <div className="lb-grid tf-shell">
            {looks.map((look, index) => {
              const featured = look.productSlugs.flatMap((slug) => bySlug.get(slug) ?? []);
              return (
                <article key={look.id} className={`lb-look ${index % 3 === 0 ? "is-wide" : ""}`}>
                  <div className="lb-art">
                    <Shot src={look.imageUrl} alt={look.alt} ratio={index % 3 === 0 ? 3 / 2 : 4 / 5}
                          sizes="(max-width: 800px) 92vw, 620px" fallback={{ label: look.title }} />
                  </div>
                  <div className="lb-meta">
                    <h2>{look.title}</h2>
                    {look.note ? <p>{look.note}</p> : null}
                    {featured.length ? (
                      <ul className="lb-shop">
                        {featured.map((product) => (
                          <li key={product.slug}>
                            <Link href={`/${locale}/shop/${product.slug}`}>
                              <span>{product.name}</span>
                              <b className="numeric">{formatMoney(product.priceCents, locale, "USD")}</b>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        )}

        <section className="lb-foot tf-shell">
          <Link className="lb-cta" href={`/${locale}/shop?category=apparel`}>{shop.categories.apparel}</Link>
          <Link className="lb-cta lb-cta-quiet" href={`/${locale}/shop`}>{text.shopAll}</Link>
        </section>
      </div>
    </SiteShell>
  );
}
