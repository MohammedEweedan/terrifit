"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Image, { type StaticImageData } from "next/image";
import Link from "next/link";
import { createContext, useCallback, useContext, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { signupAttribution } from "@/lib/referral-client";
import { track } from "@/lib/analytics";
import type { Dictionary } from "@/i18n";
import { localeMeta, type Locale } from "@/i18n/config";
import type { MarketOption } from "@/lib/markets";
import { TerrifitHeader } from "@/components/navigation/TerrifitHeader";
import { TerrifitFooter } from "@/components/navigation/TerrifitFooter";
import { marketingDetails, marketingUi } from "@/i18n/marketing";
import { clearHash, getHash, getServerHash, subscribeHash } from "@/lib/hash";
import { storefrontCopy } from "@/i18n/storefront";
import { ProductCard } from "@/components/shop/ProductCard";
import type { Product } from "@/lib/shop/catalog";
import { BandCallouts } from "@/components/band/BandCallouts";
import { AvailableNow } from "@/components/marketing/AvailableNow";
import { Capabilities } from "@/components/landing/Capabilities";
import { Languages } from "@/components/landing/Languages";
import { AnnouncementBar, type Announcement } from "@/components/marketing/AnnouncementBar";
import { getPagesCopy } from "@/i18n/pages";

import bandProduct from "../../../public/media/band/colourways-v2/ember.png";
import heroDesktop from "../../../public/rebrand/desktop-bg-clean.png";
import boxer from "../../../public/rebrand/combos-boxer-clean.png";
import kettlebell from "../../../public/rebrand/faq-kettlebell-clean.png";
import cyclist from "../../../public/rebrand/whyus-cyclist-clean.png";
import shotHomeDark from "../../../public/media/app/home-dark.png";
import shotShopDark from "../../../public/media/app/shop-dark.png";
import shotMapsDark from "../../../public/media/app/maps-dark.png";
import { AppShowcase } from "@/components/platform/AppShowcase";
import trainWorkLive from "../../../public/media/train-work-live.jpg";
import { websiteCopy } from "@/i18n/website";
import { SloganMark } from "./SloganMark";


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
  shopProducts,
}: {
  locale: Locale;
  markets: MarketOption[];
  copy: Dictionary;
  /** Real signups, counted per request. Zero hides the card rather than faking one. */
  waitlistCount: number;
  /** One line of news under the header. Null once the offer closes. */
  announcement: Announcement | null;
  shopProducts: Product[];
}) {
  return (
    <CopyContext.Provider value={copy}><div className="tf-site">
      <TerrifitHeader locale={locale} copy={copy} />
      <AnnouncementBar announcement={announcement} />
      <main id="main-content">
        <Hero locale={locale} />
        <MetricRail locale={locale} />
        <PlatformSection locale={locale} waitlistCount={waitlistCount} />
        <MapsSection locale={locale} />
        <BandSection locale={locale} />
        {/* The specification, in plain columns, straight after the band story.
            By this point the reader has had the argument and wants the list. */}
        <Capabilities copy={getPagesCopy(locale).capabilities} />
        <LifestyleSection locale={locale} />
        {/* Ten languages, printed in ten scripts. The section is its own proof. */}
        <Languages copy={getPagesCopy(locale).languages} current={locale} />
        <ShopSection locale={locale} products={shopProducts} />
        <AvailableNow locale={locale} copy={getPagesCopy(locale).availableNow} />
        <FinalWaitlist locale={locale} markets={markets} />
      </main>
      <TerrifitFooter locale={locale} copy={copy} />
    </div></CopyContext.Provider>
  );
}

function Hero({ locale }: { locale: Locale }) {
  const text = storefrontCopy(locale);
  const reduce = useReducedMotion();
  return (
    <section className="th-hero" id="top">
      <div className="tf-shell th-hero-grid">
        <motion.div className="th-hero-copy" initial={reduce ? false : { opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease }}>
          <p className="th-eyebrow"><i aria-hidden />{text.eyebrow}</p>
          <SloganMark />
          <p className="th-lede">{text.heroBody}</p>
          <div className="th-actions">
            <a className="th-button" href="#waitlist" onClick={openWaitlist}>{text.early}<span aria-hidden>↗</span></a>
            <Link className="th-text-link" href={`/${locale}/app`}>{text.explore}<span aria-hidden>→</span></Link>
          </div>
          <span className="th-hero-foot">{text.heroFoot}</span>
        </motion.div>
        <motion.div className="th-hero-art" initial={reduce ? false : { opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.9, ease }}>
          <Image src={heroDesktop} alt="Athlete in motion against Terrifit's signature orange" fill preload placeholder="blur" sizes="(max-width: 760px) 100vw, 55vw" />
          <span className="th-art-index" aria-hidden>TF / 01</span>
          <div className="th-art-caption"><span>{text.heroCaption}</span><a href="#metrics" aria-label={text.browse}>↓</a></div>
        </motion.div>
      </div>
    </section>
  );
}

function MetricRail({ locale }: { locale: Locale }) {
  const text = storefrontCopy(locale);
  return <nav id="metrics" className="th-paths tf-shell" aria-label={text.browse}>
    {text.paths.map((path, i) => <Link key={path.href} href={`/${locale}/${path.href}`}>
      <span className="th-path-number" aria-hidden>0{i + 1}</span>
      <div><h2>{path.title}</h2><p>{path.body}</p><span>{path.label}</span></div>
      <b aria-hidden>↗</b>
    </Link>)}
  </nav>;
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
          <Link className="tf-outline-button" href={`/${locale}/app`}>{detail.common[9]} {ui.nav[0]} <span>→</span></Link>
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
                src: shotShopDark,
                label: "Shop",
                note: "Terrifuel, straps and the band, priced in your currency.",
                alt: "The Terrifit app shop showing search, category filters and product cards for the V1 band and strap sets with prices in pounds",
              },
              {
                src: shotMapsDark,
                label: "Maps",
                note: "Programmes that adjust to what you actually lifted.",
                alt: "The Terrifit app listing the Maps library — Strength Five and Engine Builder with their coach, length and weekly session count",
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

function ShopSection({ locale, products }: { locale: Locale; products: Product[] }) {
  const text = storefrontCopy(locale);
  const picks = ["recovery-protein", "daily-hydration", "terrifits-field-tee", "training-shaker"]
    .flatMap(slug => products.find(product => product.slug === slug) ?? []);
  return <section id="shop" className="th-shop">
    <div className="tf-shell">
      <div className="th-section-heading"><div><p className="th-eyebrow">{text.shopEyebrow}</p><h2>{text.essentials}</h2></div><Link className="th-text-link" href={`/${locale}/shop`}>{text.shopAll}<span aria-hidden>↗</span></Link></div>
      <div className="sc-grid">{picks.map(product => <ProductCard key={product.slug} locale={locale} product={product} copy={getPagesCopy(locale).shop} />)}</div>
    </div>
  </section>;
}

function FinalWaitlist({ locale, markets }: { locale: Locale; markets: MarketOption[] }) {
  const text = storefrontCopy(locale);
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
  const [invite, setInvite] = useState("");
  const [copied, setCopied] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

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
    const previousFocus=document.activeElement as HTMLElement|null;
    document.body.style.overflow = "hidden";
    modalRef.current?.querySelector<HTMLButtonElement>("button")?.focus();
    const trap=(event:KeyboardEvent)=>{if(event.key!=="Tab")return;const nodes=Array.from(modalRef.current?.querySelectorAll<HTMLElement>('button:not([disabled]),a[href],input,select,textarea,[tabindex="0"]')??[]);const first=nodes[0],last=nodes[nodes.length-1];if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}};
    window.addEventListener("keydown",trap);
    return () => { document.body.style.overflow = previous;window.removeEventListener("keydown",trap);previousFocus?.focus(); };
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
          ...signupAttribution(),
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error("request_failed");
      setStatus("success");
      setMessage(`${copy.waitlist.success.title} #${result.position}`);
      const inviteUrl=new URL(`/${locale}`,window.location.origin);inviteUrl.searchParams.set("ref",result.referralCode);setInvite(inviteUrl.toString());
      track("waitlist_joined",{source:signupAttribution().source,role});
    } catch {
      setStatus("error");
      setMessage(copy.waitlist.errors.generic);
    }
  }

  const site = websiteCopy(locale);

  return (
    <section id="waitlist" className="tw-final">
      <div className="tf-shell tw-final-inner">
        <div><p className="th-eyebrow">TERRIFIT / {copy.waitlist.eyebrow}</p><h2>{text.waitTitle}</h2></div>
        <div><p>{text.waitBody}</p><button className="th-button" type="button" onClick={() => setManuallyOpen(true)}>{text.early}<span aria-hidden>↗</span></button><small>{text.waitFoot}</small></div>
      </div>

      <AnimatePresence>
        {open ? (
          <motion.div className="tw-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={closeWaitlist}>
            <motion.div ref={modalRef} className="tw-modal" role="dialog" aria-modal="true" aria-labelledby="waitlist-title" initial={{ opacity: 0, y: 24, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 16, scale: 0.98 }} transition={{ ease }} onClick={(event) => event.stopPropagation()}>
              <button className="tw-close" type="button" onClick={closeWaitlist} aria-label={text.close}>×</button>
              <aside className="tw-aside">
                <Image src={heroDesktop} alt="" fill sizes="380px" />
                <span className="tw-aside-brand">TERRIFIT</span>
                <div><h3>{text.waitAside}</h3><p>{text.waitAsideBody}</p><span>{text.heroFoot}</span></div>
              </aside>
              <div className="tw-content">
              <div className="tw-heading"><span className="th-eyebrow">{copy.waitlist.eyebrow}</span><h2 id="waitlist-title">{status === "success" ? text.ready : text.waitTitle}</h2><p>{status === "success" ? copy.waitlist.success.referralBody : text.waitBody}</p></div>

              {status === "success" ? (
                <motion.div className="tw-success" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                  <span className="tw-success-check" aria-hidden>✓</span><strong>{message}</strong>
                  {invite?<div className="tw-referral"><label htmlFor="invite-link">{site.inviteLabel}</label><input id="invite-link" readOnly value={invite} onFocus={event=>event.target.select()}/><button className="th-button" type="button" onClick={async()=>{try{await navigator.clipboard.writeText(invite);setCopied(true);track("waitlist_invite_copied");}catch{setCopied(false);}}}>{copied ? site.copied : site.copyLink}</button><span role="status">{copied ? site.linkReady : ""}</span></div>:null}
                  <button className="th-text-link" type="button" onClick={closeWaitlist}>{detail.waitlist[4]}</button>
                </motion.div>
              ) : (
                <form onSubmit={submit} noValidate>
                  <fieldset className="tw-role-picker">
                    <legend>{copy.waitlist.roleLabel}</legend>
                    {[
                      ["athlete", copy.waitlist.roles.athlete.label, copy.waitlist.roles.athlete.note],
                      ["creator", copy.waitlist.roles.creator.label, copy.waitlist.roles.creator.note],
                      ["partner", ui.partner, copy.waitlist.roles.brand.note],
                    ].map(([value, label]) => (
                      <label key={value} className={role === value ? "active" : ""}><input type="radio" name="waitlist-role" checked={role === value} onChange={() => setRole(value as typeof role)} /><span>{label}</span></label>
                    ))}
                  </fieldset>
                  <div className="tw-fields">
                    <label><span>{copy.waitlist.fields.name}</span><input required value={name} onChange={(event) => setName(event.target.value)} placeholder={copy.waitlist.fields.namePlaceholder} autoComplete="name" /></label>
                    <label><span>{copy.waitlist.fields.email}</span><input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder={copy.waitlist.fields.emailPlaceholder} autoComplete="email" /></label>
                    <label><span>{ui.countryQuestion}</span><select required value={country} onChange={(event) => setCountry(event.target.value)}><option value="">{ui.countryPlaceholder}</option>{markets.map((market) => <option key={market.code} value={market.code}>{market.name}</option>)}</select></label>
                    {role === "partner" ? <label><span>{ui.organization}</span><input value={organization} onChange={(event) => setOrganization(event.target.value)} placeholder={copy.waitlist.fields.brandNamePlaceholder} /></label> : null}
                  </div>
                  <label className="tw-consent"><input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} /><span>{copy.waitlist.consent}</span></label>

                  {message ? <p className="tw-message" role="alert">{message}</p> : null}
                  <button className="th-button tw-submit" type="submit" disabled={status === "loading"}>{status === "loading" ? copy.waitlist.submitting : copy.waitlist.submit}</button>
                  <p className="tw-foot">{text.waitFoot}</p>
                </form>
              )}
              </div>
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
