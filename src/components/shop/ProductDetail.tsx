"use client";

import Link from "next/link";
import { useState } from "react";
import type { Locale } from "@/i18n/config";
import type { PagesCopy } from "@/i18n/pages";
import { Shot } from "@/components/ui/Shot";
import { useCart } from "@/lib/shop/cart";
import { discountPercent, formatMoney } from "@/lib/shop/money";
import { products, unitPriceCents, type Product } from "@/lib/shop/catalog";
import { ProductCard } from "@/components/shop/ProductCard";

export function ProductDetail({
  locale,
  product,
  copy,
}: {
  locale: Locale;
  product: Product;
  copy: PagesCopy["shop"];
}) {
  const cart = useCart();
  const [variantId, setVariantId] = useState(product.variants[0]?.id);
  const [quantity, setQuantity] = useState(1);
  const [subscribe, setSubscribe] = useState(false);
  const [shot, setShot] = useState(0);

  const variant = product.variants.find((option) => option.id === variantId);
  const base = unitPriceCents(product, variantId);
  const discount = subscribe ? (product.subscription?.discountPercent ?? 0) : 0;
  const unit = Math.round(base * (1 - discount / 100));
  const off = discountPercent(product.priceCents, product.compareAtCents);

  // The colourway pickers on the band swap the photograph too.
  const gallery = variant?.image
    ? [{ src: variant.image, alt: `${product.name} in ${variant.label}`, ratio: 1 }, ...product.media]
    : product.media;
  const current = gallery[Math.min(shot, gallery.length - 1)];

  const related = products.filter((item) => item.slug !== product.slug && item.category !== "band").slice(0, 4);

  return (
    <>
      <div className="sh-detail">
        <div className="tf-shell">
          <Link className="sh-back" href={`/${locale}/shop`}>
            <span aria-hidden>←</span> {copy.product.back}
          </Link>

          <div className="sh-detail-grid">
            <div className="sh-gallery">
              <Shot
                src={current?.src ?? ""}
                alt={current?.alt ?? product.name}
                ratio={1}
                priority
                fit="cover"
                sizes="(max-width: 900px) 100vw, 52vw"
                fallback={{ label: product.name, sub: product.brand }}
              />
              {gallery.length > 1 ? (
                <div className="sh-thumbs" role="group" aria-label={product.name}>
                  {gallery.map((item, index) => (
                    <button
                      key={item.src}
                      type="button"
                      aria-label={item.alt}
                      aria-current={index === shot}
                      className={index === shot ? "is-active" : undefined}
                      onClick={() => setShot(index)}
                    >
                      <Shot src={item.src} alt="" ratio={1} sizes="80px" fallback={{ label: product.name }} />
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="sh-buy">
              <p className="sh-brand">
                {product.brand}
                <span className={product.partner ? "sh-tag is-partner" : "sh-tag"}>
                  {product.partner ? copy.partnerBadge : copy.originalBadge}
                </span>
              </p>
              <h1>{product.name}</h1>
              <p className="sh-tagline">{product.tagline}</p>

              <div className="sh-rating numeric">
                ★ {product.rating}
                <span>
                  {product.reviews.toLocaleString()} {copy.reviewsLabel}
                </span>
              </div>

              <div className="sh-buy-price">
                <strong className="numeric">{formatMoney(unit, locale)}</strong>
                {product.compareAtCents ? (
                  <s className="numeric">{formatMoney(product.compareAtCents, locale)}</s>
                ) : null}
                {off > 0 ? <em className="numeric">{copy.save} {off}%</em> : null}
              </div>

              {product.variants.length > 0 ? (
                <fieldset className="sh-variants">
                  <legend>{product.variantLabel ?? copy.product.chooseLabel}</legend>
                  <div role="radiogroup" aria-label={product.variantLabel ?? copy.product.chooseLabel}>
                    {product.variants.map((option) => (
                      <button
                        key={option.id}
                        type="button"
                        role="radio"
                        aria-checked={option.id === variantId}
                        className={option.id === variantId ? "is-active" : undefined}
                        onClick={() => {
                          setVariantId(option.id);
                          setShot(0);
                        }}
                      >
                        {option.swatch ? <i style={{ background: option.swatch }} aria-hidden /> : null}
                        <span>{option.label}</span>
                        {option.priceCents ? (
                          <b className="numeric">{formatMoney(option.priceCents, locale)}</b>
                        ) : null}
                      </button>
                    ))}
                  </div>
                  {variant?.note ? <p className="sh-variant-note">{variant.note}</p> : null}
                </fieldset>
              ) : null}

              {product.subscription ? (
                <div className="sh-subscribe" role="radiogroup" aria-label={copy.product.subscribeLabel}>
                  <button
                    type="button"
                    role="radio"
                    aria-checked={!subscribe}
                    className={!subscribe ? "is-active" : undefined}
                    onClick={() => setSubscribe(false)}
                  >
                    {copy.product.oneTime}
                  </button>
                  <button
                    type="button"
                    role="radio"
                    aria-checked={subscribe}
                    className={subscribe ? "is-active" : undefined}
                    onClick={() => setSubscribe(true)}
                  >
                    {copy.product.subscribeLabel}
                    {product.subscription.discountPercent > 0 ? (
                      <b className="numeric">
                        {copy.product.subscribeSave} {product.subscription.discountPercent}%
                      </b>
                    ) : null}
                  </button>
                </div>
              ) : null}

              <div className="sh-add-row">
                <div className="sh-qty" role="group" aria-label={copy.product.quantity}>
                  <button type="button" onClick={() => setQuantity((value) => Math.max(1, value - 1))} aria-label="−">
                    −
                  </button>
                  <span className="numeric">{quantity}</span>
                  <button type="button" onClick={() => setQuantity((value) => Math.min(20, value + 1))} aria-label="+">
                    +
                  </button>
                </div>
                <button
                  type="button"
                  className="sh-button sh-button-block"
                  onClick={() => cart.add({ slug: product.slug, variantId, quantity, subscribe })}
                >
                  {copy.product.addToBag} · <span className="numeric">{formatMoney(unit * quantity, locale)}</span>
                </button>
              </div>

              <p className="sh-ships">
                <span className={`sh-stock is-${product.stock}`}>{copy.stock[product.stock]}</span>
                {product.shipsIn}
              </p>

              {product.partner ? <p className="sh-partner-note">{copy.product.partnerNote}</p> : null}
            </div>
          </div>

          <div className="sh-detail-info">
            <section>
              <h2>{copy.product.overview}</h2>
              <p>{product.description}</p>
              <ul className="sh-highlights">
                {product.highlights.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>

            <section>
              <h2>{copy.product.specs}</h2>
              <dl className="sh-specs">
                {product.specs.map(([label, value]) => (
                  <div key={label}>
                    <dt>{label}</dt>
                    <dd className="numeric">{value}</dd>
                  </div>
                ))}
              </dl>
            </section>

            <section>
              <h2>{copy.product.shippingTitle}</h2>
              <p>{copy.product.shippingBody}</p>
              <h2 className="sh-subhead">{copy.product.warrantyTitle}</h2>
              <p>{copy.product.warrantyBody}</p>
            </section>
          </div>
        </div>
      </div>

      <section className="sh-related">
        <div className="tf-shell">
          <h2>{copy.product.relatedTitle}</h2>
          <div className="sh-grid">
            {related.map((item) => (
              <ProductCard key={item.slug} locale={locale} product={item} copy={copy} />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
