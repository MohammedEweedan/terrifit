"use client";

import { AnimatePresence, motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import Image, { type StaticImageData } from "next/image";
import Link from "next/link";
import { createContext, useCallback, useContext, useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { Dictionary } from "@/i18n";
import { localeMeta, type Locale } from "@/i18n/config";
import type { MarketOption } from "@/lib/markets";
import { TerrifitHeader } from "@/components/navigation/TerrifitHeader";
import { TerrifitFooter } from "@/components/navigation/TerrifitFooter";
import { marketingDetails, marketingUi } from "@/i18n/marketing";
import { clearHash, getHash, getServerHash, subscribeHash } from "@/lib/hash";
import { TerrificWord, splitHeadline } from "@/components/brand/TerrificWord";
import { BandCallouts } from "@/components/band/BandCallouts";
import { LaunchRoadmap } from "@/components/marketing/LaunchRoadmap";
import { AnnouncementBar, type Announcement } from "@/components/marketing/AnnouncementBar";
import { getPagesCopy } from "@/i18n/pages";

import bandProduct from "../../../public/media/terrifit-band-new.png";
import heroDesktop from "../../../public/rebrand/desktop-bg-clean.png";
import heroMobile from "../../../public/rebrand/mobile-bg.png";
import boxer from "../../../public/rebrand/combos-boxer-clean.png";
import kettlebell from "../../../public/rebrand/faq-kettlebell-clean.png";
import cyclist from "../../../public/rebrand/whyus-cyclist-clean.png";
import shotHomeDark from "../../../public/media/app/home-dark.png";
import shotBandLight from "../../../public/media/app/band-light.png";
import shotMapsDark from "../../../public/media/app/maps-dark.png";
import { AppShowcase } from "@/components/platform/AppShowcase";
import trainWorkLive from "../../../public/media/train-work-live.jpg";


/**
 * The Maps on the landing page.
 *
 * These are the real Maps from `src/lib/maps/catalog.ts` — same names, same
 * coaches, same lengths — because the app screenshot two sections down shows
 * that catalogue and a visitor can read both. The previous list was six
 * invented programmes with invented star ratings, which the app contradicted
 * on the same page. Nothing here carries a rating: no Map has been reviewed yet
 * and a borrowed number is worse than no number.
 */
const mapCards: Array<{
  title: string;
  weeks: number;
  perWeek: number;
  level: string;
  creator: string;
  image: StaticImageData;
}> = [
  {
    title: "Hypertrophy Base",
    weeks: 12,
    perWeek: 4,
    level: "Returning",
    creator: "Dara Okafor",
    image: boxer,
  },
  {
    title: "Strength Five",
    weeks: 10,
    perWeek: 3,
    level: "Steady",
    creator: "Ivan Petrov",
    image: kettlebell,
  },
  {
    title: "Engine Builder",
    weeks: 8,
    perWeek: 5,
    level: "New",
    creator: "Nadia Haddad",
    image: cyclist,
  },
];

const products = [
  { name: "Recovery protein", brand: "TERRIFIT", creator: "Coach Alex", price: "$41.00", shape: "tub", partner: false },
  { name: "Pure creatine", brand: "TERRIFIT", creator: "Jordan Lee", price: "$34.00", shape: "jar", partner: false },
  { name: "Daily hydration", brand: "TERRIFIT", creator: "Maya Reyes", price: "$31.00", shape: "tin", partner: false },
  { name: "Triple omega-3", brand: "PIONEER LABS", creator: "Dr. Sam", price: "$29.00", shape: "amber", partner: true },
  { name: "Night magnesium", brand: "NORTHSTAR", creator: "Eli Hart", price: "$38.00", shape: "wide", partner: true },
];

const ease = [0.22, 1, 0.36, 1] as const;

const CopyContext = createContext<Dictionary | null>(null);

function useCopy() {
  const copy = useContext(CopyContext);
  if (!copy) throw new Error("Terrifit marketing copy is missing");
  return copy;
}

function openWaitlist(event?: React.MouseEvent) {
  event?.preventDefault();
  window.dispatchEvent(new CustomEvent("terrifit:open-waitlist"));
}

export function TerrifitLanding({
  locale,
  markets,
  copy,
  waitlistCount,
  announcement,
}: {
  locale: Locale;
  markets: MarketOption[];
  copy: Dictionary;
  /** Real signups, counted per request. Zero hides the card rather than faking one. */
  waitlistCount: number;
  /** One line of news under the header. Null once the offer closes. */
  announcement: Announcement | null;
}) {
  return (
    <CopyContext.Provider value={copy}><div className="tf-site">
      <TerrifitHeader locale={locale} copy={copy} />
      <AnnouncementBar announcement={announcement} />
      <main>
        <Hero locale={locale} />
        <MetricRail />
        <LaunchRoadmap locale={locale} copy={getPagesCopy(locale).roadmap} />
        <BandSection locale={locale} />
        <PlatformSection locale={locale} waitlistCount={waitlistCount} />
        <MapsSection locale={locale} />
        <LifestyleSection locale={locale} />
        <ShopSection locale={locale} />
        <FinalWaitlist locale={locale} markets={markets} />
      </main>
      <TerrifitFooter locale={locale} copy={copy} />
    </div></CopyContext.Provider>
  );
}

function Hero({ locale }: { locale: Locale }) {
  const copy = useCopy();
  const detail = marketingDetails[locale];
  const section = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: section, offset: ["start start", "end start"] });
  const imageY = useTransform(scrollYProgress, [0, 1], ["0%", reduce ? "0%" : "12%"]);

  return (
    <section ref={section} className="tf-hero" id="top">
      {/* No still behind the hero: the slogan sits on the brand's own black,
          and a looping clip of someone training in the band drops in here when
          the footage exists. */}
      <motion.div className="tf-hero-media" style={{ y: imageY }}>
        {/* Two crops, switched by CSS rather than by JavaScript, so the right
            one is in the markup for the preloader from the first byte. */}
        <Image className="tf-hero-still is-desktop" src={heroDesktop} alt="" fill preload placeholder="blur" sizes="100vw" />
        <Image className="tf-hero-still is-mobile" src={heroMobile} alt="" fill placeholder="blur" sizes="100vw" />
        {reduce ? null : (
          <video
            className="tf-hero-video"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            aria-hidden="true"
            onError={(event) => {
              event.currentTarget.hidden = true;
            }}
          >
            <source src="/media/hero-loop.mp4" type="video/mp4" />
            <source src="/media/hero-loop.webm" type="video/webm" />
          </video>
        )}
      </motion.div>
      <div className="tf-hero-shade" />

      <div className="tf-shell tf-hero-content">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.75, ease }}>
          <p className="tf-kicker"><span /> {copy.hero.eyebrow}</p>
          <h1>
            {/* The slogan carries the brand's own pun, so the word is animated
                rather than just set: see TerrificWord. Screen readers get the
                sentence as written. */}
            <HeroHeadline text={copy.hero.headline} />
          </h1>
          <p className="tf-hero-copy">
            {copy.hero.sub}
          </p>
          <div className="tf-hero-actions">
            <a className="tf-button" href="#waitlist" onClick={openWaitlist}>{copy.hero.primaryCta}</a>
            <a className="tf-ghost-button" href="#platform">{copy.hero.secondaryCta} <span>↘</span></a>
          </div>
        </motion.div>
      </div>

      <a className="tf-scroll-cue" href="#metrics" aria-label="Scroll to performance metrics">
        <span>{detail.common[9]}</span><i />
      </a>
    </section>
  );
}

function HeroHeadline({ text }: { text: string }) {
  const parts = splitHeadline(text, "terrific");
  if (!parts) return <>{text}</>;
  return (
    <>
      <span className="sr-only">{text}</span>
      <span aria-hidden>
        {parts.lead}
        <TerrificWord word={parts.match.toUpperCase()} />
        {parts.tail}
      </span>
    </>
  );
}


/**
 * The rail under the hero.
 *
 * It used to repeat the hero dashboard's four numbers verbatim — the same
 * recovery, strain, sleep and Map progress, twice on one screen. It now carries
 * what the hero cannot: what Terrifit actually is, in four claims.
 */
function MetricRail() {
  const copy = useCopy();
  return (
    <section id="metrics" className="tf-metric-rail" aria-label={copy.trustBar.items.map((item) => item.label).join(", ")}>
      <div className="tf-shell">
        {copy.trustBar.items.map((item, index) => (
          <motion.div key={item.label} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.08, ease }}>
            <strong>{item.value}</strong><small>{item.label}</small>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function BandSection({ locale }: { locale: Locale }) {
  const copy=useCopy(); const detail=marketingDetails[locale]; const pages=getPagesCopy(locale).band;
  return (
    <section id="band" className="tf-band-section tf-paper">
      <div className="tf-shell tf-band-layout">
        <SectionIntro
          kicker={detail.band[0]}
          title={detail.band[1]}
          body={detail.band[2]}
        />

        <div className="tf-band-visual">
          <BandCallouts
            image={bandProduct}
            alt="Terrifit V1 woven performance band with its side-glance display"
            copy={pages.callouts}
            title={pages.calloutsTitle}
          />
        </div>

        <Reveal className="tf-band-features">
          {[
            ["01", detail.band[3][0], copy.progress.body],
            ["02", detail.band[3][1], copy.prototypes.body],
            ["03", detail.band[3][2], copy.progress.disclaimerBody],
            ["04", detail.band[3][3], copy.hero.sub],
          ].map(([number, title, copy]) => (
            <div key={title}><span>{number}</span><div><strong>{title}</strong><p>{copy}</p></div></div>
          ))}
          <div className="tf-band-links">
            <Link className="tf-button" href={`/${locale}/band`}>{detail.band[4]}</Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/**
 * What the app does, in the app's own words.
 *
 * Written here rather than pulled from the community copy it used to borrow:
 * that block advertised livestreams and a feed, neither of which ship.
 */
const APP_CAPABILITIES = [
  { title: "Every score shows its working", body: "The inputs, the baselines they were measured against, and what the day was missing." },
  { title: "Reads Apple Health", body: "HRV, resting heart rate, sleep, steps and weight, with nothing to type in." },
  { title: "Maps you can actually run", body: "Sets, reps and weights logged as you go, carried forward to next week." },
] as const;

function PlatformSection({ locale, waitlistCount }: { locale: Locale; waitlistCount: number }) {
  const copy = useCopy();
  const ui = marketingUi[locale];
  const detail = marketingDetails[locale];
  return (
    <section id="platform" className="tf-platform tf-deep-section">
      <div className="tf-shell tf-platform-grid">
        <Reveal>
          <SectionIntro
            kicker={copy.prototypes.eyebrow}
            title={copy.prototypes.headline}
            body={copy.prototypes.body}
            inverse
          />
          <div className="tf-capability-list">
            {APP_CAPABILITIES.map((item, index) => (
              <div key={item.title}>
                <span>0{index + 1}</span>
                <div>
                  <strong>{item.title}</strong>
                  <p>{item.body}</p>
                </div>
              </div>
            ))}
          </div>
          <Link className="tf-outline-button" href={`/${locale}/platform`}>{detail.common[9]} {ui.nav[0]} <span>→</span></Link>
        </Reveal>

        <Reveal className="tf-app-stage">
          <div className="tf-app-caption"><span>{detail.app[0]}</span><b>{detail.app[1]}</b></div>
          <AppShowcase
            shots={[
              {
                src: shotHomeDark,
                label: "Today",
                note: "Your morning read, and the arithmetic behind it.",
                alt: "The Terrifit app in dark mode showing recovery, strain and sleep dials with heart-rate variability, resting heart rate and weight compared against personal baselines",
              },
              {
                src: shotBandLight,
                label: "Your V1",
                note: "The band you own, in the colourway you bought.",
                alt: "The Terrifit app in light mode showing a paired V1 band in the Midnight colourway inside a battery ring, with firmware, wearing arm and last sync",
              },
              {
                src: shotMapsDark,
                label: "Maps",
                note: "Programmes that adjust to what you actually lifted.",
                alt: "The Terrifit app in dark mode listing training Maps with their coach, length and weekly session count",
              },
            ]}
          />
          <div className="tf-store-release">
            <span>{ui.comingSoon}</span>
            <div>
              <button type="button" onClick={() => openWaitlist()}><small>{detail.app[2]}</small><b>App Store</b></button>
              <button type="button" onClick={() => openWaitlist()}><small>{detail.app[3]}</small><b>Google Play</b></button>
            </div>
          </div>
          {/* A real count, queried per request. This card used to render a
              hard-coded 24,891 under a "live network" label, on a pre-launch
              site whose store badges say "coming soon" — a fabricated user
              count is the one claim here with actual legal exposure. If nobody
              has joined yet the card does not render at all, because zero is
              honest and a placeholder is not. */}
          {waitlistCount > 0 ? (
            <div className="tf-live-card">
              <span>{detail.app[4]}</span>
              <strong>{waitlistCount.toLocaleString(localeMeta[locale].htmlLang)}</strong>
              <small>{detail.app[5]}</small>
            </div>
          ) : null}
        </Reveal>
      </div>
    </section>
  );
}

function MapsSection({ locale }: { locale: Locale }) {
  const copy = useCopy();
  const detail=marketingDetails[locale];
  return (
    <section id="maps" className="tf-maps tf-deep-section">
      <div className="tf-shell">
        <div className="tf-maps-heading">
          <SectionIntro kicker={copy.mapAnatomy.eyebrow} title={copy.mapAnatomy.headline} body={copy.mapAnatomy.body} inverse />
          <Link className="tf-outline-button" href={`/${locale}/maps`}>{detail.common[9]} {copy.mapAnatomy.eyebrow} <span>→</span></Link>
        </div>
        <div className="tf-map-scroller">
          {mapCards.map((map, index) => (
            <Reveal key={map.title} className="tf-map-card" delay={index * 0.08}>
              <Link href={`/${locale}/maps?map=${encodeURIComponent(map.title)}`} aria-label={`View ${map.title}`}>
                <Image src={map.image} alt="" placeholder="blur" sizes="(max-width: 700px) 84vw, 30vw" />
                <div className="tf-map-shade" />
                <div className="tf-map-card-top"><span>{map.level}</span><b>{map.perWeek}×/{detail.common[7].toLowerCase()}</b></div>
                <div className="tf-map-card-copy">
                  <small>{map.creator} <i>✓</i></small>
                  <h3>{map.title}</h3>
                  <div><span>{map.weeks} {detail.common[8]}</span><strong>{copy.mapAnatomy.eyebrow}</strong></div>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function LifestyleSection({locale}:{locale:Locale}) {
  const detail=marketingDetails[locale];
  return (
    <section className="tf-lifestyle" aria-label="Terrifit from training to everyday life">
      <Image src={trainWorkLive} alt="One athlete wearing Terrifit while training, working and at a formal event" placeholder="blur" sizes="100vw" />
      <div className="tf-lifestyle-shade" />
      <div className="tf-lifestyle-words"><span>{detail.lifestyle[0]}</span><i /><span>{detail.lifestyle[1]}</span><i /><span>{detail.lifestyle[2]}</span></div>
      <p>{detail.lifestyle[3]}</p>
    </section>
  );
}

function ShopSection({ locale }: { locale: Locale }) {
  const detail=marketingDetails[locale];
  return (
    <section id="shop" className="tf-shop tf-paper">
      <div className="tf-shell">
        <div className="tf-shop-heading">
          <SectionIntro kicker={detail.shop[0]} title={detail.shop[1]} body={detail.shop[2]} />
          <div className="tf-affiliate"><strong>{detail.shop[3]}</strong><span>{detail.shop[4]}</span></div>
          <Link className="tf-underlined" href={`/${locale}/shop`}>{detail.shop[5]} →</Link>
        </div>
        <div className="tf-product-scroller">
          {products.map((product, index) => (
            <Reveal key={product.name} className="tf-product-card" delay={index * 0.05}>
              <Link href={`/${locale}/shop?product=${encodeURIComponent(product.name)}`}>
                <div className={`tf-product-object ${product.shape} ${product.partner ? "partner" : ""}`}><i /><span>{product.brand}<br />{product.partner ? "PARTNER" : "PERFORMANCE"}</span></div>
                <small>{product.partner ? detail.shop[6] : detail.shop[7]} · {product.creator}</small><h3>{product.name}</h3><strong>{product.price}</strong>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalWaitlist({ locale, markets }: { locale: Locale; markets: MarketOption[] }) {
  const copy = useCopy();
  const ui = marketingUi[locale];
  const detail = marketingDetails[locale];
  // Opening from `/#waitlist` is driven by the fragment rather than copied into
  // state inside an effect, which would be a cascading render.
  const hash = useSyncExternalStore(subscribeHash, getHash, getServerHash);
  const [manuallyOpen, setManuallyOpen] = useState(false);
  const open = manuallyOpen || hash === "#waitlist";

  // Closing also drops the fragment, so a refresh does not reopen the modal the
  // visitor just dismissed.
  const closeWaitlist = useCallback(() => {
    setManuallyOpen(false);
    if (window.location.hash === "#waitlist") clearHash();
  }, []);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [country, setCountry] = useState("");
  const [role, setRole] = useState<"athlete" | "creator" | "partner">("athlete");
  const [organization, setOrganization] = useState("");
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const show = () => setManuallyOpen(true);
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && closeWaitlist();
    window.addEventListener("terrifit:open-waitlist", show);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("terrifit:open-waitlist", show);
      window.removeEventListener("keydown", onKey);
    };
  }, [closeWaitlist]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, [open]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !country || !consent) {
      setStatus("error");
      setMessage(!name.trim() || !country ? copy.waitlist.errors.required : !consent ? copy.waitlist.errors.consent : copy.waitlist.errors.email);
      return;
    }
    setStatus("loading");
    setMessage("");
    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(), email, country, locale, role,
          features: role === "creator" ? ["maps", "coaching", "communities", "livestreams"] : role === "partner" ? ["marketplace", "communities"] : ["maps", "coaching", "health", "communities"],
          consent: true, brandName: role === "partner" ? organization || name.trim() : "",
          source: "terrifit_launch_landing", referredByCode: "",
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error("request_failed");
      setStatus("success");
      setMessage(`${copy.waitlist.success.title} #${result.position}`);
    } catch {
      setStatus("error");
      setMessage(copy.waitlist.errors.generic);
    }
  }

  return (
    <section id="waitlist" className="tf-final-cta">
      <div className="tf-final-panel">
        <p className="tf-kicker"><span /> {copy.finalCta.eyebrow}</p>
        <h2>{copy.finalCta.headline}</h2>
        <p>{copy.finalCta.sub} {detail.waitlist[0]}</p>
        <button className="tf-button tf-open-waitlist" type="button" onClick={() => setManuallyOpen(true)}>{copy.finalCta.primary}</button>
      </div>

      <AnimatePresence>
        {open ? (
          <motion.div className="tf-waitlist-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={closeWaitlist}>
            <motion.div className="tf-waitlist-modal" role="dialog" aria-modal="true" aria-labelledby="waitlist-title" initial={{ opacity: 0, y: 24, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 16, scale: 0.98 }} transition={{ ease }} onClick={(event) => event.stopPropagation()}>
              <div className="tf-waitlist-modal-head">
                <div><span>{copy.waitlist.eyebrow}</span><h2 id="waitlist-title">{copy.waitlist.headline}</h2></div>
                <button type="button" onClick={closeWaitlist} aria-label="Close waitlist form">×</button>
              </div>

              {status === "success" ? (
                <motion.div className="tf-waitlist-success tf-modal-success" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                  <strong>{detail.waitlist[3]}</strong><span>{message}</span><p>{copy.waitlist.success.referralBody} {detail.waitlist[0]}</p>
                  <button className="tf-dark-button" type="button" onClick={closeWaitlist}>{detail.waitlist[4]}</button>
                </motion.div>
              ) : (
                <form onSubmit={submit} noValidate>
                  <fieldset className="tf-role-picker">
                    <legend>{copy.waitlist.roleLabel}</legend>
                    {[
                      ["athlete", copy.waitlist.roles.athlete.label, copy.waitlist.roles.athlete.note],
                      ["creator", copy.waitlist.roles.creator.label, copy.waitlist.roles.creator.note],
                      ["partner", ui.partner, copy.waitlist.roles.brand.note],
                    ].map(([value, label, note]) => (
                      <button key={value} type="button" role="radio" aria-checked={role === value} className={role === value ? "active" : ""} onClick={() => setRole(value as typeof role)}><strong>{label}</strong><span>{note}</span></button>
                    ))}
                  </fieldset>
                  <div className="tf-form-grid">
                    <label><span>{copy.waitlist.fields.name}</span><input value={name} onChange={(event) => setName(event.target.value)} placeholder={copy.waitlist.fields.namePlaceholder} autoComplete="name" /></label>
                    <label><span>{copy.waitlist.fields.email}</span><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder={copy.waitlist.fields.emailPlaceholder} autoComplete="email" /></label>
                    <label><span>{ui.countryQuestion}</span><select value={country} onChange={(event) => setCountry(event.target.value)}><option value="">{ui.countryPlaceholder}</option>{markets.map((market) => <option key={market.code} value={market.code}>{market.name}</option>)}</select></label>
                    {role === "partner" ? <label><span>{ui.organization}</span><input value={organization} onChange={(event) => setOrganization(event.target.value)} placeholder={copy.waitlist.fields.brandNamePlaceholder} /></label> : null}
                  </div>
                  <label className="tf-consent"><input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} /><span>{copy.waitlist.consent}</span></label>
                  <p className="tf-pioneer-gift"><i>✦</i> {detail.waitlist[0]}</p>
                  {message ? <p className="tf-form-message" role="alert">{message}</p> : null}
                  <button className="tf-button tf-submit-waitlist" type="submit" disabled={status === "loading"}>{status === "loading" ? copy.waitlist.submitting : copy.waitlist.submit}</button>
                </form>
              )}
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </section>
  );
}

function SectionIntro({ kicker, title, body, inverse = false }: { kicker: string; title: React.ReactNode; body: string; inverse?: boolean }) {
  return <div className={`tf-section-intro ${inverse ? "inverse" : ""}`}><p className="tf-kicker"><span /> {kicker}</p><h2>{title}</h2><p>{body}</p></div>;
}

function Reveal({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const reduce = useReducedMotion();
  return <motion.div className={className} initial={reduce ? false : { opacity: 0, y: 26 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-8%" }} transition={{ duration: 0.7, delay, ease }}>{children}</motion.div>;
}
