import { getDictionary } from "@/i18n";
import { getPagesCopy } from "@/i18n/pages";
import { marketingUi } from "@/i18n/marketing";
import type { Locale } from "@/i18n/config";
import { products } from "@/lib/shop/catalog";

/**
 * Site-wide search.
 *
 * Everything on the site already exists as structured data — the copy modules,
 * the product catalogue, the Map library — so the index is derived from those
 * rather than crawled. That means it is always in sync with the page, it is
 * automatically in the visitor's language, and nothing has to be re-indexed
 * when copy changes.
 *
 * The corpus is a few hundred short documents, which is small enough that a
 * scan-and-score beats pulling in a search library and a build step.
 */

export type SearchKind = "page" | "product" | "map" | "answer" | "feature" | "spec";

export type SearchDoc = {
  id: string;
  kind: SearchKind;
  title: string;
  subtitle: string;
  /** Extra text that is matched but not shown. */
  body: string;
  href: string;
  /** Short label for the result row, e.g. a price or a section name. */
  badge?: string;
};

export type SearchResult = SearchDoc & { score: number };

/** Lowercases and strips accents so "recuperación" matches "recuperacion". */
function normalise(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

function tokenise(value: string): string[] {
  return normalise(value)
    .split(/[^\p{L}\p{N}+]+/u)
    .filter((token) => token.length > 0);
}

/* -------------------------------------------------------------------------- */

const cache = new Map<Locale, SearchDoc[]>();

export function buildIndex(locale: Locale): SearchDoc[] {
  const cached = cache.get(locale);
  if (cached) return cached;

  const pages = getPagesCopy(locale);
  const dict = getDictionary(locale);
  const ui = marketingUi[locale];
  const at = (path: string) => `/${locale}${path}`;
  const docs: SearchDoc[] = [];

  /* --- Top-level destinations ------------------------------------------- */

  docs.push(
    {
      id: "page:home",
      kind: "page",
      title: "Terrifit",
      subtitle: dict.hero.sub,
      body: `${dict.hero.headline} ${dict.meta.description}`,
      href: at(""),
    },
    {
      id: "page:band",
      kind: "page",
      title: `${ui.nav[1]} — Terrifit V1`,
      subtitle: pages.band.hero.sub,
      body: `${pages.band.hero.title} ${pages.band.meta.description}`,
      href: at("/band"),
    },
    {
      id: "page:maps",
      kind: "page",
      title: ui.nav[2],
      subtitle: pages.maps.hero.sub,
      body: `${pages.maps.hero.title} ${pages.maps.meta.description}`,
      href: at("/maps"),
    },
    {
      id: "page:creators",
      kind: "page",
      title: ui.nav[3],
      subtitle: pages.creators.hero.sub,
      body: `${pages.creators.hero.title} ${pages.creators.meta.description}`,
      href: at("/creators"),
    },
    {
      id: "page:shop",
      kind: "page",
      title: ui.nav[4],
      subtitle: pages.shop.hero.sub,
      body: `${pages.shop.hero.title} ${pages.shop.meta.description}`,
      href: at("/shop"),
    },
    {
      id: "page:platform",
      kind: "page",
      title: ui.nav[0],
      subtitle: dict.prototypes.body,
      body: dict.prototypes.headline,
      href: at("/platform"),
    },
    {
      id: "page:contact",
      kind: "page",
      title: pages.contact.hero.eyebrow,
      subtitle: pages.contact.hero.sub,
      body: pages.contact.hero.title,
      href: at("/contact"),
    },
    {
      id: "page:signin",
      kind: "page",
      title: ui.signIn,
      subtitle: dict.waitlist.body,
      body: "account login access member",
      href: at("/signin"),
    },
  );

  for (const [slug, label] of [
    ["about", dict.footer.company[0]],
    ["careers", dict.footer.company[1]],
    ["press", dict.footer.company[2]],
    ["support", dict.faq.eyebrow],
    ["privacy", dict.footer.legal[0]],
    ["terms", dict.footer.legal[1]],
    ["health", dict.progress.disclaimerTitle],
    ["affiliate", dict.footer.legal[3]],
  ] as const) {
    docs.push({
      id: `page:${slug}`,
      kind: "page",
      title: label,
      subtitle: "",
      body: slug,
      href: at(`/${slug}`),
    });
  }

  /* --- Shop --------------------------------------------------------------- */

  for (const product of products) {
    docs.push({
      id: `product:${product.slug}`,
      kind: "product",
      title: product.name,
      subtitle: product.tagline,
      body: [
        product.brand,
        product.description,
        product.highlights.join(" "),
        product.variants.map((variant) => `${variant.label} ${variant.note ?? ""}`).join(" "),
        product.specs.map(([label, value]) => `${label} ${value}`).join(" "),
      ].join(" "),
      href: at(`/shop/${product.slug}`),
      badge: `$${(product.priceCents / 100).toFixed(0)}`,
    });
  }

  /* --- Maps --------------------------------------------------------------- */

  for (const map of pages.maps.library.items) {
    docs.push({
      id: `map:${map.slug}`,
      kind: "map",
      title: map.name,
      subtitle: map.summary,
      body: `${map.type} ${map.level} ${map.creator} ${map.equipment} ${map.weeks} ${map.days}`,
      href: at("/maps#library"),
      badge: map.price,
    });
  }

  /* --- Band features, specs and integrations ------------------------------ */

  for (const metric of pages.band.sensing.metrics) {
    docs.push({
      id: `feature:sensing:${metric.name}`,
      kind: "feature",
      title: metric.name,
      subtitle: metric.detail,
      body: `${pages.band.sensing.title} V1 band`,
      href: at("/band#sensing"),
      badge: "V1",
    });
  }

  for (const app of pages.band.integrations.apps) {
    docs.push({
      id: `feature:app:${app.name}`,
      kind: "feature",
      title: app.name,
      subtitle: app.detail,
      body: `${pages.band.integrations.title} integration sync`,
      href: at("/band#integrations"),
      badge: "V1",
    });
  }

  for (const group of pages.band.specsSection.groups) {
    for (const [label, value] of group.rows) {
      docs.push({
        id: `spec:${group.title}:${label}`,
        kind: "spec",
        title: `${label}: ${value}`,
        subtitle: `${pages.band.specsSection.title} · ${group.title}`,
        body: `V1 ${group.title} ${label} ${value}`,
        href: at("/band#specs"),
        badge: "V1",
      });
    }
  }

  for (const point of pages.band.water.points) {
    docs.push({
      id: `feature:water:${point.title}`,
      kind: "feature",
      title: point.title,
      subtitle: point.body,
      body: "waterproof sweatproof water resistance swim",
      href: at("/band#battery"),
      badge: "V1",
    });
  }

  for (const card of pages.band.battery.cards) {
    docs.push({
      id: `feature:battery:${card.label}`,
      kind: "feature",
      title: `${card.value} — ${card.label}`,
      subtitle: card.detail,
      body: "battery charge powerpack",
      href: at("/band#battery"),
      badge: "V1",
    });
  }

  /* --- Creator tooling ---------------------------------------------------- */

  for (const tool of pages.creators.tools.items) {
    docs.push({
      id: `feature:creator:${tool.title}`,
      kind: "feature",
      title: tool.title,
      subtitle: tool.body,
      body: "creator coach tools",
      href: at("/creators"),
    });
  }

  for (const channel of pages.creators.channels.items) {
    docs.push({
      id: `feature:channel:${channel.title}`,
      kind: "feature",
      title: channel.title,
      subtitle: channel.body,
      body: "channels messages community dm",
      href: at("/creators"),
    });
  }

  /* --- Questions ---------------------------------------------------------- */

  for (const item of pages.creators.faq.items) {
    docs.push({
      id: `answer:creator:${item.q}`,
      kind: "answer",
      title: item.q,
      subtitle: item.a,
      body: "creator faq",
      href: at("/creators"),
    });
  }

  for (const item of pages.contact.faq.items) {
    docs.push({
      id: `answer:contact:${item.q}`,
      kind: "answer",
      title: item.q,
      subtitle: item.a,
      body: "support help faq",
      href: at("/contact"),
    });
  }

  for (const item of dict.faq.items) {
    docs.push({
      id: `answer:general:${item.q}`,
      kind: "answer",
      title: item.q,
      subtitle: item.a,
      body: "faq",
      href: at("/support"),
    });
  }

  for (const channel of pages.contact.channels.items) {
    docs.push({
      id: `page:contact:${channel.email}`,
      kind: "page",
      title: `${channel.label} — ${channel.email}`,
      subtitle: channel.note,
      body: "contact email support",
      href: at("/contact"),
    });
  }

  cache.set(locale, docs);
  return docs;
}

/* -------------------------------------------------------------------------- */

type Scored = { doc: SearchDoc; score: number };

/**
 * Field-weighted token scoring. An exact token in the title beats a prefix in
 * the title, which beats anything in the body; a document has to match every
 * token the visitor typed, so adding a word always narrows the results.
 */
export function search(locale: Locale, query: string, limit = 12): SearchResult[] {
  const tokens = tokenise(query);
  if (tokens.length === 0) return [];

  const results: Scored[] = [];

  for (const doc of buildIndex(locale)) {
    const title = normalise(doc.title);
    const subtitle = normalise(doc.subtitle);
    const body = normalise(doc.body);

    let score = 0;
    let matchedAll = true;

    for (const token of tokens) {
      let best = 0;
      if (title === token) best = 12;
      else if (title.startsWith(token)) best = 9;
      else if (new RegExp(`\\b${escapeRegExp(token)}`).test(title)) best = 7;
      else if (new RegExp(`\\b${escapeRegExp(token)}`).test(subtitle)) best = 4;
      else if (new RegExp(`\\b${escapeRegExp(token)}`).test(body)) best = 2;
      else if (title.includes(token) || subtitle.includes(token) || body.includes(token)) best = 1;

      if (best === 0) {
        matchedAll = false;
        break;
      }
      score += best;
    }

    if (!matchedAll) continue;

    // Products and pages are what people are usually looking for; a spec row
    // matching equally well should sit below them.
    score += KIND_BOOST[doc.kind];
    results.push({ doc, score });
  }

  return results
    .sort((a, b) => b.score - a.score || a.doc.title.localeCompare(b.doc.title))
    .slice(0, limit)
    .map(({ doc, score }) => ({ ...doc, score }));
}

const KIND_BOOST: Record<SearchKind, number> = {
  page: 3,
  product: 3,
  map: 2,
  feature: 1,
  answer: 1,
  spec: 0,
};

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
