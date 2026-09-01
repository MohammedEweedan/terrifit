"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { useState } from "react";
import type { Locale } from "@/i18n/config";
import type { PagesCopy } from "@/i18n/pages";
import { Shot } from "@/components/ui/Shot";
import { EarningsCalculator } from "@/components/creators/EarningsCalculator";

const EASE = [0.22, 1, 0.36, 1] as const;

export function CreatorsExperience({ locale, copy }: { locale: Locale; copy: PagesCopy["creators"] }) {
  return (
    <div className="cr">
      <Hero locale={locale} copy={copy} />
      <Stats items={copy.stats} />
      <Why copy={copy} />
      <Feeds copy={copy} />
      <Channels copy={copy} />
      <Figures copy={copy} />
      <Calculator locale={locale} copy={copy} />
      <Tools copy={copy} />
      <Payouts copy={copy} />
      <Steps locale={locale} copy={copy} />
      <Voices copy={copy} />
      <Faq copy={copy} />
      <Cta locale={locale} copy={copy} />
    </div>
  );
}

function Reveal({
  children,
  delay = 0,
  className,
  as = "div",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  as?: "div" | "li" | "article";
}) {
  const reduced = useReducedMotion();
  const Tag = motion[as];
  return (
    <Tag
      className={className}
      initial={reduced ? false : { opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-12% 0px" }}
      transition={{ duration: 0.68, ease: EASE, delay }}
    >
      {children}
    </Tag>
  );
}

/* -------------------------------------------------------------------------- */

function Hero({ locale, copy }: { locale: Locale; copy: PagesCopy["creators"] }) {
  return (
    <header className="cr-hero">
      <div className="tf-shell cr-hero-inner">
        <div className="cr-hero-copy">
          <p className="cr-eyebrow">{copy.hero.eyebrow}</p>
          <h1>{copy.hero.title}</h1>
          <p className="cr-lede">{copy.hero.sub}</p>
          <div className="cr-actions">
            <Link className="cr-button" href={`/${locale}#waitlist`}>
              {copy.hero.primary}
            </Link>
            <a className="cr-link" href="#earnings">
              {copy.hero.secondary} <span aria-hidden>→</span>
            </a>
          </div>
        </div>
        <div className="cr-hero-media">
          <Shot src={copy.hero.image.src} alt={copy.hero.image.alt} ratio={0.86} priority sizes="(max-width: 900px) 100vw, 44vw" />
        </div>
      </div>
    </header>
  );
}

function Stats({ items }: { items: PagesCopy["creators"]["stats"] }) {
  return (
    <section className="cr-stats">
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

function Why({ copy }: { copy: PagesCopy["creators"] }) {
  return (
    <section className="cr-why cr-paper">
      <div className="tf-shell">
        <Reveal className="cr-section-head">
          <p className="cr-eyebrow">{copy.why.eyebrow}</p>
          <h2>{copy.why.title}</h2>
          <p className="cr-lede">{copy.why.body}</p>
        </Reveal>
        <div className="cr-why-grid">
          {copy.why.cards.map((card, index) => (
            <Reveal as="article" key={card.title} delay={index * 0.06}>
              <span className="numeric">0{index + 1}</span>
              <strong>{card.title}</strong>
              <p>{card.body}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */

function Feeds({ copy }: { copy: PagesCopy["creators"] }) {
  const columns = [copy.feeds.public, copy.feeds.private] as const;
  return (
    <section className="cr-feeds" id="feeds">
      <div className="tf-shell">
        <Reveal className="cr-section-head">
          <p className="cr-eyebrow">{copy.feeds.eyebrow}</p>
          <h2>{copy.feeds.title}</h2>
          <p className="cr-lede">{copy.feeds.body}</p>
        </Reveal>
        <div className="cr-feed-grid">
          {columns.map((column, index) => (
            <Reveal as="article" key={column.label} delay={index * 0.08} className={index === 1 ? "is-premium" : undefined}>
              <header>
                <span>{column.label}</span>
                <strong>{column.price}</strong>
              </header>
              <h3>{column.title}</h3>
              <p>{column.body}</p>
              <ul>
                {column.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function Channels({ copy }: { copy: PagesCopy["creators"] }) {
  return (
    <section className="cr-channels cr-paper">
      <div className="tf-shell cr-channels-top">
        <Reveal className="cr-section-head">
          <p className="cr-eyebrow">{copy.channels.eyebrow}</p>
          <h2>{copy.channels.title}</h2>
          <p className="cr-lede">{copy.channels.body}</p>
        </Reveal>
        <Reveal className="cr-channels-media" delay={0.08}>
          <Shot src={copy.channels.image.src} alt={copy.channels.image.alt} ratio={0.72} sizes="(max-width: 900px) 100vw, 34vw" />
        </Reveal>
      </div>
      <div className="tf-shell cr-channel-grid">
        {copy.channels.items.map((item, index) => (
          <Reveal as="article" key={item.title} delay={index * 0.05}>
            <strong>{item.title}</strong>
            <p>{item.body}</p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */

function Figures({ copy }: { copy: PagesCopy["creators"] }) {
  // Sharing is opt-in, so the panel demonstrates that: switch it off and the
  // numbers disappear, which is exactly what a creator sees when a member
  // revokes access.
  const [shared, setShared] = useState(true);

  return (
    <section className="cr-figures">
      <div className="tf-shell">
        <Reveal className="cr-section-head">
          <p className="cr-eyebrow">{copy.figures.eyebrow}</p>
          <h2>{copy.figures.title}</h2>
          <p className="cr-lede">{copy.figures.body}</p>
        </Reveal>

        <div className="cr-figures-layout">
          <Reveal className="cr-figures-panel">
            <div className="cr-figures-head">
              <div>
                <strong>Maya R.</strong>
                <span>Strength Foundation · week 7</span>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={shared}
                className={`cr-switch ${shared ? "is-on" : ""}`}
                onClick={() => setShared((value) => !value)}
              >
                <i aria-hidden />
                <span>{shared ? "Sharing on" : "Sharing off"}</span>
              </button>
            </div>
            <dl className={shared ? "" : "is-hidden"}>
              {copy.figures.shared.map((metric) => (
                <div key={metric.label}>
                  <dt>{metric.label}</dt>
                  <dd className="numeric">{shared ? metric.value : "——"}</dd>
                  <p>{shared ? metric.note : "Not shared"}</p>
                </div>
              ))}
            </dl>
          </Reveal>

          <Reveal className="cr-consent" delay={0.08}>
            <h3>{copy.figures.consent.title}</h3>
            <ul>
              {copy.figures.consent.points.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */

function Calculator({ locale, copy }: { locale: Locale; copy: PagesCopy["creators"] }) {
  return (
    <section className="cr-calc-section cr-paper" id="earnings">
      <div className="tf-shell">
        <Reveal className="cr-section-head">
          <p className="cr-eyebrow">{copy.calculator.eyebrow}</p>
          <h2>{copy.calculator.title}</h2>
          <p className="cr-lede">{copy.calculator.body}</p>
        </Reveal>
        <EarningsCalculator locale={locale} copy={copy.calculator} />
      </div>
    </section>
  );
}

function Tools({ copy }: { copy: PagesCopy["creators"] }) {
  return (
    <section className="cr-tools">
      <div className="tf-shell">
        <Reveal className="cr-section-head">
          <p className="cr-eyebrow">{copy.tools.eyebrow}</p>
          <h2>{copy.tools.title}</h2>
        </Reveal>
        <div className="cr-tool-grid">
          {copy.tools.items.map((item, index) => (
            <Reveal as="article" key={item.title} delay={index * 0.05}>
              <strong>{item.title}</strong>
              <p>{item.body}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function Payouts({ copy }: { copy: PagesCopy["creators"] }) {
  return (
    <section className="cr-payouts cr-paper">
      <div className="tf-shell">
        <Reveal className="cr-section-head">
          <p className="cr-eyebrow">{copy.payouts.eyebrow}</p>
          <h2>{copy.payouts.title}</h2>
        </Reveal>
        <dl className="cr-payout-list">
          {copy.payouts.rows.map(([label, value], index) => (
            <Reveal key={label} delay={index * 0.04}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </Reveal>
          ))}
        </dl>
        <Reveal className="cr-payout-note">
          <p>{copy.payouts.note}</p>
        </Reveal>
      </div>
    </section>
  );
}

function Steps({ locale, copy }: { locale: Locale; copy: PagesCopy["creators"] }) {
  return (
    <section className="cr-steps">
      <div className="tf-shell">
        <Reveal className="cr-section-head">
          <p className="cr-eyebrow">{copy.steps.eyebrow}</p>
          <h2>{copy.steps.title}</h2>
        </Reveal>
        <ol className="cr-step-list">
          {copy.steps.items.map((item, index) => (
            <Reveal as="li" key={item.title} delay={index * 0.06}>
              <span className="numeric">0{index + 1}</span>
              <strong>{item.title}</strong>
              <p>{item.body}</p>
            </Reveal>
          ))}
        </ol>
        <Reveal>
          <Link className="cr-button" href={`/${locale}#waitlist`}>
            {copy.steps.cta}
          </Link>
        </Reveal>
      </div>
    </section>
  );
}

function Voices({ copy }: { copy: PagesCopy["creators"] }) {
  return (
    <section className="cr-voices cr-paper">
      <div className="tf-shell">
        <Reveal className="cr-section-head">
          <p className="cr-eyebrow">{copy.voices.eyebrow}</p>
          <h2>{copy.voices.title}</h2>
        </Reveal>
        <div className="cr-voice-grid">
          {copy.voices.items.map((item, index) => (
            <Reveal as="article" key={item.name} delay={index * 0.07}>
              <blockquote>{item.quote}</blockquote>
              <footer>
                <strong>{item.name}</strong>
                <span>{item.role}</span>
              </footer>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function Faq({ copy }: { copy: PagesCopy["creators"] }) {
  return (
    <section className="cr-faq">
      <div className="tf-shell">
        <Reveal className="cr-section-head">
          <p className="cr-eyebrow">{copy.faq.eyebrow}</p>
          <h2>{copy.faq.title}</h2>
        </Reveal>
        <div className="cr-faq-list">
          {copy.faq.items.map((item, index) => (
            <Reveal key={item.q} delay={Math.min(index, 4) * 0.04}>
              <details>
                <summary>{item.q}</summary>
                <p>{item.a}</p>
              </details>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function Cta({ locale, copy }: { locale: Locale; copy: PagesCopy["creators"] }) {
  return (
    <section className="cr-cta">
      <div className="tf-shell cr-center">
        <Reveal>
          <p className="cr-eyebrow">{copy.cta.eyebrow}</p>
          <h2>{copy.cta.title}</h2>
          <p className="cr-lede">{copy.cta.body}</p>
          <div className="cr-actions cr-center-actions">
            <Link className="cr-button" href={`/${locale}#waitlist`}>
              {copy.cta.primary}
            </Link>
            <Link className="cr-link" href={`/${locale}/contact`}>
              {copy.cta.secondary} <span aria-hidden>→</span>
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
