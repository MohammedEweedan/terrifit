"use client";

import { useDeferredValue, useMemo, useState } from "react";
import Link from "next/link";
import type { Locale } from "@/i18n/config";
import type { PagesCopy } from "@/i18n/pages";
import type { Product } from "@/lib/shop/catalog";
import { ProductCard } from "@/components/shop/ProductCard";
import { formatMoney } from "@/lib/shop/money";

type Sort = "featured" | "priceLow" | "priceHigh" | "rating";

/**
 * The store.
 *
 * It was built like a landing page — a magazine hero, a badge row, and a launch
 * roadmap sitting between the reader and the products. That is marketing
 * furniture in the middle of a shopping flow, and it is the difference between
 * a shop and a page that happens to contain things for sale.
 *
 * This is arranged the way stores are actually arranged:
 *
 *   1. A **header that gets out of the way** — what this is, how many things
 *      are in it, and a search field.
 *   2. **Departments**, because "what am I here for" is the first question and
 *      a flat grid of everything answers it worst.
 *   3. The **flagship**, given the room a $229 pre-order earns.
 *   4. A **dense grid** under a toolbar that sticks, so filtering does not mean
 *      scrolling back up.
 *   5. **Reassurance last** — delivery, returns and warranty belong next to the
 *      decision to buy, not in front of the decision to look.
 */

/** Departments, in the order somebody actually shops them. */
const DEPARTMENTS = [
  { key: "band", tint: "ember" },
  { key: "fuel", tint: "sand" },
  { key: "apparel", tint: "slate" },
  { key: "bundles", tint: "ink" },
] as const;

export function ShopCatalog({
  locale,
  copy,
  products,
}: {
  locale: Locale;
  copy: PagesCopy["shop"];
  products: Product[];
}) {
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState<Sort>("featured");
  const [query, setQuery] = useState("");
  // Typing should never block the grid on a large catalogue.
  const search = useDeferredValue(query).trim().toLowerCase();

  const categories = useMemo(
    () => [...new Set(products.map((product) => product.category))],
    [products],
  );

  /** The flagship gets its own row, so it is not one tile among twenty. */
  const flagship = useMemo(
    () => products.find((product) => product.slug === "terrifit-v1") ?? null,
    [products],
  );

  const visible = useMemo(() => {
    let list = products.filter(
      (product) => category === "all" || product.category === category,
    );

    if (search) {
      list = list.filter((product) =>
        `${product.name} ${product.tagline} ${product.brand} ${product.badges.join(" ")}`
          .toLowerCase()
          .includes(search),
      );
    }

    // The flagship keeps its own row above, so it is not repeated in the grid
    // unless the shopper has actively filtered or searched for it.
    if (category === "all" && !search && flagship) {
      list = list.filter((product) => product.slug !== flagship.slug);
    }

    // `featured` is the hand-ordered catalogue order, so it sorts by nothing.
    if (sort === "featured") return list;
    return [...list].sort((a, b) => {
      if (sort === "priceLow") return a.priceCents - b.priceCents;
      if (sort === "priceHigh") return b.priceCents - a.priceCents;
      return b.rating - a.rating;
    });
  }, [category, sort, search, products, flagship]);

  const label = (key: string) =>
    copy.categories[key as keyof typeof copy.categories] ?? key;

  const browsing = category === "all" && !search;

  return (
    <div className="sh">
      <header className="sh-top">
        <div className="tf-shell sh-top-inner">
          <div>
            <p className="sh-eyebrow">{copy.hero.eyebrow}</p>
            <h1>{copy.hero.title}</h1>
          </div>
          <label className="sh-search">
            <span className="sr-only">{copy.searchLabel}</span>
            <svg width="15" height="15" viewBox="0 0 24 24" aria-hidden>
              <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="2" />
              <path d="m16.5 16.5 4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={copy.searchPlaceholder}
              autoComplete="off"
            />
          </label>
        </div>
      </header>

      {/* Departments. Hidden the moment somebody filters or searches, because
          they have already told us what they are here for. */}
      {browsing ? (
        <nav className="sh-departments" aria-label={copy.departmentsLabel}>
          <div className="tf-shell">
            <ul>
              {DEPARTMENTS.filter((department) => categories.includes(department.key)).map((department) => {
                const count = products.filter((product) => product.category === department.key).length;
                return (
                  <li key={department.key}>
                    <button type="button" data-tint={department.tint} onClick={() => setCategory(department.key)}>
                      <strong>{label(department.key)}</strong>
                      <span>{count} {count === 1 ? copy.itemOne : copy.itemMany}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </nav>
      ) : null}

      {/* The flagship, with the room a pre-order at this price earns. */}
      {browsing && flagship ? (
        <section className="sh-flagship" aria-label={flagship.name}>
          <div className="tf-shell sh-flagship-inner">
            <div className="sh-flagship-media">
              {flagship.media[0] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={flagship.media[0].src} alt={flagship.media[0].alt} loading="lazy" />
              ) : null}
            </div>
            <div className="sh-flagship-copy">
              <p className="sh-eyebrow">{flagship.brand}</p>
              <h2>{flagship.name}</h2>
              <p>{flagship.tagline}</p>
              <ul className="sh-flagship-points">
                {flagship.highlights.slice(0, 3).map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
              <div className="sh-flagship-buy">
                <span className="sh-price numeric">{formatMoney(flagship.priceCents, locale)}</span>
                <Link className="sh-button" href={`/${locale}/shop/${flagship.slug}`}>
                  {copy.viewProduct}
                </Link>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      <section className="sh-catalog">
        <div className="tf-shell">
          {/* Sticks, so changing your mind about a filter does not mean
              scrolling back to the top of a long grid. */}
          <div className="sh-tools">
            <div className="sh-filters" role="group" aria-label={copy.hero.eyebrow}>
              <button
                type="button"
                aria-pressed={category === "all"}
                className={category === "all" ? "is-active" : undefined}
                onClick={() => setCategory("all")}
              >
                {copy.categories.all}
              </button>
              {categories.map((key) => (
                <button
                  key={key}
                  type="button"
                  aria-pressed={category === key}
                  className={category === key ? "is-active" : undefined}
                  onClick={() => setCategory(key)}
                >
                  {label(key)}
                </button>
              ))}
            </div>

            <div className="sh-tools-end">
              <p className="sh-count numeric">
                {visible.length} {copy.resultCount}
              </p>
              <label className="sh-sort">
                <span>{copy.sortLabel}</span>
                <select value={sort} onChange={(event) => setSort(event.target.value as Sort)}>
                  {(["featured", "priceLow", "priceHigh", "rating"] as const).map((key) => (
                    <option key={key} value={key}>
                      {copy.sort[key]}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          {visible.length === 0 ? (
            <p className="sh-empty">{copy.empty}</p>
          ) : (
            <div className="sh-grid">
              {visible.map((product) => (
                <ProductCard key={product.slug} locale={locale} product={product} copy={copy} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Reassurance sits with the decision to buy, not in front of the
          decision to look. */}
      <section className="sh-trust">
        <div className="tf-shell">
          {copy.trust.map((item) => (
            <div key={item.title}>
              <strong>{item.title}</strong>
              <span>{item.body}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
