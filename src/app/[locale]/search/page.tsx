import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteShell } from "@/components/layout/SiteShell";
import { isLocale } from "@/i18n/config";
import { getPagesCopy } from "@/i18n/pages";
import { search } from "@/lib/search";
import { listProducts } from "@/lib/shop/catalog-store";

export const metadata: Metadata = {
  title: "Search — Terrifit",
  // A results page is a thin duplicate of pages that are already indexed.
  robots: { index: false, follow: true },
};

export const dynamic = "force-dynamic";

/**
 * The full-page results view.
 *
 * The dialog in the header is the fast path; this exists so a search result is
 * a URL you can share, and so search still works with JavaScript unavailable —
 * the form is a plain GET.
 */
export default async function SearchPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const { q } = await searchParams;
  const query = (q ?? "").slice(0, 120).trim();
  const copy = getPagesCopy(locale).search;
  const products = query ? await listProducts() : [];
  const results = query ? search(locale, query, 40, products) : [];

  return (
    <SiteShell locale={locale} className="sh-site">
      <div className="tf-searchpage">
        <div className="tf-shell">
          <form action={`/${locale}/search`} method="get" className="tf-searchpage-form">
            <label className="sr-only" htmlFor="site-search">
              {copy.inputLabel}
            </label>
            <input id="site-search" name="q" type="search" defaultValue={query} placeholder={copy.placeholder} />
            <button type="submit">{copy.submit}</button>
          </form>

          {query ? (
            <p className="tf-searchpage-count">
              {results.length} {copy.resultsCount} · <b>{query}</b>
            </p>
          ) : null}

          {query && results.length === 0 ? (
            <div className="tf-searchpage-empty">
              <h1>{copy.noResultsTitle}</h1>
              <p>{copy.noResultsBody}</p>
              <div>
                <Link className="sh-button" href={`/${locale}/shop`}>
                  {getPagesCopy(locale).shop.hero.eyebrow}
                </Link>
                <Link className="sh-text-link" href={`/${locale}/band`}>
                  Terrifit V1
                </Link>
              </div>
            </div>
          ) : null}

          <ul className="tf-searchpage-results">
            {results.map((result) => (
              <li key={result.id}>
                <Link href={result.href}>
                  <span className="tf-search-kind">{copy.kinds[result.kind]}</span>
                  <span className="tf-search-text">
                    <strong>{result.title}</strong>
                    {result.subtitle ? <small>{result.subtitle}</small> : null}
                  </span>
                  {result.badge ? <b className="numeric">{result.badge}</b> : null}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </SiteShell>
  );
}
