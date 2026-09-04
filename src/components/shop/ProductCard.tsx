"use client";

import Link from "next/link";
import type { Locale } from "@/i18n/config";
import type { PagesCopy } from "@/i18n/pages";
import { Shot } from "@/components/ui/Shot";
import { useCart } from "@/lib/shop/cart";
import { discountPercent, formatMoney } from "@/lib/shop/money";
import { lineImage, type Product } from "@/lib/shop/catalog";

export function ProductCard({
  locale,
  product,
  copy,
}: {
  locale: Locale;
  product: Product;
  copy: PagesCopy["shop"];
}) {
  const cart = useCart();
  const off = discountPercent(product.priceCents, product.compareAtCents);
  const shot = lineImage(product);

  return (
    <article className="sh-card">
      <Link className="sh-card-media" href={`/${locale}/shop/${product.slug}`}>
        <Shot
          src={shot.src}
          alt={shot.alt}
          ratio={1}
          sizes="(max-width: 900px) 50vw, 25vw"
          fit="contain"
          fallback={{ label: product.name, sub: product.brand }}
        />
        {product.partner ? <span className="sh-tag is-partner">{copy.partnerBadge}</span> : null}
        {off > 0 ? <span className="sh-tag is-off numeric">−{off}%</span> : null}
      </Link>

      <div className="sh-card-body">
        <small>{product.brand}</small>
        <h3>
          <Link href={`/${locale}/shop/${product.slug}`}>{product.name}</Link>
        </h3>
        <p>{product.tagline}</p>

        <div className="sh-card-meta">
          <span className={`sh-stock is-${product.stock}`}>{copy.stock[product.stock]}</span>
          <span className="numeric">
            ★ {product.rating} · {product.reviews.toLocaleString()}
          </span>
        </div>

        <div className="sh-card-foot">
          <div className="sh-price">
            <strong className="numeric">{formatMoney(product.priceCents, locale)}</strong>
            {product.compareAtCents ? (
              <s className="numeric">{formatMoney(product.compareAtCents, locale)}</s>
            ) : null}
          </div>
          {/* A product with options has to be opened; adding a random size from
              a grid is how returns happen. */}
          {product.variants.length > 1 || product.stock === "out" ? (
            <Link className="sh-button sh-button-small" href={`/${locale}/shop/${product.slug}`}>
              {copy.viewProduct}
            </Link>
          ) : (
            <button
              type="button"
              className="sh-button sh-button-small"
              onClick={() => cart.add({ slug: product.slug, variantId: product.variants[0]?.id, quantity: 1 })}
            >
              {copy.addToBag}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
