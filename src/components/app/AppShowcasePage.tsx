"use client";

import {
  motion, useReducedMotion, useScroll, useSpring, useTransform, type MotionValue,
} from "framer-motion";
import { AppConversion, DownloadLinks } from "./AppConversion";
import type { AppDownloads } from "@/lib/app-downloads";
import { useRef, useSyncExternalStore } from "react";
import type { Locale } from "@/i18n/config";
import type { PagesCopy } from "@/i18n/pages";
import { ACCENTS, findAccent, type AccentKey } from "@/lib/accents";
import { getAccent, getServerAccent, setAccent, subscribeAccent } from "@/lib/accent-store";
import { websiteCopy } from "@/i18n/website";
import { mediaUrl, mediaFallback } from "@/lib/media";

const compactQuery = "(max-width: 900px) and (max-height: 740px)";
const getCompactViewport = () => window.matchMedia(compactQuery).matches;
const getServerCompactViewport = () => false;
function subscribeCompactViewport(listener: () => void) {
  const media = window.matchMedia(compactQuery);
  media.addEventListener("change", listener);
  return () => media.removeEventListener("change", listener);
}

/*
 * The app page. The main converter, so it is built to be watched rather than read.
 *
 * There is deliberately no web app being sold here — reading a proprietary
 * sensor over Bluetooth is something only a native app can do, so a browser
 * version would be a worse copy of the thing that matters.
 *
 * Two decisions worth keeping:
 *
 *  - **No device frame.** A CSS bezel is a drawing of a phone that is never
 *    quite the phone anyone owns, and it steals contrast from the screen it
 *    surrounds. The capture is shown as itself, cornered and lifted off the
 *    page with a shadow.
 *  - **The picker changes the screenshots and nothing else.** Every accent is a
 *    real capture of that build, so choosing Mint shows the Mint app while the
 *    site stays Terrifit orange. A CSS filter would have dragged the recovery,
 *    strain and sleep rings with it, and those colours carry meaning.
 */

export function AppShowcasePage({
  locale,
  copy, downloads, monthly,
}: {
  locale: Locale;
  downloads: AppDownloads;
  monthly: string;
  copy: PagesCopy["appPage"];
}) {
  const reduce = useReducedMotion();
  const compact = useSyncExternalStore(subscribeCompactViewport, getCompactViewport, getServerCompactViewport);
  // From the store rather than an effect: the value lives in localStorage, and
  // reading it in an effect would render once with the default and flash the
  // wrong screenshot before correcting itself.
  const accent = useSyncExternalStore(subscribeAccent, getAccent, getServerAccent);

  /**
   * Which capture to show.
   *
   * Arabic has its own set, because right-to-left is the part of the
   * localisation worth proving and a screenshot in English under Arabic copy
   * proves the opposite. Every other locale falls back to the accent set —
   * capturing ten screens in ten languages and ten colours is a thousand
   * images for a point one language already makes.
   */
  const shot = (screen: string) =>
    locale === "ar" ? `/media/app/shots/ar-${screen}.jpg` : `/media/app/shots/${accent}-${screen}.jpg`;

  return (
    <div className="ax">
      <nav className="ax-local-nav" aria-label={copy.hero.eyebrow}>
        <div className="ax-shell">
          <strong>{copy.hero.eyebrow}</strong>
          <div>
            <a href="#inside">{websiteCopy(locale).insideApp}</a>
            {locale !== "ar" && <a href="#personalise">Make it yours</a>}
            <a href="#get-app">{websiteCopy(locale).getApp} ↗</a>
          </div>
        </div>
      </nav>
      <Hero copy={copy} locale={locale} shot={shot(copy.chapters[0].screen)} reduce={Boolean(reduce)} downloads={downloads} />

      {reduce || compact ? (
        <section className="ax-static ax-shell" id="inside">
          {copy.chapters.map((chapter) => (
            <article key={chapter.title}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="ax-shot" src={mediaUrl(shot(chapter.screen))} alt={chapter.title} loading="lazy" decoding="async"
          onError={(event) => {
            const img = event.currentTarget;
            const local = mediaFallback(img.src);
            if (local !== img.src) img.src = local;
          }} />
              <div>
                <p className="ax-kicker">{chapter.kicker}</p>
                <h2>{chapter.title}</h2>
                <p>{chapter.body}</p>
              </div>
            </article>
          ))}
        </section>
      ) : (
        <Story copy={copy} shot={shot} />
      )}

      <Tint copy={copy} accent={accent} onChoose={setAccent} disabled={locale === "ar"} shot={shot("home")} />

      <section className="ax-features" id="reads">
        <div className="ax-shell">
          <p className="ax-eyebrow">{copy.features.eyebrow}</p>
          <h2>{copy.features.title}</h2>
          <dl>
            {copy.features.items.map((item, index) => (
              <Feature key={item.name} item={item} index={index} />
            ))}
          </dl>
        </div>
      </section>

      <AppConversion locale={locale} downloads={downloads} monthly={monthly}/>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function Hero({
  copy, locale, shot, reduce, downloads,
}: {
  copy: PagesCopy["appPage"]; locale: Locale; shot: string; reduce: boolean; downloads: AppDownloads;
}) {
  const ease = [0.22, 1, 0.36, 1] as const;
  const rise = (delay: number) =>
    reduce ? {} : { initial: { opacity: 0, y: 18 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.65, ease, delay } };

  return (
    <header className="ax-hero">
      <div className="ax-shell ax-hero-grid"><div className="ax-hero-copy-block">
        <motion.p className="ax-eyebrow" {...rise(0)}>{copy.hero.eyebrow}</motion.p>
        <motion.h1 {...rise(0.06)}>{copy.hero.title}</motion.h1>
        <motion.p className="ax-lede" {...rise(0.13)}>{copy.hero.sub}</motion.p>
        <motion.div className="ax-hero-actions" {...rise(0.2)}>
          <DownloadLinks locale={locale} downloads={downloads} placement="app-hero"/>
          <a className="ax-text-link" href="#reads">{copy.hero.secondary} <span aria-hidden>↓</span></a>
        </motion.div>

        <p className="ax-availability">{websiteCopy(locale).appAvailability}</p>
        </div>
        {/* The screen comes up from below and stays cropped by the fold, so it
            reads as the top of something and pulls the eye down. */}
        <motion.div
          className="ax-hero-shot"
          initial={reduce ? false : { opacity: 0, y: 80, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 1, ease, delay: 0.28 }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="ax-shot" src={mediaUrl(shot)} alt={copy.hero.title} fetchPriority="high" decoding="async"
          onError={(event) => {
            const img = event.currentTarget;
            const local = mediaFallback(img.src);
            if (local !== img.src) img.src = local;
          }} />
        </motion.div>
      </div>
    </header>
  );
}

/**
 * The pinned sequence.
 *
 * The screen changes with the copy, so each chapter is showing the thing it
 * describes. Screens are stacked in one grid cell and cross-faded rather than
 * swapped, so no chapter ever opens on an empty frame.
 */
function Story({
  copy, shot,
}: {
  copy: PagesCopy["appPage"];
  shot: (screen: string) => string;
}) {
  const count = copy.chapters.length;
  const storyRef = useRef<HTMLDivElement>(null);
  const {scrollYProgress:scroll}=useScroll({target:storyRef,offset:["start start","end end"]});
  // Springing the raw scroll is most of what separates "scroll-linked" from
  // "designed": the cross-fade glides between chapters instead of tracking the
  // wheel one-to-one.
  const progress = useSpring(scroll, { stiffness: 90, damping: 26, mass: 0.4 });

  return (
    <section className="ax-story" id="inside" aria-label={copy.hero.eyebrow}>
      <div ref={storyRef} className="ax-track" style={{ height: `${(count + 1) * 100}vh` }}>
        <div className="ax-stage ax-shell">
          <div className="ax-screens">
            {copy.chapters.map((chapter, index) => (
              <Screen
                key={chapter.screen}
                src={mediaUrl(shot(chapter.screen))}
                alt={chapter.title}
                index={index}
                count={count}
                progress={progress}
                priority={index === 0}
              />
            ))}
          </div>

          <div className="ax-chapters">
            {copy.chapters.map((chapter, index) => (
              <Chapter key={chapter.title} chapter={chapter} index={index} count={count} progress={progress} />
            ))}
            <ol className="ax-pips" aria-hidden>
              {copy.chapters.map((chapter, index) => (
                <Pip key={chapter.title} index={index} count={count} progress={progress} />
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}

/** Windows a value into the slice of the track its chapter owns. */
function useChapterRange(index: number, count: number, progress: MotionValue<number>) {
  const span = 1 / (count + 1);
  const start = span * (index + 1);
  return { span, start, progress };
}

function Screen({
  src, alt, index, count, progress, priority,
}: {
  src: string; alt: string; index: number; count: number;
  progress: MotionValue<number>; priority?: boolean;
}) {
  const { span, start } = useChapterRange(index, count, progress);
  const opacity = useTransform(
    progress,
    [start - span * 0.8, start - span * 0.22, start + span * 0.6, start + span],
    [index === 0 ? 1 : 0, 1, 1, index === count - 1 ? 1 : 0],
  );
  const scale = useTransform(
    progress,
    [start - span * 0.8, start - span * 0.22],
    [index === 0 ? 1 : 0.97, 1],
  );

  return (
    <motion.img
      className="ax-shot"
      src={src}
      onError={(event) => {
        const img = event.currentTarget;
        const local = mediaFallback(img.src);
        if (local !== img.src) img.src = local;
      }}
      alt={alt}
      style={{ opacity, scale }}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
    />
  );
}

function Chapter({
  chapter, index, count, progress,
}: {
  chapter: PagesCopy["appPage"]["chapters"][number];
  index: number; count: number; progress: MotionValue<number>;
}) {
  const { span, start } = useChapterRange(index, count, progress);
  const opacity = useTransform(
    progress,
    [start - span * 0.7, start - span * 0.18, start + span * 0.55, start + span * 0.92],
    [index === 0 ? 1 : 0, 1, 1, index === count - 1 ? 1 : 0],
  );
  const y = useTransform(progress, [start - span * 0.7, start - span * 0.18], [26, 0]);

  return (
    <motion.article className="ax-chapter" style={{ opacity, y }}>
      <p className="ax-kicker">{chapter.kicker}</p>
      <h2>{chapter.title}</h2>
      <p>{chapter.body}</p>
    </motion.article>
  );
}

function Pip({ index, count, progress }: { index: number; count: number; progress: MotionValue<number> }) {
  const { span, start } = useChapterRange(index, count, progress);
  const stops = [start - span * 0.6, start - span * 0.15, start + span * 0.6, start + span];
  const opacity = useTransform(progress, stops, [index === 0 ? 1 : 0.22, 1, 1, 0.22]);
  const width = useTransform(progress, stops, [index === 0 ? 30 : 12, 30, 30, 12]);
  return <motion.li style={{ opacity, width }} />;
}

/** The colour picker. It swaps the captures; it does not touch the site. */
function Tint({
  copy, accent, onChoose, disabled, shot,
}: {
  copy: PagesCopy["appPage"]; accent: AccentKey;
  onChoose: (key: AccentKey) => void;
  /** Arabic has one captured set, so the picker has nothing to change there. */
  disabled: boolean;
  shot: string;
}) {
  if (disabled) return null;
  return (
    <section className="ax-tint" id="personalise">
      <div className="ax-shell">
        <p className="ax-eyebrow">{copy.tint.eyebrow}</p>
        <h2>{copy.tint.title}</h2>
        <p className="ax-tint-body">{copy.tint.body}</p>

        <div className="ax-tint-preview">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="ax-shot" src={mediaUrl(shot)} alt={copy.tint.title} loading="lazy"
            onError={(event) => {
              const img = event.currentTarget;
              const local = mediaFallback(img.src);
              if (local !== img.src) img.src = local;
            }} />
        </div>
        <div className="ax-swatches" role="radiogroup" aria-label={copy.tint.title}>
          {ACCENTS.map((item) => (
            <button
              key={item.key}
              type="button"
              role="radio"
              aria-checked={item.key === accent}
              aria-label={item.name}
              title={item.name}
              className={item.key === accent ? "is-active" : undefined}
              onClick={() => onChoose(item.key)}
            >
              <span aria-hidden style={{ background: item.dark }} />
            </button>
          ))}
        </div>

        <motion.p key={accent} className="ax-tint-note" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {findAccent(accent).name} · {copy.tint.note}
        </motion.p>
      </div>
    </section>
  );
}

function Feature({ item, index }: { item: { name: string; detail: string }; index: number }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: (index % 3) * 0.07 }}
    >
      <dt>{item.name}</dt>
      <dd>{item.detail}</dd>
    </motion.div>
  );
}
