import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteShell } from "@/components/layout/SiteShell";
import { Shot } from "@/components/ui/Shot";
import { isLocale, locales } from "@/i18n/config";
import { researchCopy } from "@/i18n/research";
import { listResearchProducts } from "@/lib/shop/catalog-store";

export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const copy = researchCopy(locale);
  return {
    title: `${copy.title} — Terrifit`,
    description: copy.lede,
    alternates: { canonical: `/${locale}/research` },
  };
}

/**
 * The hardware that is not for sale.
 *
 * The Band and the Scale ship in November 2027. Listing them in the shop meant
 * a storefront where the most prominent items could not be bought, which buries
 * the supplements and apparel that ship today and reads as vapourware. They
 * live here instead, with the status stated plainly and no price attached —
 * showing the work is credible, taking money for a date we cannot promise is
 * not.
 */
export default async function ResearchPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const copy = researchCopy(locale);
  const products = await listResearchProducts();
  // Devices first; the straps and chargers that belong to them are supporting
  // detail, not headline research.
  const devices = products.filter((product) => product.category === "band");
  const parts = products.filter((product) => product.category !== "band");

  return (
    <SiteShell locale={locale}>
      <div className="rl-page">
        <header className="rl-head tf-shell">
          <p className="rl-eyebrow">{copy.eyebrow}</p>
          <h1>{copy.title}</h1>
          <p className="rl-lede">{copy.lede}</p>
        </header>

        <section className="rl-devices tf-shell">
          {devices.map((product) => (
            <article key={product.slug} className="rl-device">
              <div className="rl-device-art">
                <Shot
                  src={product.media?.[0]?.src ?? "/media/band/colourways-v2/ember.png"}
                  alt={product.media?.[0]?.alt ?? product.name}
                  ratio={1}
                  fit="contain"
                  sizes="(max-width: 900px) 90vw, 460px"
                  fallback={{ label: product.name }}
                />
                <span className="rl-flag">{copy.noSale}</span>
              </div>
              <div className="rl-device-copy">
                <h2>{product.name}</h2>
                <p className="rl-tagline">{product.tagline}</p>
                <p className="rl-body">{product.description}</p>
                <dl className="rl-status">
                  <div><dt>{copy.statusLabel}</dt><dd>{copy.status}</dd></div>
                  <div><dt>{copy.shipTarget.split(":")[0]}</dt><dd>{copy.shipTarget.split(":").slice(1).join(":").trim()}</dd></div>
                </dl>
                {product.specs?.length ? (
                  <>
                    <h3>{copy.specsTitle}</h3>
                    <ul className="rl-specs">
                      {product.specs.map(([term, value]) => (
                        <li key={term}><b>{term}</b><span>{value}</span></li>
                      ))}
                    </ul>
                  </>
                ) : null}
              </div>
            </article>
          ))}
        </section>

        {parts.length ? (
          <section className="rl-parts tf-shell">
            <h2>{copy.specsTitle}</h2>
            <ul>
              {parts.map((product) => (
                <li key={product.slug}>
                  <b>{product.name}</b>
                  <span>{product.tagline}</span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section className="rl-split tf-shell">
          <article>
            <h2>{copy.notifyTitle}</h2>
            <p>{copy.notifyBody}</p>
            <Link className="rl-cta rl-cta-quiet" href={`/${locale}/onboarding`}>{copy.notifyCta}</Link>
          </article>
          {/* The point of the page: the visitor leaves toward something they
              can actually buy today. */}
          <article className="rl-meanwhile">
            <h2>{copy.meanwhileTitle}</h2>
            <p>{copy.meanwhileBody}</p>
            <Link className="rl-cta" href={`/${locale}/shop`}>{copy.meanwhileCta}</Link>
          </article>
        </section>
      </div>
    </SiteShell>
  );
}
