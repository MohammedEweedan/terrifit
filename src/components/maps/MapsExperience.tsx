"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { useMemo, useState } from "react";
import type { Locale } from "@/i18n/config";
import type { PagesCopy } from "@/i18n/pages";
import { Shot } from "@/components/ui/Shot";
import { ProgressionChart, type Point } from "@/components/maps/ProgressionChart";

const EASE = [0.22, 1, 0.36, 1] as const;

/** Twelve weeks of a strength block. Weeks 10–11 are flat: the Map deloaded. */
const PROGRESSION: Point[] = [
  { week: 1, value: 132 },
  { week: 2, value: 135 },
  { week: 3, value: 139 },
  { week: 4, value: 141 },
  { week: 5, value: 146 },
  { week: 6, value: 149 },
  { week: 7, value: 148, note: "one poor recovery week" },
  { week: 8, value: 153 },
  { week: 9, value: 157 },
  { week: 10, value: 157, note: "deload added automatically" },
  { week: 11, value: 158, note: "deload added automatically" },
  { week: 12, value: 165 },
];

export function MapsExperience({ locale, copy }: { locale: Locale; copy: PagesCopy["maps"] }) {
  return (
    <div className="mp">
      <Hero copy={copy} />
      <Stats items={copy.stats} />
      <Anatomy copy={copy} />
      <ExerciseDetail copy={copy} />
      <Progression copy={copy} />
      <FormTracking copy={copy} />
      <Library locale={locale} copy={copy} />
      <Creators locale={locale} copy={copy} />
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

function Hero({ copy }: { copy: PagesCopy["maps"] }) {
  return (
    <header className="mp-hero">
      <div className="mp-hero-media">
        <Shot src={copy.hero.image.src} alt={copy.hero.image.alt} ratio={1.5} priority sizes="100vw" />
      </div>
      <div className="tf-shell mp-hero-copy">
        <p className="mp-eyebrow">{copy.hero.eyebrow}</p>
        <h1>{copy.hero.title}</h1>
        <p className="mp-lede">{copy.hero.sub}</p>
        <div className="mp-actions">
          <a className="mp-button" href="#library">
            {copy.hero.primary}
          </a>
          <a className="mp-link" href="#anatomy">
            {copy.hero.secondary} <span aria-hidden>→</span>
          </a>
        </div>
      </div>
    </header>
  );
}

function Stats({ items }: { items: PagesCopy["maps"]["stats"] }) {
  return (
    <section className="mp-stats">
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

/** The four layers, as tabs. Keyboard arrows move between them. */
function Anatomy({ copy }: { copy: PagesCopy["maps"] }) {
  const [open, setOpen] = useState(0);
  const layers = copy.anatomy.layers;
  const current = layers[open];

  function onKeyDown(event: React.KeyboardEvent) {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
    event.preventDefault();
    setOpen((index) => (index + (event.key === "ArrowRight" ? 1 : layers.length - 1)) % layers.length);
  }

  return (
    <section className="mp-anatomy mp-paper" id="anatomy">
      <div className="tf-shell">
        <Reveal className="mp-section-head">
          <p className="mp-eyebrow">{copy.anatomy.eyebrow}</p>
          <h2>{copy.anatomy.title}</h2>
          <p className="mp-lede">{copy.anatomy.body}</p>
        </Reveal>

        <div className="mp-anatomy-body">
          <div className="mp-layer-tabs" role="tablist" aria-label={copy.anatomy.title} onKeyDown={onKeyDown}>
            {layers.map((layer, index) => (
              <button
                key={layer.key}
                type="button"
                role="tab"
                id={`layer-tab-${layer.key}`}
                aria-selected={index === open}
                aria-controls={`layer-panel-${layer.key}`}
                tabIndex={index === open ? 0 : -1}
                className={index === open ? "is-active" : undefined}
                onClick={() => setOpen(index)}
              >
                <span className="numeric">0{index + 1}</span>
                <b>{layer.label}</b>
              </button>
            ))}
          </div>

          <div
            className="mp-layer-panel"
            role="tabpanel"
            id={`layer-panel-${current.key}`}
            aria-labelledby={`layer-tab-${current.key}`}
          >
            <h3>{current.title}</h3>
            <p>{current.body}</p>
            <ul>
              {current.detail.map((row) => (
                <li key={row}>{row}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */

function ExerciseDetail({ copy }: { copy: PagesCopy["maps"] }) {
  const detail = copy.exercise;
  return (
    <section className="mp-exercise">
      <div className="tf-shell">
        <Reveal className="mp-section-head">
          <p className="mp-eyebrow">{detail.eyebrow}</p>
          <h2>{detail.title}</h2>
          <p className="mp-lede">{detail.body}</p>
        </Reveal>

        <div className="mp-exercise-grid">
          <Reveal className="mp-exercise-media">
            <Shot src={detail.video.src} alt={detail.video.alt} ratio={1.6} sizes="(max-width: 900px) 100vw, 52vw" />
            <div className="mp-tempo">
              <span>{detail.tempoTitle}</span>
              <p>{detail.tempo}</p>
            </div>
          </Reveal>

          <div className="mp-exercise-notes">
            <Reveal>
              <h3>{detail.cuesTitle}</h3>
              <ol className="mp-cues">
                {detail.cues.map((cue, index) => (
                  <li key={cue}>
                    <span className="numeric">{index + 1}</span>
                    {cue}
                  </li>
                ))}
              </ol>
            </Reveal>
            <Reveal delay={0.08}>
              <h3>{detail.faultsTitle}</h3>
              <ul className="mp-faults">
                {detail.faults.map((fault) => (
                  <li key={fault}>{fault}</li>
                ))}
              </ul>
            </Reveal>
            <Reveal delay={0.14}>
              <h3>{detail.subsTitle}</h3>
              <ul className="mp-subs">
                {detail.subs.map((sub) => (
                  <li key={sub}>{sub}</li>
                ))}
              </ul>
            </Reveal>
          </div>

          <Reveal className="mp-band-readout" delay={0.1}>
            <h3>{detail.bandTitle}</h3>
            <dl>
              {detail.bandRows.map(([label, value]) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd className="numeric">{value}</dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */

function Progression({ copy }: { copy: PagesCopy["maps"] }) {
  return (
    <section className="mp-progression">
      <div className="tf-shell mp-progression-grid">
        <div>
          <Reveal className="mp-section-head">
            <p className="mp-eyebrow">{copy.progression.eyebrow}</p>
            <h2>{copy.progression.title}</h2>
            <p className="mp-lede">{copy.progression.body}</p>
          </Reveal>
          <ul className="mp-point-list">
            {copy.progression.points.map((point, index) => (
              <Reveal as="li" key={point.title} delay={index * 0.05}>
                <strong>{point.title}</strong>
                <p>{point.body}</p>
              </Reveal>
            ))}
          </ul>
        </div>
        <Reveal>
          <ProgressionChart
            points={PROGRESSION}
            unit={copy.progression.chartUnit}
            title={copy.progression.chartTitle}
            caption={copy.progression.chartCaption}
          />
        </Reveal>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */

function FormTracking({ copy }: { copy: PagesCopy["maps"] }) {
  return (
    <section className="mp-form mp-paper">
      <div className="tf-shell">
        <div className="mp-form-top">
          <Reveal className="mp-section-head">
            <p className="mp-eyebrow">{copy.form.eyebrow}</p>
            <h2>{copy.form.title}</h2>
            <p className="mp-lede">{copy.form.body}</p>
          </Reveal>
          <Reveal className="mp-form-media" delay={0.08}>
            <Shot src={copy.form.image.src} alt={copy.form.image.alt} ratio={1.25} sizes="(max-width: 900px) 100vw, 42vw" />
          </Reveal>
        </div>
        <div className="mp-form-grid">
          {copy.form.points.map((point, index) => (
            <Reveal as="article" key={point.title} delay={index * 0.05}>
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

function Library({ locale, copy }: { locale: Locale; copy: PagesCopy["maps"] }) {
  const [filter, setFilter] = useState(copy.library.filters[0]);
  const [query, setQuery] = useState("");

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return copy.library.items.filter((item) => {
      const matchesType = filter === copy.library.filters[0] || item.type === filter;
      if (!matchesType) return false;
      if (!needle) return true;
      return (
        item.name.toLowerCase().includes(needle) ||
        item.creator.toLowerCase().includes(needle) ||
        item.summary.toLowerCase().includes(needle) ||
        item.equipment.toLowerCase().includes(needle)
      );
    });
  }, [copy.library.filters, copy.library.items, filter, query]);

  return (
    <section className="mp-library" id="library">
      <div className="tf-shell">
        <Reveal className="mp-section-head">
          <p className="mp-eyebrow">{copy.library.eyebrow}</p>
          <h2>{copy.library.title}</h2>
          <p className="mp-lede">{copy.library.body}</p>
        </Reveal>

        <div className="mp-library-tools">
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={copy.library.searchPlaceholder}
            aria-label={copy.library.searchPlaceholder}
          />
          <div role="group" aria-label={copy.library.eyebrow}>
            {copy.library.filters.map((label) => (
              <button
                key={label}
                type="button"
                aria-pressed={filter === label}
                className={filter === label ? "is-active" : undefined}
                onClick={() => setFilter(label)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {visible.length === 0 ? (
          <p className="mp-empty">{copy.library.empty}</p>
        ) : (
          <div className="mp-map-grid">
            {visible.map((item, index) => (
              <Reveal as="article" key={item.slug} delay={Math.min(index, 5) * 0.05}>
                <div className="mp-map-media">
                  <Shot src={item.image.src} alt={item.image.alt} ratio={1.4} sizes="(max-width: 900px) 100vw, 32vw" />
                  <span className="mp-map-type">{item.type}</span>
                </div>
                <div className="mp-map-body">
                  <header>
                    <h3>{item.name}</h3>
                    <strong className="numeric">{item.price}</strong>
                  </header>
                  <p className="mp-map-summary">{item.summary}</p>
                  <dl className="mp-map-meta">
                    <div>
                      <dt>{copy.library.levelLabel}</dt>
                      <dd>{item.level}</dd>
                    </div>
                    <div>
                      <dt>{copy.library.daysLabel}</dt>
                      <dd className="numeric">{item.days}</dd>
                    </div>
                    <div>
                      <dt>{copy.library.weeksLabel}</dt>
                      <dd className="numeric">{item.weeks}</dd>
                    </div>
                  </dl>
                  <footer>
                    <span>
                      {copy.library.byLabel} <b>{item.creator}</b>
                    </span>
                    <span className="numeric">
                      ★ {item.rating} · {item.reviews.toLocaleString()}
                    </span>
                  </footer>
                  <Link className="mp-link" href={`/${locale}#waitlist`}>
                    {copy.library.viewMap} <span aria-hidden>→</span>
                  </Link>
                </div>
              </Reveal>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */

function Creators({ locale, copy }: { locale: Locale; copy: PagesCopy["maps"] }) {
  return (
    <section className="mp-creators">
      <div className="tf-shell">
        <Reveal>
          <p className="mp-eyebrow">{copy.creators.eyebrow}</p>
          <h2>{copy.creators.title}</h2>
          <p className="mp-lede">{copy.creators.body}</p>
          <Link className="mp-button" href={`/${locale}/creators`}>
            {copy.creators.cta}
          </Link>
        </Reveal>
      </div>
    </section>
  );
}

function Cta({ locale, copy }: { locale: Locale; copy: PagesCopy["maps"] }) {
  return (
    <section className="mp-cta">
      <div className="tf-shell">
        <Reveal className="mp-center">
          <h2>{copy.cta.title}</h2>
          <p className="mp-lede">{copy.cta.body}</p>
          <div className="mp-actions mp-center-actions">
            <a className="mp-button" href="#library">
              {copy.cta.primary}
            </a>
            <Link className="mp-link" href={`/${locale}/band`}>
              {copy.cta.secondary} <span aria-hidden>→</span>
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
