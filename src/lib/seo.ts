import { locales, localeMeta, type Locale } from "@/i18n/config";

/**
 * Search positioning for the whole site.
 *
 * Terrifit is three things at once and the metadata has to say all three, or
 * search engines file it as another coaching app: a wellness social network,
 * a wearable technology brand, and a supplement and gear marketplace. Every
 * page's title and description is written against that, and the structured
 * data below states it in the machine-readable form crawlers actually use.
 */

export const SITE_NAME = "Terrifit";
export const SITE_TAGLINE = "Don’t do great, do terrific.";

/** Absolute origin. Needed for canonical URLs, OG images and JSON-LD. */
export function siteOrigin(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://terrifit.com").replace(/\/$/, "");
}

export function absolute(path: string): string {
  return `${siteOrigin()}${path.startsWith("/") ? path : `/${path}`}`;
}

/**
 * Terms the site should actually rank for. Meta keywords carry no weight with
 * Google any more, but this list is the shared source of truth that the page
 * copy, the OG descriptions and the JSON-LD `knowsAbout` are all written from,
 * which is what does carry weight.
 */
export const POSITIONING_TERMS = [
  "wellness social app",
  "health and fitness social network",
  "wellness community app",
  "fitness wearable",
  "health tracking band",
  "recovery and sleep tracker",
  "HRV tracker",
  "supplement marketplace",
  "third-party tested supplements",
  "creator wellness platform",
  "training programmes",
  "wellness creators",
];

/** Language alternates for a path that exists in every locale. */
export function languageAlternates(path: string): Record<string, string> {
  return Object.fromEntries(
    locales.map((locale) => [localeMeta[locale].htmlLang, `/${locale}${path}`]),
  );
}

/* -------------------------------------------------------------------------- */

type Json = Record<string, unknown>;

export function organizationSchema(): Json {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: siteOrigin(),
    logo: absolute("/icon.svg"),
    slogan: SITE_TAGLINE,
    description:
      "Terrifit is a wellness social platform, a wearable technology brand and a supplement marketplace in one. Share your training and recovery with people who care, wear the V1 band, and buy fuel that has been tested.",
    knowsAbout: POSITIONING_TERMS,
    sameAs: [
      "https://www.instagram.com/terrifit",
      "https://www.youtube.com/@terrifit",
      "https://www.tiktok.com/@terrifit",
      "https://x.com/terrifit",
    ],
    contactPoint: [
      { "@type": "ContactPoint", contactType: "customer support", email: "hello@terrifit.com", availableLanguage: locales.map((locale) => localeMeta[locale].englishLabel) },
      { "@type": "ContactPoint", contactType: "sales", email: "orders@terrifit.com" },
      { "@type": "ContactPoint", contactType: "press", email: "press@terrifit.com" },
    ],
  };
}

/** Tells search engines the site has its own search, and how to query it. */
export function websiteSchema(locale: Locale): Json {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: absolute(`/${locale}`),
    inLanguage: localeMeta[locale].htmlLang,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${absolute(`/${locale}/search`)}?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export function productSchema(product: {
  name: string;
  description: string;
  brand: string;
  slug: string;
  priceCents: number;
  rating: number;
  reviews: number;
  stock: string;
  image?: string;
}, locale: Locale): Json {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    brand: { "@type": "Brand", name: product.brand },
    sku: product.slug,
    image: product.image ? absolute(product.image) : undefined,
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: product.rating,
      reviewCount: product.reviews,
    },
    offers: {
      "@type": "Offer",
      url: absolute(`/${locale}/shop/${product.slug}`),
      priceCurrency: "USD",
      price: (product.priceCents / 100).toFixed(2),
      availability:
        product.stock === "preorder"
          ? "https://schema.org/PreOrder"
          : "https://schema.org/InStock",
    },
  };
}

export function faqSchema(items: Array<{ q: string; a: string }>): Json {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };
}

export function breadcrumbSchema(trail: Array<{ name: string; path: string }>): Json {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((step, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: step.name,
      item: absolute(step.path),
    })),
  };
}
