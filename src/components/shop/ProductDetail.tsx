"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import type { Locale } from "@/i18n/config";
import type { PagesCopy } from "@/i18n/pages";
import { storefrontCopy } from "@/i18n/storefront";
import { Shot } from "@/components/ui/Shot";
import { useCart } from "@/lib/shop/cart";
import { discountPercent, formatMoney } from "@/lib/shop/money";
import { unitPriceCents, type Product } from "@/lib/shop/catalog";
import { hasBundleGallery, isConceptImage } from "@/lib/shop/product-media";
import { ProductCard } from "./ProductCard";
import { ProductMedia } from "./ProductMedia";
import { CartLink } from "./CartButton";
import { launchCopy } from "@/i18n/launch";

export function ProductDetail({ locale, product, products, copy }: {
  locale: Locale; product: Product; products: Product[]; copy: PagesCopy["shop"];
}) {
  const cart = useCart();
  const text = storefrontCopy(locale);
  const launch = launchCopy(locale);
  const upcoming = product.launchStatus === "upcoming";
  const membership = product.launchStatus === "membership";
  const [variantId, setVariantId] = useState(product.variants[0]?.id);
  const [quantity, setQuantity] = useState(1);
  const [subscribe, setSubscribe] = useState(false);
  const [shot, setShot] = useState(0);
  const lightbox = useRef<HTMLDialogElement>(null);
  const variant = product.variants.find(option => option.id === variantId);
  const available = variant?.stockQuantity ?? product.stockQuantity ?? 0;
  const backorder = variant?.allowBackorder ?? product.allowBackorder;
  const tracked = product.fulfilment === "ship" && product.trackInventory !== false;
  const soldOut = tracked && available <= 0 && !backorder;
  const preorder = tracked && available <= 0 && backorder;
  const maxQuantity = tracked && !backorder ? Math.min(20, Math.max(1, available)) : 20;
  const base = unitPriceCents(product, variantId);
  const discount = subscribe ? (product.subscription?.discountPercent ?? 0) : 0;
  const unit = Math.round(base * (1 - discount / 100));
  const off = discountPercent(unit, product.compareAtCents);
  const bundle = hasBundleGallery(product);
  const images = variant?.image ? [{ src: variant.image, alt: `${product.name} — ${variant.label}` }, ...product.media] : product.media;
  const gallery = [...(bundle ? [{ src: "bundle", alt: text.bundle }] : []), ...images.filter((item, index) => images.findIndex(other => other.src === item.src) === index)];
  const current = gallery[Math.min(shot, gallery.length - 1)];
  const related = products.filter(item => item.slug !== product.slug).sort((a, b) => Number(b.category === product.category) - Number(a.category === product.category)).slice(0, 4);
  const categoryLabel = copy.categories[product.category];
  const stockText = upcoming ? launch.upcoming : soldOut ? text.out : preorder ? text.preorder : text.available;
  const productImage = current?.src === "bundle" ? <ProductMedia product={product} priority /> : <Shot src={current?.src ?? ""} alt={current?.alt ?? product.name} ratio={1} priority fit="contain" sizes="(max-width: 900px) 100vw, 55vw" fallback={{ label: product.name, sub: product.brand }} />;

  return <div className="pd-page">
    <div className="tf-shell">
      <div className="pd-top"><nav className="pd-breadcrumb" aria-label={copy.product.back}><Link href={`/${locale}/shop`}>{copy.hero.eyebrow}</Link><span aria-hidden>/</span><Link href={`/${locale}/shop?category=${product.category}`}>{categoryLabel}</Link><span aria-hidden>/</span><span>{product.name}</span></nav><CartLink locale={locale} label={text.bag} /></div>
      <div className="pd-grid">
        <div className="pd-gallery">
          <button className="pd-image" type="button" onClick={() => lightbox.current?.showModal()} aria-label={text.zoom}>{productImage}<span className="pd-zoom" aria-hidden>↗</span></button>
          {gallery.length > 1 ? <div className="pd-thumbs" role="group" aria-label={text.gallery}>{gallery.map((item, index) => <button key={item.src} type="button" aria-label={item.alt} aria-pressed={index === shot} onClick={() => setShot(index)}>{item.src === "bundle" ? <ProductMedia product={product} /> : <Shot src={item.src} alt="" fit="contain" sizes="80px" fallback={{ label: product.name }} />}</button>)}</div> : null}
          {product.media.some(item => isConceptImage(item.src)) ? <p className="pd-concept">{text.concept}</p> : null}
        </div>
        <div className="pd-buy" id="product-options">
          <div className="pd-brand"><span>{product.brand}</span><span>{product.partner ? copy.partnerBadge : copy.originalBadge}</span></div>
          <h1>{product.name}</h1><p className="pd-tagline">{product.tagline}</p>
          <div className="pd-price numeric"><strong>{formatMoney(unit, locale)}</strong>{off > 0 ? <><s>{formatMoney(product.compareAtCents!, locale)}</s><span>{copy.save} {off}%</span></> : null}</div>
          <p className="pd-description">{product.description}</p>
          {product.variants.length > 0 ? <fieldset className="pd-variants"><legend>{product.variantLabel ?? copy.product.chooseLabel}<span>{variant?.label}</span></legend><div>
            {product.variants.map(option => <label key={option.id} className={option.id === variantId ? "is-selected" : ""}>
              <input type="radio" name="product-variant" checked={option.id === variantId} onChange={() => { setVariantId(option.id); setShot(0); setQuantity(1); }} />
              {option.swatch ? <i style={{ background: option.swatch }} aria-hidden /> : null}<span>{option.label}</span>
              {option.priceCents && option.priceCents !== product.priceCents ? <small>{formatMoney(option.priceCents, locale)}</small> : null}
            </label>)}
          </div>{variant?.note ? <p>{variant.note}</p> : null}</fieldset> : null}
          {product.subscription ? <fieldset className="pd-subscribe"><legend>{copy.product.subscribeLabel}</legend><label><input type="radio" name="purchase-type" checked={!subscribe} onChange={() => setSubscribe(false)} /><span>{copy.product.oneTime}</span><b>{formatMoney(base, locale)}</b></label><label><input type="radio" name="purchase-type" checked={subscribe} onChange={() => setSubscribe(true)} /><span>{product.subscription.label}</span><b>{copy.save} {product.subscription.discountPercent}%</b></label></fieldset> : null}
          {upcoming || membership ? <Link className="th-button" href={`/${locale}/${membership ? "membership" : "app"}`}>{membership ? launch.membership : launch.app}<span aria-hidden>↗</span></Link> : <>
          <div className="pd-add-row"><div className="pd-quantity" role="group" aria-label={copy.product.quantity}><button type="button" disabled={quantity <= 1} onClick={() => setQuantity(value => Math.max(1, value - 1))} aria-label={text.decrease}>−</button><output className="numeric" aria-live="polite">{quantity}</output><button type="button" disabled={quantity >= maxQuantity} onClick={() => setQuantity(value => Math.min(maxQuantity, value + 1))} aria-label={text.increase}>+</button></div><button className="th-button" type="button" disabled={soldOut} onClick={() => cart.add({ slug: product.slug, variantId, quantity, subscribe })}>{soldOut ? text.out : <>{preorder ? text.preorder : text.add}<span className="numeric">{formatMoney(unit * quantity, locale)}</span></>}</button></div>
          </>}
          <div className="pd-delivery"><span data-stock={soldOut ? "out" : preorder ? "preorder" : "in"}><i aria-hidden />{stockText}</span><p>{product.shipsIn}</p></div><p className="pd-tax-note">{text.taxes}</p>
          {product.partner ? <p className="pd-partner">{copy.product.partnerNote}</p> : null}
          <div className="pd-disclosures">
            <details open><summary>{text.details}<span aria-hidden>+</span></summary><ul>{product.highlights.map(item => <li key={item}>{item}</li>)}</ul></details>
            <details><summary>{copy.product.specs}<span aria-hidden>+</span></summary><dl>{product.specs.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl></details>
            <details><summary>{text.delivery}<span aria-hidden>+</span></summary><p>{product.shipsIn}</p><p>{text.deliveryBody}</p><Link href={`/${locale}/legal/refunds`}>{text.delivery} ↗</Link></details>
          </div>
        </div>
      </div>
      <section className="pd-related"><div className="th-section-heading"><h2>{copy.product.relatedTitle}</h2><Link className="th-text-link" href={`/${locale}/shop`}>{text.shopAll}<span aria-hidden>↗</span></Link></div><div className="sc-grid">{related.map(item => <ProductCard key={item.slug} locale={locale} product={item} copy={copy} />)}</div></section>
    </div>
    <dialog aria-label={product.name} ref={lightbox} className="pd-lightbox" onClick={event => { if (event.target === event.currentTarget) lightbox.current?.close(); }}><button className="tw-close" type="button" aria-label={text.closeImage} onClick={() => lightbox.current?.close()}>×</button>{productImage}</dialog>
  </div>;
}
