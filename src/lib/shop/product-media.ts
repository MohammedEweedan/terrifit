import type { Product } from "./catalog";

/**
 * Concept art, kept as JPEG. These are photographic renders on a plain warm
 * ground with no transparency, where PNG bought nothing and cost 15MB across
 * nine files — the whole set is now under 2.7MB at quality 92, which is
 * indistinguishable at the sizes the site draws them.
 */
const placeholder = (name: string) => `/media/shop/placeholders/${name}-v1.png`;
/** Replace only known, missing launch assets; staff-uploaded media stays authoritative. */
const legacyImages: Record<string, string> = {
  "/media/band/v1-hero.jpg": "/media/band/colourways-v2/ember.png",
  "/media/band/v1-underside.jpg": "/media/band/colourways-v2/black.png",
  "/media/band/v1-wrist.jpg": "/media/band/colourways-v2/graphite.png",
  "/media/shop/strap-set.jpg": placeholder("straps"),
  "/media/shop/charger.jpg": placeholder("charger"),
  "/media/shop/membership.png": "/media/app/shots/terrifit-home.jpg",
  "/media/shop/field-tee.jpg": placeholder("tee"),
  "/media/shop/terrifits-tee.jpg": placeholder("tee"),
  "/media/shop/terrifits-hoodie.jpg": placeholder("hoodie"),
  "/media/shop/terrifits-shorts.jpg": placeholder("shorts"),
  "/media/shop/hydration.png": placeholder("hydration"),
  "/media/shop/omega-3.jpg": placeholder("omega"),
  "/media/shop/magnesium.jpg": placeholder("magnesium"),
  "/media/shop/shaker.jpg": placeholder("shaker"),
};
const bundles: Record<string, { original: string; items: Product["media"] }> = {
  "terrifuel-daily-stack": { original: "/media/shop/isolate.png", items: [
    { src: "/media/shop/isolate.png", alt: "Recovery protein" },
    { src: "/media/shop/creatine.png", alt: "Pure creatine" },
    { src: placeholder("hydration"), alt: "Daily hydration" },
  ] },
  "terrifuel-night-stack": { original: "/media/shop/magnesium.jpg", items: [
    { src: placeholder("magnesium"), alt: "Night magnesium" },
    { src: placeholder("omega"), alt: "Triple omega-3" },
  ] },
  "v1-starter-bundle": { original: "/media/band/colourways-v2/ember.png", items: [
    { src: "/media/band/colourways-v2/ember.png", alt: "Terrifit V1 in Ember" },
    { src: placeholder("straps"), alt: "Replacement strap concept" },
    { src: placeholder("charger"), alt: "Magnetic charger concept" },
  ] },
};
export function catalogMedia(slug: string, media: Product["media"]): Product["media"] {
  const bundle = bundles[slug];
  if (bundle && media.length === 1 && media[0].src === bundle.original) return bundle.items;
  return media.map(item => ({ ...item, src: legacyImages[item.src] ?? item.src,
    // The available band renders show colourways, not the missing shooting angles.
    alt: item.src.startsWith("/media/band/v1-") ? "Terrifit V1 colourway" : item.alt }));
}
export function hasBundleGallery(product: Product) {
  const bundle = bundles[product.slug];
  return Boolean(bundle && product.media.length === bundle.items.length && product.media.every((item, index) => item.src === bundle.items[index].src));
}
export function isConceptImage(src: string) { return src.includes("/shop/placeholders/"); }
