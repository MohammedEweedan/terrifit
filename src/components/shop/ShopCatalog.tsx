"use client";

import { useDeferredValue, useMemo, useState } from "react";
import Link from "next/link";
import type { Locale } from "@/i18n/config";
import type { PagesCopy } from "@/i18n/pages";
import { storefrontCopy } from "@/i18n/storefront";
import type { Product } from "@/lib/shop/catalog";
import { ProductCard } from "./ProductCard";
import { ProductMedia } from "./ProductMedia";
import { CartLink } from "./CartButton";
import { formatMoney } from "@/lib/shop/money";

type Sort = "featured" | "priceLow" | "priceHigh";
const departments = [
  { key: "fuel", slug: "daily-hydration" },
  { key: "apparel", slug: "terrifits-hoodie" },
  { key: "band", slug: "terrifit-v1" },
  { key: "accessories", slug: "training-shaker" },
];

export function ShopCatalog({ locale, copy, products, initialCategory = "all" }: {
  locale: Locale; copy: PagesCopy["shop"]; products: Product[]; initialCategory?: string;
}) {
  const text = storefrontCopy(locale);
  const categories = useMemo(() => [...new Set(products.map(product => product.category))], [products]);
  const [category, setCategory] = useState(categories.includes(initialCategory as Product["category"]) ? initialCategory : "all");
  const [sort, setSort] = useState<Sort>("featured");
  const [query, setQuery] = useState("");
  const search = useDeferredValue(query).trim().toLowerCase();
  const featured = products.find(product => product.slug === "terrifuel-daily-stack");
  const visible = useMemo(() => {
    const list = products.filter(product => (category === "all" || product.category === category) &&
      (!search || `${product.name} ${product.tagline} ${product.brand} ${product.badges.join(" ")}`.toLowerCase().includes(search)));
    if (sort === "featured") return list;
    return list.sort((a, b) => sort === "priceLow" ? a.priceCents - b.priceCents : b.priceCents - a.priceCents);
  }, [category, sort, search, products]);
  const label = (key: string) => copy.categories[key as keyof typeof copy.categories] ?? key;
  const reset = () => { setCategory("all"); setQuery(""); setSort("featured"); };
  const chooseDepartment = (key: string) => {
    setCategory(key);
    document.getElementById("collection")?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth", block: "start" });
  };

  return <div className="sc-store">
    <header className="tf-shell sc-header">
      <Link className="sc-store-name" href={`/${locale}/shop`}>TERRIFIT <span>STORE</span></Link>
      <div className="sc-header-end"><label className="sc-search"><span className="sr-only">{copy.searchLabel}</span>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4.5 4.5"/></svg>
        <input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder={copy.searchPlaceholder} autoComplete="off" />
      </label><CartLink locale={locale} label={text.bag} /></div>
    </header>

    {category === "all" && !search ? <div className="tf-shell">
      <section className="sc-hero">
        <div className="sc-hero-copy"><p className="th-eyebrow">{text.shopEyebrow}</p><h1>{text.shopTitle}</h1><p>{text.shopBody}</p><a className="th-button" href="#collection">{text.shopAll}<span aria-hidden>↓</span></a></div>
        {featured ? <Link className="sc-feature" href={`/${locale}/shop/${featured.slug}`}><ProductMedia product={featured} priority /><div><span><small>{featured.brand}</small><strong>{featured.name}</strong></span><span className="numeric">{formatMoney(featured.priceCents, locale)} <b aria-hidden>↗</b></span></div></Link> : null}
      </section>
      <nav className="sc-departments" aria-label={text.category}>
        {departments.map(department => {
          const product = products.find(item => item.slug === department.slug);
          return product ? <button key={department.key} type="button" onClick={() => chooseDepartment(department.key)}><ProductMedia product={product} /><span>{label(department.key)}<b aria-hidden>↗</b></span></button> : null;
        })}
      </nav>
    </div> : null}

    <section id="collection" className="sc-collection tf-shell">
      <div className="sc-collection-heading"><h2>{category === "all" ? text.collection : label(category)}</h2><p aria-live="polite">{visible.length} {text.results}</p></div>
      <div className="sc-toolbar">
        <div className="sc-filters" role="group" aria-label={text.category}>{["all", ...categories].map(key => <button key={key} type="button" aria-pressed={category === key} onClick={() => setCategory(key)}>{label(key)}</button>)}</div>
        <label className="sc-sort"><span className="sr-only">{copy.sortLabel}</span><select value={sort} onChange={event => setSort(event.target.value as Sort)}>{(["featured", "priceLow", "priceHigh"] as const).map(key => <option key={key} value={key}>{copy.sort[key]}</option>)}</select></label>
      </div>
      {visible.length ? <div className="sc-grid">{visible.map(product => <ProductCard key={product.slug} locale={locale} product={product} copy={copy} />)}</div> : <div className="sc-empty"><h3>{copy.empty}</h3><button className="th-button" type="button" onClick={reset}>{text.reset}</button></div>}
    </section>
    <section className="sc-service tf-shell">{text.services.map((item, index) => <div key={item.title}><span aria-hidden>0{index + 1}</span><strong><Link href={`/${locale}/${item.href}`}>{item.title} &rarr;</Link></strong><p>{item.body}</p></div>)}</section>
  </div>;
}
