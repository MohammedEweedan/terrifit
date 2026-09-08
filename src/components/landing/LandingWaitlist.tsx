"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import { createPortal } from "react-dom";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import type { Dictionary } from "@/i18n";
import { localeMeta, type Locale } from "@/i18n/config";
import { marketingDetails, marketingUi } from "@/i18n/marketing";
import { storefrontCopy } from "@/i18n/storefront";
import { websiteCopy } from "@/i18n/website";
import { track } from "@/lib/analytics";
import { clearHash, getHash, getServerHash, subscribeHash } from "@/lib/hash";
import type { MarketOption } from "@/lib/markets";
import { signupAttribution } from "@/lib/referral-client";
import { SOCIAL_PLATFORMS, type SocialPlatform } from "@/lib/validation";
import { TurnstileWidget } from "@/components/security/TurnstileWidget";
import athletePhoto from "../../../public/media/hoodie-hero.png";
import styles from "./LandingWaitlist.module.css";

type SignupRole = "athlete" | "creator" | "partner";
type SignupResult = { position: number; referralCode: string; duplicate: boolean };
const ease = [0.22, 1, 0.36, 1] as const;

export function LandingWaitlist({ locale, markets, copy }: {
  locale: Locale;
  markets: MarketOption[];
  copy: Dictionary;
}) {
  const text = storefrontCopy(locale);
  const ui = marketingUi[locale];
  const site = websiteCopy(locale);
  const reduce = useReducedMotion();
  const hash = useSyncExternalStore(subscribeHash, getHash, getServerHash);
  const [manuallyOpen, setManuallyOpen] = useState(false);
  const open = manuallyOpen || hash === "#waitlist";
  const [role, setRole] = useState<SignupRole>("athlete");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [country, setCountry] = useState("");
  const [organization, setOrganization] = useState("");
  const [platform, setPlatform] = useState<SocialPlatform | "">("");
  const [handle, setHandle] = useState("");
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [result, setResult] = useState<SignupResult | null>(null);
  const [invite, setInvite] = useState("");
  const [copied, setCopied] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [challengeRound, setChallengeRound] = useState(0);
  const modalRef = useRef<HTMLDivElement>(null);
  const busyRef = useRef(false);

  const closeWaitlist = useCallback(() => {
    setManuallyOpen(false);
    setTurnstileToken(null);
    if (window.location.hash === "#waitlist") clearHash();
  }, []);

  useEffect(() => {
    const show = () => setManuallyOpen(true);
    window.addEventListener("terrifit:open-waitlist", show);
    return () => window.removeEventListener("terrifit:open-waitlist", show);
  }, []);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    document.body.style.overflow = "hidden";
    modalRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeWaitlist();
      }
      if (event.key !== "Tab") return;
      const nodes = Array.from(modalRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex="0"]',
      ) ?? []).filter((node) => node.getClientRects().length && !(node instanceof HTMLInputElement && node.type === "radio" && !node.checked));
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      const focusInside = modalRef.current?.contains(document.activeElement);
      if (event.shiftKey && (document.activeElement === first || document.activeElement === modalRef.current || !focusInside)) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && (document.activeElement === last || !focusInside)) {
        event.preventDefault();
        first?.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
      if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
    };
  }, [open, closeWaitlist]);

  function showErrors(next: Record<string, string>) {
    setErrors(next);
    const field = Object.keys(next).find((key) => key !== "form");
    if (field) modalRef.current?.querySelector<HTMLElement>(`[name="${field}"]`)?.focus();
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busyRef.current) return;
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = copy.waitlist.errors.required;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) next.email = copy.waitlist.errors.email;
    if (!country) next.country = copy.waitlist.errors.required;
    if (role === "creator" && !platform) next.platform = copy.waitlist.errors.required;
    if (role === "creator" && !handle.trim()) next.handle = copy.waitlist.errors.required;
    if (!consent) next.consent = copy.waitlist.errors.consent;
    if (Object.keys(next).length) { showErrors(next); return; }

    busyRef.current = true;
    setSubmitting(true);
    setErrors({});
    const attribution = signupAttribution();
    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(), email: email.trim(), country, locale, role, consent,
          features: role === "creator" ? ["maps", "coaching", "communities", "livestreams"] : role === "partner" ? ["marketplace", "communities"] : ["maps", "coaching", "health", "communities"],
          brandName: role === "partner" ? organization.trim() || name.trim() : "",
          platform: role === "creator" ? platform : "",
          handle: role === "creator" ? handle.trim() : "",
          turnstileToken,
          ...attribution,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        if (data.error === "validation" && Array.isArray(data.fields)) {
          showErrors(Object.fromEntries(data.fields.filter((field: unknown): field is string => typeof field === "string").map((field: string) => [field, field === "email" ? copy.waitlist.errors.email : copy.waitlist.errors.required])));
        } else setErrors({ form: copy.waitlist.errors.generic });
        setTurnstileToken(null);
        setChallengeRound((round) => round + 1);
        return;
      }
      const inviteUrl = new URL(`/${locale}`, window.location.origin);
      inviteUrl.searchParams.set("ref", data.referralCode);
      setInvite(inviteUrl.toString());
      setResult(data as SignupResult);
      track("waitlist_joined", { source: attribution.source, role });
    } catch {
      setErrors({ form: copy.waitlist.errors.network });
      setTurnstileToken(null);
      setChallengeRound((round) => round + 1);
    } finally {
      busyRef.current = false;
      setSubmitting(false);
    }
  }

  const roles = [
    { value: "athlete", label: copy.waitlist.roles.athlete.label, note: copy.waitlist.roles.athlete.note },
    { value: "creator", label: copy.waitlist.roles.creator.label, note: copy.waitlist.roles.creator.note },
    { value: "partner", label: ui.partner, note: copy.waitlist.roles.brand.note },
  ] as const;
  const inputProps = (field: string) => ({ name: field, id: `waitlist-${field}`, "aria-invalid": Boolean(errors[field]), "aria-describedby": errors[field] ? `waitlist-${field}-error` : undefined });

  return (
    <section id="waitlist" className={styles.final}>
      <div className={`tf-shell ${styles.finalInner}`}>
        <div className={styles.finalTop}><span>TERRIFIT / {copy.waitlist.eyebrow}</span><span aria-hidden>↗</span></div>
        <div className={styles.finalGrid}>
          <h2>{text.waitTitle}</h2>
          <div className={styles.finalAction}><button className={styles.button} type="button" onClick={() => setManuallyOpen(true)}>{text.early}<span aria-hidden>↗</span></button><small><span aria-hidden>✓</span>{text.waitFoot}</small></div>
        </div>
        <div className={styles.finalBottom}><span>{text.heroFoot}</span><span aria-hidden>TF / ∞</span></div>
      </div>

      {typeof document !== "undefined" ? createPortal(<AnimatePresence>
        {open ? <motion.div className={styles.backdrop} dir={localeMeta[locale].dir} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: reduce ? 0 : 0.2 }} onClick={closeWaitlist}>
          <motion.div ref={modalRef} className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="waitlist-title" aria-describedby="waitlist-description" tabIndex={-1} initial={reduce ? false : { opacity: 0, y: 20, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={reduce ? undefined : { opacity: 0, y: 12 }} transition={{ duration: reduce ? 0 : 0.35, ease }} onClick={(event) => event.stopPropagation()}>
            <button className={styles.close} type="button" onClick={closeWaitlist} aria-label={text.close}><span aria-hidden>×</span></button>
            <aside className={styles.aside}>
              <Image src={athletePhoto} alt="" fill sizes="(max-width: 700px) 1px, 390px" placeholder="blur" />
              <div className={styles.asideTop}><span>TERRIFIT®</span><span aria-hidden>↗</span></div>
              <div className={styles.asideCopy}><div className={styles.asidePill}><span aria-hidden />{text.early}</div><h3>{text.waitAside}</h3></div>
            </aside>
            <div className={styles.content}>
              <div className={styles.heading}><p className={styles.eyebrow}><span aria-hidden />{copy.waitlist.eyebrow}</p><h2 id="waitlist-title">{result ? text.ready : copy.waitlist.headline}</h2></div>
              {result ? <div className={styles.success}>
                <div className={styles.position} role="status"><span className={styles.successCheck} aria-hidden>✓</span><div><p>{copy.waitlist.success.title}</p><strong>#{result.position.toLocaleString(locale)}</strong><span>{copy.waitlist.success.positionLabel}</span></div><span className={styles.positionMark} aria-hidden>↗</span></div>
                <div className={styles.referral}><h3>{copy.waitlist.success.referralTitle}</h3><label htmlFor="waitlist-invite">{site.inviteLabel}</label><div className={styles.referralInput}><input id="waitlist-invite" dir="ltr" readOnly value={invite} onFocus={(event) => event.target.select()} /><button type="button" onClick={async () => { try { await navigator.clipboard.writeText(invite); setCopied(true); track("waitlist_invite_copied"); } catch { setCopied(false); modalRef.current?.querySelector<HTMLInputElement>("#waitlist-invite")?.select(); } }}>{copied ? site.copied : site.copyLink}</button></div><span className={styles.copyStatus} role="status">{copied ? site.linkReady : ""}</span></div>
                {role === "creator" ? <p className={styles.roleNote}>{copy.waitlist.success.roleNoteCreator}</p> : null}
                <button className={styles.button} type="button" onClick={closeWaitlist}>{marketingDetails[locale].waitlist[4]}<span aria-hidden>↗</span></button>
              </div> : <form onSubmit={submit} noValidate aria-busy={submitting}>
                <fieldset className={styles.rolePicker} disabled={submitting}>
                  <legend>{copy.waitlist.roleLabel}</legend>
                  <div>{roles.map((option) => <label key={option.value} className={`${styles.roleCard} ${role === option.value ? styles.selected : ""}`}><input type="radio" name="waitlist-role" value={option.value} checked={role === option.value} onChange={() => { setRole(option.value); setErrors({}); }} /><span className={styles.roleTop}><RoleIcon role={option.value} /><span className={styles.radioMark} aria-hidden>{role === option.value ? "✓" : ""}</span></span><strong>{option.label}</strong><span className={styles.roleDescription}>{option.note}</span></label>)}</div>
                </fieldset>
                <div className={styles.fields}>
                  <Field field="name" label={copy.waitlist.fields.name} error={errors.name}><input {...inputProps("name")} required maxLength={120} value={name} onChange={(event) => setName(event.target.value)} placeholder={copy.waitlist.fields.namePlaceholder} autoComplete="name" /></Field>
                  <Field field="country" label={ui.countryQuestion} error={errors.country}><select {...inputProps("country")} required value={country} onChange={(event) => setCountry(event.target.value)} autoComplete="country"><option value="">{ui.countryPlaceholder}</option>{markets.map((market) => <option key={market.code} value={market.code}>{market.name}</option>)}</select></Field>
                  <Field field="email" label={copy.waitlist.fields.email} error={errors.email} full><input {...inputProps("email")} required type="email" maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} placeholder={copy.waitlist.fields.emailPlaceholder} autoComplete="email" autoCapitalize="none" spellCheck={false} /></Field>
                  {role === "partner" ? <Field field="organization" label={ui.organization} error={errors.brandName} full><input {...inputProps("organization")} maxLength={160} value={organization} onChange={(event) => setOrganization(event.target.value)} placeholder={copy.waitlist.fields.brandNamePlaceholder} autoComplete="organization" /></Field> : null}
                  {role === "creator" ? <><Field field="platform" label={copy.waitlist.fields.platform} error={errors.platform}><select {...inputProps("platform")} required value={platform} onChange={(event) => setPlatform(event.target.value as SocialPlatform)}><option value="">{copy.waitlist.fields.platformPlaceholder}</option>{SOCIAL_PLATFORMS.map((network) => <option key={network} value={network}>{copy.waitlist.platforms[network]}</option>)}</select></Field><Field field="handle" label={copy.waitlist.fields.handle} error={errors.handle}><input {...inputProps("handle")} required maxLength={200} value={handle} onChange={(event) => setHandle(event.target.value)} placeholder={copy.waitlist.fields.handlePlaceholder} autoCapitalize="none" spellCheck={false} /></Field></> : null}
                </div>
                <label className={styles.consent}><input {...inputProps("consent")} type="checkbox" required checked={consent} onChange={(event) => setConsent(event.target.checked)} /><span>{copy.waitlist.consent}</span></label>
                {errors.consent ? <p id="waitlist-consent-error" className={styles.fieldError} role="alert">{errors.consent}</p> : null}
                <TurnstileWidget onToken={setTurnstileToken} action="waitlist" resetKey={challengeRound} />
                {errors.form ? <p className={styles.formError} role="alert">{errors.form}</p> : null}
                <button className={`${styles.button} ${styles.submit}`} type="submit" disabled={submitting}>{submitting ? copy.waitlist.submitting : copy.waitlist.submit}<span className={submitting ? styles.spinner : ""} aria-hidden>{submitting ? "" : "↗"}</span></button>
                <p className={styles.foot}><span aria-hidden>✓</span>{text.waitFoot}</p>
              </form>}
            </div>
          </motion.div>
        </motion.div> : null}
      </AnimatePresence>, document.body) : null}
    </section>
  );
}

function Field({ field, label, error, full, children }: { field: string; label: string; error?: string; full?: boolean; children: ReactNode }) {
  return <div className={`${styles.field} ${full ? styles.full : ""}`}><label htmlFor={`waitlist-${field}`}>{label}</label>{children}{error ? <p id={`waitlist-${field}-error`} className={styles.fieldError} role="alert">{error}</p> : null}</div>;
}

function RoleIcon({ role }: { role: SignupRole }) {
  return <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{role === "athlete" ? <><path d="M4 8v8m3-10v12m10-12v12m3-10v8M7 12h10M2 10v4m20-4v4" /></> : role === "creator" ? <><rect x="4" y="4" width="16" height="16" rx="3" /><path d="m10 8 6 4-6 4V8Z" /></> : <><path d="M4 9h16v11H4zM8 9V5h8v4M4 13h16M10 13v3h4v-3" /></>}</svg>;
}
