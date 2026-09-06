"use client";
import type { Product } from "@/lib/shop/catalog";
import { lineImage } from "@/lib/shop/catalog";
import { hasBundleGallery } from "@/lib/shop/product-media";
import { Shot } from "@/components/ui/Shot";

/** Group actual component photos in the browser, keeping each asset reusable. */
export function ProductMedia({ product, priority = false }: { product: Product; priority?: boolean }) {
  const shot = lineImage(product);
  if (hasBundleGallery(product)) return <div className="sc-bundle-media" role="img" aria-label={product.name}>
    {product.media.map(item => <Shot key={item.src} src={item.src} alt="" fit="contain" priority={priority} fallback={{ label: product.name }} />)}
  </div>;
  return <Shot src={shot.src} alt={shot.alt} fit="contain" priority={priority} sizes="(max-width: 700px) 50vw, 30vw" fallback={{ label: product.name, sub: product.brand }} />;
}
