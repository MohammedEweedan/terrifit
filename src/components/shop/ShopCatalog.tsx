"use client";

import { useMemo, useState } from "react";
import type { Locale } from "@/i18n/config";
import type { PagesCopy } from "@/i18n/pages";
import { CATEGORIES, products, type Category } from "@/lib/shop/catalog";
import { ProductCard } from "@/components/shop/ProductCard";
import { LaunchRoadmap } from "@/components/marketing/LaunchRoadmap";
import Image from "next/image";
import shopHero from "../../../public/media/fuel.png";
import { getPagesCopy } from "@/i18n/pages";

type Sort = "featured" | "priceLow" | "priceHigh" | "rating";

export function ShopCatalog({ locale, copy }: { locale: Locale; copy: PagesCopy["shop"] }) {
  const [category, setCategory] = useState<Category | "all">("all");
  const [sort, setSort] = useState<Sort>("featured");

  const visible = useMemo(() => {
    const list = products.filter((product) => category === "all" || product.category === category);
    // `featured` is the hand-ordered catalogue order, so it sorts by nothing.
    if (sort === "featured") return list;
    return [...list].sort((a, b) => {
      if (sort === "priceLow") return a.priceCents - b.priceCents;
      if (sort === "priceHigh") return b.priceCents - a.priceCents;
      return b.rating - a.rating;
    });
  }, [category, sort]);

  return (
    <>
      <section className="sh-hero">
        <div className="tf-shell sh-hero-grid">
          <div>
            <p className="sh-eyebrow">{copy.hero.eyebrow}</p>
            <h1>{copy.hero.title}</h1>
            <p className="sh-lede">{copy.hero.sub}</p>
          </div>
          <div className="sh-hero-media">
            <Image src={shopHero} alt="The Terrifit supplement range laid out together — protein, creatine, hydration and recovery" placeholder="blur" sizes="(max-width: 900px) 100vw, 42vw" />
          </div>
        </div>
      </section>

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

      <LaunchRoadmap locale={locale} copy={getPagesCopy(locale).roadmap} tone="paper" />

      <section className="sh-catalog">
        <div className="tf-shell">
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
              {CATEGORIES.map((key) => (
                <button
                  key={key}
                  type="button"
                  aria-pressed={category === key}
                  className={category === key ? "is-active" : undefined}
                  onClick={() => setCategory(key)}
                >
                  {copy.categories[key]}
                </button>
              ))}
            </div>

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

          <p className="sh-count numeric">
            {visible.length} {copy.resultCount}
          </p>

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
    </>
  );
}
