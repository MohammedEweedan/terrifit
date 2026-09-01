"use client";

import { useEffect, useMemo, useState } from "react";
import { useClientValue } from "@/lib/client-value";
import type { Dictionary } from "@/i18n";
import type { Locale } from "@/i18n/config";
import type { MarketOption } from "@/lib/markets";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { FEATURE_KEYS, PROFESSIONAL_ROLES, ROLES, type Role } from "@/lib/validation";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/cn";

const REF_KEY = "ryvn.ref";

/**
 * The referral code for this visit: the one in the URL if there is one,
 * otherwise whatever was parked earlier in the session. Reading the URL also
 * parks it, so the code survives a locale switch or an anchor jump.
 */
function readReferralCode(): string {
  const fromUrl = new URLSearchParams(window.location.search).get("ref");
  if (fromUrl) {
    const code = fromUrl.toUpperCase();
    try {
      sessionStorage.setItem(REF_KEY, code);
    } catch {
      // Storage blocked — the code still applies to this page view.
    }
    return code;
  }
  try {
    return sessionStorage.getItem(REF_KEY) ?? "";
  } catch {
    return "";
  }
}

type Markets = { priority: MarketOption[]; rest: MarketOption[] };

type Result = {
  position: number;
  referralCode: string;
  duplicate: boolean;
  role: string;
  referralBoost: number;
};

export function WaitlistForm({
  d,
  locale,
  markets,
  lockedRole,
  anchorId = "waitlist",
  heading,
}: {
  d: Dictionary;
  locale: Locale;
  markets: Markets;
  /** Persona sites apply for one role only, so the selector is removed. */
  lockedRole?: Role;
  anchorId?: string;
  heading?: { eyebrow: string; headline: string; body: string };
}) {
  const [role, setRole] = useState<Role>(lockedRole ?? "athlete");
  const [features, setFeatures] = useState<string[]>([]);
  // A ?ref= code has to survive a locale switch and an anchor jump, so the URL
  // is read at render and the code is parked in sessionStorage. It is never
  // typed by hand, so it needs no state of its own.
  const referredByCode = useClientValue(readReferralCode, "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "submitting">("idle");
  const [result, setResult] = useState<Result | null>(null);
  const [copied, setCopied] = useState(false);

  // The creator CTAs elsewhere on the page pre-select the matching role.
  useEffect(() => {
    if (lockedRole) return;
    function onSelectRole(event: Event) {
      const detail = (event as CustomEvent<string>).detail;
      if ((ROLES as readonly string[]).includes(detail)) setRole(detail as Role);
    }
    window.addEventListener("ryvn:select-role", onSelectRole);
    return () => window.removeEventListener("ryvn:select-role", onSelectRole);
  }, [lockedRole]);

  const isProfessional = PROFESSIONAL_ROLES.includes(role);
  const isBrand = role === "brand";

  const submitLabel = useMemo(
    () => (isProfessional ? d.waitlist.submitCreator : d.waitlist.submit),
    [isProfessional, d.waitlist.submitCreator, d.waitlist.submit],
  );

  function toggleFeature(key: string) {
    setFeatures((current) =>
      current.includes(key) ? current.filter((item) => item !== key) : [...current, key],
    );
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "submitting") return;

    const form = new FormData(event.currentTarget);
    const payload = {
      name: String(form.get("name") ?? "").trim(),
      email: String(form.get("email") ?? "").trim(),
      role,
      country: String(form.get("country") ?? ""),
      locale,
      features,
      handle: String(form.get("handle") ?? ""),
      audienceSize: String(form.get("audienceSize") ?? ""),
      credentials: String(form.get("credentials") ?? ""),
      brandName: String(form.get("brandName") ?? ""),
      brandWebsite: String(form.get("brandWebsite") ?? ""),
      brandCategory: String(form.get("brandCategory") ?? ""),
      referredByCode,
      source: typeof document !== "undefined" ? document.referrer.slice(0, 120) : "",
      consent: form.get("consent") === "on",
    };

    const nextErrors: Record<string, string> = {};
    if (!payload.name) nextErrors.name = d.waitlist.errors.required;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(payload.email)) {
      nextErrors.email = d.waitlist.errors.email;
    }
    if (!payload.country) nextErrors.country = d.waitlist.errors.required;
    if (isBrand && !payload.brandName.trim()) nextErrors.brandName = d.waitlist.errors.required;
    if (!payload.consent) nextErrors.consent = d.waitlist.errors.consent;

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    setStatus("submitting");
    track("waitlist_submit", { role, features: features.length, country: payload.country });

    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok && response.status !== 200) {
        const body = await response.json().catch(() => null);
        if (body?.error === "validation" && Array.isArray(body.fields)) {
          setErrors(
            Object.fromEntries(
              (body.fields as string[]).map((field) => [field, d.waitlist.errors.required]),
            ),
          );
        } else {
          setErrors({ form: d.waitlist.errors.generic });
        }
        setStatus("idle");
        return;
      }

      const data = (await response.json()) as Result;
      setResult(data);
      setStatus("idle");
      track("waitlist_success", { role, duplicate: data.duplicate, position: data.position });
    } catch {
      setErrors({ form: d.waitlist.errors.network });
      setStatus("idle");
    }
  }

  if (result) {
    return (
      <Success
        d={d}
        locale={locale}
        result={result}
        copied={copied}
        setCopied={setCopied}
        anchorId={anchorId}
      />
    );
  }

  return (
    <section
      id={anchorId}
      className="band noise scroll-mt-20 border-t border-border bg-bg-elev py-28"
    >
      <div className="bloom start-1/2 top-0 size-[620px] -translate-x-1/2 -translate-y-1/3" />
      <Container className="max-w-3xl">
        <SectionHeading
          eyebrow={heading?.eyebrow ?? d.waitlist.eyebrow}
          headline={heading?.headline ?? d.waitlist.headline}
          body={heading?.body ?? d.waitlist.body}
          align="center"
          className="mx-auto text-center"
        />

        {referredByCode ? (
          <Reveal delay={40}>
            <p className="mx-auto mt-6 w-fit rounded-full border border-accent-line bg-accent-soft px-4 py-2 text-[0.78rem] text-accent">
              {d.waitlist.referredBanner}
            </p>
          </Reveal>
        ) : null}

        <Reveal delay={80}>
          <form
            onSubmit={onSubmit}
            noValidate
            className="mt-10 rounded-2xl border border-border bg-surface p-6 shadow-[var(--shadow-card)] sm:p-8"
          >
            <fieldset className={lockedRole ? "hidden" : undefined}>
              <legend className="eyebrow text-fg-3">{d.waitlist.roleLabel}</legend>
              <div className="mt-4 grid gap-2 sm:grid-cols-3">
                {ROLES.map((key) => {
                  const option = d.waitlist.roles[key];
                  const isActive = key === role;
                  return (
                    <button
                      key={key}
                      type="button"
                      role="radio"
                      aria-checked={isActive}
                      onClick={() => {
                        setRole(key);
                        track("role_select", { role: key });
                      }}
                      className={cn(
                        "cursor-pointer rounded-xl border p-3 text-start transition-colors",
                        isActive
                          ? "border-accent bg-accent-soft"
                          : "border-border hover:border-border-strong",
                      )}
                    >
                      <span
                        className={cn(
                          "block text-[0.85rem] font-semibold",
                          isActive ? "text-fg" : "text-fg-2",
                        )}
                      >
                        {option.label}
                      </span>
                      <span className="mt-0.5 block text-[0.7rem] leading-snug text-fg-3">
                        {option.note}
                      </span>
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <div className="mt-7 grid gap-5 sm:grid-cols-2">
              <Field
                id="name"
                label={d.waitlist.fields.name}
                placeholder={d.waitlist.fields.namePlaceholder}
                error={errors.name}
                autoComplete="name"
              />
              <Field
                id="email"
                type="email"
                label={d.waitlist.fields.email}
                placeholder={d.waitlist.fields.emailPlaceholder}
                error={errors.email}
                autoComplete="email"
                dir="ltr"
              />
            </div>

            <div className="mt-5">
              <SelectField
                id="country"
                label={d.waitlist.fields.country}
                placeholder={d.waitlist.fields.countryPlaceholder}
                error={errors.country}
                groups={[markets.priority, markets.rest]}
              />
            </div>

            {isProfessional ? (
              <div className="mt-5 grid gap-5 sm:grid-cols-2">
                <Field
                  id="handle"
                  label={d.waitlist.fields.handle}
                  placeholder={d.waitlist.fields.handlePlaceholder}
                  dir="ltr"
                />
                <SelectField
                  id="audienceSize"
                  label={d.waitlist.fields.audience}
                  placeholder={d.waitlist.fields.audiencePlaceholder}
                  groups={[
                    d.waitlist.audienceRanges.map((range) => ({ code: range, name: range })),
                  ]}
                />
                <div className="sm:col-span-2">
                  <Field
                    id="credentials"
                    label={d.waitlist.fields.credentials}
                    placeholder={d.waitlist.fields.credentialsPlaceholder}
                    textarea
                  />
                </div>
              </div>
            ) : null}

            {isBrand ? (
              <div className="mt-5 grid gap-5 sm:grid-cols-2">
                <Field
                  id="brandName"
                  label={d.waitlist.fields.brandName}
                  placeholder={d.waitlist.fields.brandNamePlaceholder}
                  error={errors.brandName}
                />
                <Field
                  id="brandWebsite"
                  label={d.waitlist.fields.brandWebsite}
                  placeholder={d.waitlist.fields.brandWebsitePlaceholder}
                  dir="ltr"
                />
                <div className="sm:col-span-2">
                  <SelectField
                    id="brandCategory"
                    label={d.waitlist.fields.brandCategory}
                    placeholder={d.waitlist.fields.brandCategoryPlaceholder}
                    groups={[
                      d.waitlist.brandCategories.map((category) => ({
                        code: category,
                        name: category,
                      })),
                    ]}
                  />
                </div>
              </div>
            ) : null}

            <fieldset className="mt-7">
              <legend className="text-[0.85rem] font-medium text-fg">
                {d.waitlist.fields.features}
              </legend>
              <p className="mt-1 text-[0.72rem] text-fg-3">{d.waitlist.fields.featuresNote}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {FEATURE_KEYS.map((key) => {
                  const isActive = features.includes(key);
                  return (
                    <button
                      key={key}
                      type="button"
                      role="checkbox"
                      aria-checked={isActive}
                      onClick={() => toggleFeature(key)}
                      className={cn(
                        "cursor-pointer rounded-full border px-3.5 py-1.5 text-[0.78rem] transition-colors",
                        isActive
                          ? "border-accent bg-accent-soft text-accent"
                          : "border-border text-fg-2 hover:border-border-strong hover:text-fg",
                      )}
                    >
                      {d.waitlist.features[key]}
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <label className="mt-7 flex cursor-pointer items-start gap-3 text-[0.78rem] leading-relaxed text-fg-2">
              <input
                type="checkbox"
                name="consent"
                className="mt-0.5 size-4 shrink-0 cursor-pointer"
                aria-invalid={Boolean(errors.consent)}
              />
              <span>{d.waitlist.consent}</span>
            </label>
            {errors.consent ? (
              <p className="mt-1.5 text-[0.72rem] text-bad">{errors.consent}</p>
            ) : null}

            {errors.form ? (
              <p role="alert" className="mt-5 rounded-lg border border-bad/40 bg-bad/[0.07] px-4 py-3 text-[0.8rem] text-bad">
                {errors.form}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={status === "submitting"}
              className="mt-7 w-full cursor-pointer rounded-full bg-accent py-3.5 text-[0.9rem] font-semibold text-accent-fg transition-colors hover:bg-accent-hover disabled:cursor-wait disabled:opacity-60"
            >
              {status === "submitting" ? d.waitlist.submitting : submitLabel}
            </button>
          </form>
        </Reveal>
      </Container>
    </section>
  );
}

function Success({
  d,
  locale,
  result,
  copied,
  setCopied,
  anchorId,
}: {
  d: Dictionary;
  locale: Locale;
  result: Result;
  copied: boolean;
  setCopied: (value: boolean) => void;
  anchorId: string;
}) {
  // The origin is only knowable in the browser, so it is read there and the
  // link is derived — no state, and nothing to synchronise.
  const origin = useClientValue(() => window.location.origin, "");
  const link = origin ? `${origin}/${locale}?ref=${result.referralCode}` : "";

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      track("referral_copy", {});
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard denied — the link is on screen and selectable.
    }
  }

  async function share() {
    try {
      await navigator.share({ title: "Terrifit", url: link });
      track("referral_share", {});
    } catch {
      // Cancelled or unsupported.
    }
  }

  const roleNote =
    result.role === "brand"
      ? d.waitlist.success.roleNoteBrand
      : PROFESSIONAL_ROLES.includes(result.role as Role)
        ? d.waitlist.success.roleNoteCreator
        : null;

  return (
    <section
      id={anchorId}
      className="band noise scroll-mt-20 border-t border-border bg-bg-elev py-28"
    >
      <div className="bloom start-1/2 top-0 size-[620px] -translate-x-1/2 -translate-y-1/3" />
      <Container className="max-w-2xl">
        <div className="rounded-2xl border border-border bg-surface p-8 text-center shadow-[var(--shadow-card)]">
          <span
            className="mx-auto grid size-12 place-items-center rounded-full bg-accent-soft text-accent"
            aria-hidden="true"
          >
            ✓
          </span>

          <h2 className="display mt-5 text-[clamp(1.6rem,4vw,2.2rem)] font-semibold text-fg">
            {d.waitlist.success.title}
          </h2>

          {result.duplicate ? (
            <p className="mt-2 text-[0.8rem] text-fg-3">{d.waitlist.errors.duplicate}</p>
          ) : null}

          <p className="eyebrow mt-8 text-fg-3">{d.waitlist.success.positionLabel}</p>
          <p className="numeric mt-2 text-[clamp(2.8rem,9vw,4.2rem)] font-semibold text-accent">
            #{result.position.toLocaleString("en-US")}
          </p>

          {roleNote ? (
            <p className="mx-auto mt-6 max-w-md rounded-xl border border-border bg-bg-elev p-4 text-[0.8rem] leading-relaxed text-fg-2">
              {roleNote}
            </p>
          ) : null}

          <div className="mt-8 border-t border-border pt-7">
            <p className="text-[0.9rem] font-semibold text-fg">
              {d.waitlist.success.referralTitle}
            </p>
            <p className="mx-auto mt-2 max-w-md text-[0.82rem] leading-relaxed text-fg-2">
              {d.waitlist.success.referralBody}
            </p>

            <div className="mt-5 flex flex-col items-stretch gap-2 sm:flex-row">
              <code
                dir="ltr"
                className="min-w-0 flex-1 truncate rounded-lg border border-border bg-bg-elev px-4 py-3 text-start text-[0.78rem] text-fg-2"
              >
                {link}
              </code>
              <button
                type="button"
                onClick={copy}
                className="cursor-pointer rounded-lg bg-accent px-5 py-3 text-[0.8rem] font-semibold text-accent-fg transition-colors hover:bg-accent-hover"
              >
                {copied ? d.waitlist.success.copied : d.waitlist.success.copy}
              </button>
            </div>

            <button
              type="button"
              onClick={share}
              className="mt-3 cursor-pointer text-[0.78rem] text-fg-3 underline underline-offset-4 hover:text-fg sm:hidden"
            >
              {d.waitlist.success.share}
            </button>
          </div>
        </div>
      </Container>
    </section>
  );
}

function Field({
  id,
  label,
  placeholder,
  error,
  type = "text",
  textarea = false,
  autoComplete,
  dir,
}: {
  id: string;
  label: string;
  placeholder?: string;
  error?: string;
  type?: string;
  textarea?: boolean;
  autoComplete?: string;
  dir?: "ltr" | "rtl";
}) {
  const className = cn(
    "mt-2 w-full rounded-lg border bg-bg-elev px-3.5 py-2.5 text-[0.85rem] text-fg placeholder:text-fg-3",
    "transition-colors focus:border-accent focus:outline-none",
    error ? "border-bad" : "border-border",
  );

  return (
    <div>
      <label htmlFor={id} className="text-[0.85rem] font-medium text-fg">
        {label}
      </label>
      {textarea ? (
        <textarea
          id={id}
          name={id}
          rows={3}
          placeholder={placeholder}
          className={cn(className, "resize-y")}
        />
      ) : (
        <input
          id={id}
          name={id}
          type={type}
          dir={dir}
          autoComplete={autoComplete}
          placeholder={placeholder}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          className={className}
        />
      )}
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-[0.72rem] text-bad">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function SelectField({
  id,
  label,
  placeholder,
  error,
  groups,
}: {
  id: string;
  label: string;
  placeholder: string;
  error?: string;
  groups: MarketOption[][];
}) {
  return (
    <div>
      <label htmlFor={id} className="text-[0.85rem] font-medium text-fg">
        {label}
      </label>
      <select
        id={id}
        name={id}
        defaultValue=""
        aria-invalid={Boolean(error)}
        className={cn(
          "mt-2 w-full cursor-pointer rounded-lg border bg-bg-elev px-3.5 py-2.5 text-[0.85rem] text-fg",
          "transition-colors focus:border-accent focus:outline-none",
          error ? "border-bad" : "border-border",
        )}
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {groups.map((group, index) =>
          group.map((option) => (
            <option key={`${index}-${option.code}`} value={option.code}>
              {option.name}
            </option>
          )),
        )}
      </select>
      {error ? <p className="mt-1.5 text-[0.72rem] text-bad">{error}</p> : null}
    </div>
  );
}
