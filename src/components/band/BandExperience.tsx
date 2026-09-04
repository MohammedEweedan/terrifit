"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import type { Locale } from "@/i18n/config";
import type { PagesCopy } from "@/i18n/pages";
import { BandScrollStory } from "@/components/band/BandScrollStory";
import { Shot } from "@/components/ui/Shot";
import type { Product, Variant } from "@/lib/shop/catalog";
import { useCart } from "@/lib/shop/cart";
import { formatMoney } from "@/lib/shop/money";

const EASE = [0.22, 1, 0.36, 1] as const;
const SECTIONS = ["overview", "design", "sensing", "battery", "integrations", "specs"] as const;

/**
 * The V1 product page.
 *
 * Structured the way a hardware page has to be: one claim per full-height
 * screen, a sticky chapter nav so a long scroll never loses the buy button, and
 * the product photograph carrying the argument rather than a bullet list. Every
 * photographic slot is a `Shot`, so the page is complete and legible before the
 * art exists.
 */
export function BandExperience({ locale, copy: band, product }: { locale: Locale; copy: PagesCopy["band"]; product: Product }) {
  const colourways = product.variants;
  const price = formatMoney(product.priceCents, locale);
  // One colourway selection for the whole page: the hero and the design section
  // are two views of the same choice, and two pickers that could disagree would
  // be worse than one.
  const [colourway, setColourway] = useState(colourways[0]?.id ?? "");

  return (
    <div className="bp">
      <BandHero
        locale={locale}
        copy={band}
        price={price}
        colourway={colourway}
        onColourway={setColourway}
        colourways={colourways}
      />
      <BandNav locale={locale} copy={band} />
      <StatBand items={band.stats} />
      {/* The pinned sequence: one product, six claims, the reader moving past
          it. Sits directly under the stat rail so the page's first scroll is
          the story rather than a spec table. */}
      <BandScrollStory
        chapters={band.story.chapters}
        image={band.hero.image}
        statement={band.story.statement}
      />
      <Colourways
        locale={locale}
        copy={band}
        price={price}
        colourway={colourway}
        onColourway={setColourway}
        colourways={colourways}
      />
      <Sensing copy={band} />
      <DailyLoop copy={band} />
      <Battery copy={band} />
      <Water copy={band} />
      <Integrations copy={band} />
      <InTheBox copy={band} />
      <Specs copy={band} />
      <Privacy locale={locale} copy={band} />
      <FinalCta locale={locale} copy={band} />
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function Reveal({
  children,
  delay = 0,
  className,
  as = "div",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  as?: "div" | "li" | "article" | "section";
}) {
  const reduced = useReducedMotion();
  const Tag = motion[as];
  return (
    <Tag
      className={className}
      initial={reduced ? false : { opacity: 0, y: 26 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-12% 0px" }}
      transition={{ duration: 0.72, ease: EASE, delay }}
    >
      {children}
    </Tag>
  );
}

/* -------------------------------------------------------------------------- */

function BandHero({
  locale,
  copy,
  price,
  colourway,
  onColourway,
  colourways,
}: {
  locale: Locale;
  copy: PagesCopy["band"];
  price: string;
  colourway: string;
  onColourway: (id: string) => void;
  colourways: Variant[];
}) {
  const cart = useCart();
  const current = colourways.find((option) => option.id === colourway) ?? colourways[0];
  if (!current) return null;

  return (
    /**
     * The Mac mini opening: everything on one axis.
     *
     * Eyebrow, headline, one line of copy, the product, then the price and the
     * button — centred, stacked, generous. Nothing is beside anything else.
     * The product is the largest object on the screen by a wide margin and the
     * page's whole first impression is the object plus one sentence, which is
     * the entire trick: an aside column and a spec rail up here would make it
     * a catalogue page.
     */
    <header className="bp-hero bp-hero-centred">
      <div className="bp-hero-inner">
        <p className="bp-eyebrow">{copy.hero.eyebrow}</p>
        <h1 className="bp-hero-headline">{copy.hero.title}</h1>
        <p className="bp-hero-lede">{copy.hero.sub}</p>

        <div className="bp-hero-stage-centred">
          {/* Every colourway stays mounted and cross-fades, so switching is
              instant instead of showing an empty frame while the next
              photograph decodes. They share one grid cell. */}
          <div className="bp-colourway-stack">
            {colourways.map((option) => (
              <div
                key={option.id}
                className={`bp-colourway-shot ${option.id === colourway ? "is-active" : ""}`}
                aria-hidden={option.id !== colourway}
              >
                <Shot
                  src={option.image ?? ""}
                  alt={`Terrifit V1 in ${option.label} — ${option.note}, three-quarter view against a deep charcoal backdrop with the strap curved to show the weave`}
                  ratio={1.35}
                  priority={option.id === colourways[0]?.id}
                  fit="contain"
                  sizes="(max-width: 1024px) 92vw, 62vw"
                />
              </div>
            ))}
          </div>
        </div>

        {/* The name is the caption for the photograph above it, so it takes the
            colourway's own accent — picked to read on the dark ground. */}
        <p className="bp-colourway-name" style={{ color: current.accent }} aria-live="polite">
          {current.label}
        </p>

        <div className="bp-swatches bp-swatches-centred" role="radiogroup" aria-label={copy.colourways.pickerLabel}>
          {colourways.map((option) => (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={option.id === colourway}
              aria-label={`${option.label} — ${option.note}`}
              title={option.label}
              className={option.id === colourway ? "is-active" : undefined}
              onClick={() => onColourway(option.id)}
            >
              <i style={{ background: option.swatch }} aria-hidden />
            </button>
          ))}
        </div>

        <p className="bp-hero-price numeric">
          {copy.hero.priceNote} {price}
        </p>

        <div className="bp-hero-actions">
          <button
            type="button"
            className="bp-button"
            onClick={() => cart.add({ slug: "terrifit-v1", variantId: current.id, quantity: 1 })}
          >
            {copy.hero.cta}
          </button>
          <Link className="bp-hero-detail-link" href={`/${locale}/shop/terrifit-v1`}>
            {copy.colourways.cta} <span aria-hidden>›</span>
          </Link>
        </div>
      </div>
    </header>
  );
}

/* -------------------------------------------------------------------------- */

/**
 * The chapter rail. It pins under the site header once the hero is gone and
 * highlights whichever section is currently crossing the top third of the
 * viewport, so a two-thousand-pixel scroll always says where you are.
 */
function BandNav({ locale, copy }: { locale: Locale; copy: PagesCopy["band"] }) {
  const [active, setActive] = useState<string>(SECTIONS[0]);

  useEffect(() => {
    const targets = SECTIONS.map((id) => document.getElementById(id)).filter(
      (node): node is HTMLElement => node !== null,
    );
    if (targets.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visible) setActive(visible.target.id);
      },
      { rootMargin: "-30% 0px -60% 0px", threshold: 0 },
    );
    targets.forEach((target) => observer.observe(target));
    return () => observer.disconnect();
  }, []);

  return (
    <nav className="bp-nav" aria-label="Terrifit V1 sections">
      <div className="tf-shell bp-nav-inner">
        <span className="bp-nav-title">Terrifit V1</span>
        <ul>
          {SECTIONS.map((id, index) => (
            <li key={id}>
              <a href={`#${id}`} className={active === id ? "is-active" : undefined}>
                {copy.nav[index]}
              </a>
            </li>
          ))}
        </ul>
        <Link className="bp-nav-buy" href={`/${locale}/shop/terrifit-v1`}>
          {copy.buy}
        </Link>
      </div>
    </nav>
  );
}

/* -------------------------------------------------------------------------- */

function StatBand({ items }: { items: PagesCopy["band"]["stats"] }) {
  return (
    <section className="bp-stats" id="overview">
      <div className="tf-shell">
        {items.map((item, index) => (
          <Reveal key={item.label} delay={index * 0.06}>
            <strong className="numeric">
              {item.value}
              {item.unit ? <em>{item.unit}</em> : null}
            </strong>
            <span>{item.label}</span>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */

function Colourways({
  locale,
  copy,
  price,
  colourway,
  onColourway,
  colourways,
}: {
  locale: Locale;
  copy: PagesCopy["band"];
  price: string;
  colourway: string;
  onColourway: (id: string) => void;
  colourways: Variant[];
}) {
  const cart = useCart();
  const current = colourways.find((option) => option.id === colourway) ?? colourways[0];
  if (!current) return null;

  return (
    <section className="bp-colourways bp-paper" id="design">
      <div className="tf-shell">
        <Reveal className="bp-section-head">
          <p className="bp-eyebrow">{copy.colourways.eyebrow}</p>
          <h2>{copy.colourways.title}</h2>
          <p className="bp-lede">{copy.colourways.body}</p>
        </Reveal>

        <div className="bp-weave-grid">
          {colourways.map((option, index) => (
            <Reveal as="article" key={option.id} delay={index * 0.05}>
              <button
                type="button"
                className={option.id === colourway ? "is-active" : undefined}
                onClick={() => onColourway(option.id)}
                aria-pressed={option.id === colourway}
              >
                <span className="bp-weave-swatch" style={{ background: option.swatch }} aria-hidden />
                <strong style={{ color: option.accent }}>{option.label}</strong>
                <span>{option.note}</span>
              </button>
            </Reveal>
          ))}
        </div>

        <Reveal className="bp-colourway-cta">
          <p>{copy.colourways.note}</p>
          <div>
            <button
              type="button"
              className="bp-button"
              onClick={() => cart.add({ slug: "terrifit-v1", variantId: current.id, quantity: 1 })}
            >
              {copy.colourways.cta} · <span className="numeric">{price}</span>
            </button>
            <Link className="bp-link" href={`/${locale}/shop/terrifit-v1`}>
              {copy.hero.cta} <span aria-hidden>→</span>
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */

function Sensing({ copy }: { copy: PagesCopy["band"] }) {
  return (
    <section className="bp-sensing" id="sensing">
      <div className="tf-shell bp-split">
        <div className="bp-sticky">
          <Shot
            src={copy.sensing.image.src}
            alt={copy.sensing.image.alt}
            ratio={1}
            fit="cover"
            sizes="(max-width: 900px) 100vw, 46vw"
          />
        </div>
        <div className="bp-split-copy">
          <Reveal className="bp-section-head">
            <p className="bp-eyebrow">{copy.sensing.eyebrow}</p>
            <h2>{copy.sensing.title}</h2>
            <p className="bp-lede">{copy.sensing.body}</p>
          </Reveal>
          <ul className="bp-metric-list">
            {copy.sensing.metrics.map((metric, index) => (
              <Reveal as="li" key={metric.name} delay={Math.min(index, 5) * 0.04}>
                <strong>{metric.name}</strong>
                <p>{metric.detail}</p>
              </Reveal>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */

function DailyLoop({ copy }: { copy: PagesCopy["band"] }) {
  return (
    <section className="bp-loop bp-paper">
      <div className="tf-shell">
        <Reveal className="bp-section-head bp-center">
          <p className="bp-eyebrow">{copy.daily.eyebrow}</p>
          <h2>{copy.daily.title}</h2>
          <p className="bp-lede">{copy.daily.body}</p>
        </Reveal>
        <ol className="bp-loop-grid">
          {copy.daily.steps.map((step, index) => (
            <Reveal as="li" key={step.title} delay={index * 0.08}>
              <span className="numeric">{step.time}</span>
              <strong>{step.title}</strong>
              <p>{step.body}</p>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */

function Battery({ copy }: { copy: PagesCopy["band"] }) {
  return (
    <section className="bp-battery" id="battery">
      <div className="tf-shell">
        <Reveal className="bp-section-head">
          <p className="bp-eyebrow">{copy.battery.eyebrow}</p>
          <h2>{copy.battery.title}</h2>
          <p className="bp-lede">{copy.battery.body}</p>
        </Reveal>
        <div className="bp-battery-layout">
          <Reveal className="bp-battery-media">
            <Shot
              src={copy.battery.image.src}
              alt={copy.battery.image.alt}
              ratio={1.1}
              sizes="(max-width: 900px) 100vw, 44vw"
            />
          </Reveal>
          <div className="bp-battery-cards">
            {copy.battery.cards.map((card, index) => (
              <Reveal key={card.label} delay={index * 0.06}>
                <strong className="numeric">{card.value}</strong>
                <span>{card.label}</span>
                <p>{card.detail}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */

function Water({ copy }: { copy: PagesCopy["band"] }) {
  return (
    <section className="bp-water">
      <div className="bp-water-media">
        <Shot
          src={copy.water.image.src}
          alt={copy.water.image.alt}
          ratio={2.1}
          sizes="100vw"
        />
      </div>
      <div className="tf-shell bp-water-copy">
        <Reveal className="bp-section-head">
          <p className="bp-eyebrow">{copy.water.eyebrow}</p>
          <h2>{copy.water.title}</h2>
          <p className="bp-lede">{copy.water.body}</p>
        </Reveal>
        <div className="bp-water-grid">
          {copy.water.points.map((point, index) => (
            <Reveal key={point.title} delay={index * 0.06}>
              <strong>{point.title}</strong>
              <p>{point.body}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */

function Integrations({ copy }: { copy: PagesCopy["band"] }) {
  return (
    <section className="bp-integrations bp-paper" id="integrations">
      <div className="tf-shell">
        <Reveal className="bp-section-head bp-center">
          <p className="bp-eyebrow">{copy.integrations.eyebrow}</p>
          <h2>{copy.integrations.title}</h2>
          <p className="bp-lede">{copy.integrations.body}</p>
        </Reveal>
        <div className="bp-app-grid">
          {copy.integrations.apps.map((app, index) => (
            <Reveal as="article" key={app.name} delay={Math.min(index, 8) * 0.03}>
              <strong>{app.name}</strong>
              <p>{app.detail}</p>
            </Reveal>
          ))}
        </div>
        <Reveal className="bp-footnote">
          <p>{copy.integrations.footnote}</p>
        </Reveal>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */

function InTheBox({ copy }: { copy: PagesCopy["band"] }) {
  return (
    <section className="bp-box">
      <div className="tf-shell bp-split">
        <div className="bp-split-copy">
          <Reveal className="bp-section-head">
            <p className="bp-eyebrow">{copy.box.eyebrow}</p>
            <h2>{copy.box.title}</h2>
          </Reveal>
          <ul className="bp-box-list">
            {copy.box.items.map((item, index) => (
              <Reveal as="li" key={item.name} delay={index * 0.05}>
                <strong>{item.name}</strong>
                <p>{item.detail}</p>
              </Reveal>
            ))}
          </ul>
        </div>
        <Reveal className="bp-box-media">
          <Shot
            src={copy.box.image.src}
            alt={copy.box.image.alt}
            ratio={0.86}
            sizes="(max-width: 900px) 100vw, 46vw"
          />
        </Reveal>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */

function Specs({ copy }: { copy: PagesCopy["band"] }) {
  return (
    <section className="bp-specs bp-paper" id="specs">
      <div className="tf-shell">
        <Reveal className="bp-section-head">
          <p className="bp-eyebrow">{copy.specsSection.eyebrow}</p>
          <h2>{copy.specsSection.title}</h2>
        </Reveal>
        <div className="bp-spec-groups">
          {copy.specsSection.groups.map((group, index) => (
            <Reveal as="article" key={group.title} delay={index * 0.05}>
              <h3>{group.title}</h3>
              <dl>
                {group.rows.map(([label, value]) => (
                  <div key={label}>
                    <dt>{label}</dt>
                    <dd className="numeric">{value}</dd>
                  </div>
                ))}
              </dl>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */

function Privacy({ locale, copy }: { locale: Locale; copy: PagesCopy["band"] }) {
  return (
    <section className="bp-privacy">
      <div className="tf-shell">
        <Reveal>
          <h2>{copy.privacy.title}</h2>
          <p>{copy.privacy.body}</p>
          <Link className="bp-link" href={`/${locale}/privacy`}>
            {copy.privacy.cta} <span aria-hidden>→</span>
          </Link>
        </Reveal>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */

function FinalCta({ locale, copy }: { locale: Locale; copy: PagesCopy["band"] }) {
  return (
    <section className="bp-cta">
      <div className="tf-shell">
        <Reveal className="bp-center">
          <p className="bp-eyebrow">{copy.cta.eyebrow}</p>
          <h2>{copy.cta.title}</h2>
          <p className="bp-lede">{copy.cta.body}</p>
          <div className="bp-hero-actions bp-center-actions">
            <Link className="bp-button" href={`/${locale}/shop/terrifit-v1`}>
              {copy.cta.primary}
            </Link>
            <Link className="bp-link" href={`/${locale}#waitlist`}>
              {copy.cta.secondary} <span aria-hidden>→</span>
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
