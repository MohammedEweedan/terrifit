import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteShell } from "@/components/layout/SiteShell";
import { Shot } from "@/components/ui/Shot";
import { isLocale, locales } from "@/i18n/config";
import { hardwareCopy } from "@/i18n/hardware";
import { getProductOrSeed } from "@/lib/shop/catalog-store";

/**
 * The Scale, on its own page.
 *
 * The hardware page argues that the two devices are one system; this is the
 * detail view for the half of it that was previously only a paragraph and a
 * link to a product that did not exist.
 *
 * All copy comes from `hardwareCopy`, which already carries the Scale in every
 * locale, and the specification table comes from the catalogue — so the page
 * cannot claim something the shop does not sell.
 */
export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const copy = hardwareCopy(locale);
  return {
    title: `${copy.scale.name} — Terrifit`,
    description: copy.scale.body,
    alternates: { canonical: `/${locale}/scale` },
  };
}

export default async function ScalePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const copy = hardwareCopy(locale);
  // Seed fallback, so an unreachable database shows the page rather than a 500.
  const product = await getProductOrSeed("terrifit-scale");
  const money = (cents: number) =>
    new Intl.NumberFormat(locale, { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(cents / 100);

  return (
    <SiteShell locale={locale}>
      <div className="sl-page">
        <section className="sl-hero tf-shell">
          <div className="sl-hero-copy">
            <p className="sl-eyebrow">{copy.eyebrow}</p>
            <h1>{copy.scale.name}</h1>
            <p className="sl-tagline">{copy.scale.tagline}</p>
            <p className="sl-body">{copy.scale.body}</p>
            <div className="sl-actions">
              <Link className="sl-cta" href={`/${locale}/shop/terrifit-scale`}>
                {copy.preorder} · {money(product?.priceCents ?? 7500)}
              </Link>
              <Link className="sl-link" href={`/${locale}/hardware`}>{copy.together.title} →</Link>
            </div>
            <p className="sl-note">{copy.note}</p>
          </div>
          <div className="sl-hero-art">
            <Shot
              src={product?.media?.[0]?.src ?? "/media/scale/black-v1.png"}
              alt={product?.media?.[0]?.alt ?? copy.scale.name}
              ratio={1}
              fit="contain"
              priority
              sizes="(max-width: 900px) 90vw, 520px"
              fallback={{ label: copy.scale.name }}
            />
          </div>
        </section>

        <section className="sl-points tf-shell">
          {copy.scale.points.map((point, index) => (
            <article key={point}>
              <span className="numeric">{String(index + 1).padStart(2, "0")}</span>
              <p>{point}</p>
            </article>
          ))}
        </section>

        {product?.variants?.length ? (
          <section className="sl-finishes tf-shell">
            <h2>{product.variantLabel}</h2>
            <div className="sl-finish-grid">
              {product.variants.map((variant) => (
                <article key={variant.id}>
                  <Shot
                    src={variant.image ?? "/media/scale/black-v1.png"}
                    alt={`${copy.scale.name} — ${variant.label}`}
                    ratio={1}
                    fit="contain"
                    sizes="(max-width: 700px) 45vw, 280px"
                    fallback={{ label: variant.label }}
                  />
                  <strong>{variant.label}</strong>
                  <span>{variant.note}</span>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {product?.specs?.length ? (
          <section className="sl-specs tf-shell">
            <dl>
              {product.specs.map(([term, value]) => (
                <div key={term}>
                  <dt>{term}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          </section>
        ) : null}

        <section className="sl-together tf-shell">
          <p className="sl-eyebrow">{copy.together.eyebrow}</p>
          <h2>{copy.together.title}</h2>
          <p className="sl-body">{copy.together.body}</p>
          <ul>{copy.together.points.map((point) => <li key={point}>{point}</li>)}</ul>
          <Link className="sl-cta" href={`/${locale}/hardware`}>{copy.seeApp}</Link>
        </section>
      </div>
    </SiteShell>
  );
}
