"use client";

import Link from "next/link";
import type { Locale } from "@/i18n/config";
import type { PagesCopy } from "@/i18n/pages";
import { storefrontCopy } from "@/i18n/storefront";
import { useCart } from "@/lib/shop/cart";
import { discountPercent, formatMoney } from "@/lib/shop/money";
import type { Product } from "@/lib/shop/catalog";
import { ProductMedia } from "./ProductMedia";
import { launchCopy } from "@/i18n/launch";

export function ProductCard({ locale, product, copy }: { locale: Locale; product: Product; copy: PagesCopy["shop"] }) {
  const cart = useCart();
  const text = storefrontCopy(locale);
  const launch = launchCopy(locale);
  const upcoming = product.launchStatus === "upcoming";
  const membership = product.launchStatus === "membership";
  const off = discountPercent(product.priceCents, product.compareAtCents);
  const options = upcoming || membership || product.variants.length > 1 || product.stock === "out";
  const href = membership ? `/${locale}/membership` : `/${locale}/shop/${product.slug}`;
  return <article className="sc-card">
    <Link className="sc-card-media" href={href} aria-label={product.name}>
      <ProductMedia product={product} />
      {upcoming ? <span className="sc-badge">{launch.upcoming}</span> : off > 0 ? <span className="sc-badge">{copy.save} {off}%</span> : product.stock === "preorder" ? <span className="sc-badge">{text.preorder}</span> : null}
      <span className="sc-card-arrow" aria-hidden>↗</span>
    </Link>
    <div className="sc-card-body">
      <p className="sc-brand">{product.brand}{product.partner ? <span> / {copy.partnerBadge}</span> : null}</p>
      <h3><Link href={href}>{product.name}</Link></h3>
      <p className="sc-card-note">{product.tagline}</p>
      <div className="sc-card-options">
        {product.variants.some(option => option.swatch) ? <div className="sc-swatches" aria-label={product.variantLabel}>{product.variants.slice(0, 5).map(option => <i key={option.id} style={{ background: option.swatch }} title={option.label} />)}</div> : <span>{product.variantLabel && product.variants.length > 1 ? `${product.variantLabel} / ${product.variants.length}` : product.stock === "out" ? text.out : upcoming ? launch.upcoming : product.stock === "preorder" ? text.preorder : product.stock === "low" ? text.low : text.available}</span>}
      </div>
      <div className="sc-card-foot"><div className="sc-price numeric"><strong>{formatMoney(product.priceCents, locale)}</strong>{off > 0 ? <s>{formatMoney(product.compareAtCents!, locale)}</s> : null}</div>
        {options ? <Link className="sc-quick-add" href={href} aria-label={`${text.options}: ${product.name}`}>{upcoming ? launch.upcoming : membership ? launch.membership : text.options}<span aria-hidden>↗</span></Link> : <button type="button" className="sc-quick-add" aria-label={`${text.add}: ${product.name}`} onClick={() => cart.add({ slug: product.slug, variantId: product.variants[0]?.id, quantity: 1 })}>{text.add}<span aria-hidden>+</span></button>}
      </div>
    </div>
  </article>;
}
