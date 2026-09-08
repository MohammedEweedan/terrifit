"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Locale } from "@/i18n/config";
import type { OnboardingCopy } from "@/i18n/onboarding";
import { TurnstileWidget } from "@/components/security/TurnstileWidget";

type Market = { code: string; name: string };
const STEPS = ["persona", "goals", "cadence", "details"] as const;
type Step = (typeof STEPS)[number];

/**
 * Guided sign-up: one question per screen.
 *
 * The pattern is the one the big wearable funnels use — a short series of
 * single-purpose screens with a progress bar, large tappable choices, and a
 * single-select step that advances on its own so the primary action is the
 * answer rather than a separate button. Everything here is Terrifit's own copy
 * and styling; only the interaction model is borrowed.
 *
 * It posts to `/api/waitlist`, which already owns roles, features, referrals
 * and duplicate handling — the funnel is a better front door to the list, not a
 * second list.
 *
 * Step state is plain `useState` driven by clicks. Nothing derives from an
 * effect, which this codebase does not allow.
 */
export function OnboardingFlow({
  locale,
  copy,
  markets,
  referral,
}: {
  locale: Locale;
  copy: OnboardingCopy;
  markets: Market[];
  referral?: string;
}) {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [persona, setPersona] = useState("");
  const [goals, setGoals] = useState<string[]>([]);
  const [cadence, setCadence] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [country, setCountry] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const [round, setRound] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "sending" | "done">("idle");
  const [result, setResult] = useState<{ position?: number; referralCode?: string } | null>(null);

  const step: Step = STEPS[index];
  const total = STEPS.length;

  /** Single-select steps advance themselves: the choice is the action. */
  const choose = (set: (value: string) => void) => (value: string) => {
    set(value);
    setErrors({});
    setIndex((current) => Math.min(current + 1, total - 1));
  };

  const toggleGoal = (id: string) =>
    setGoals((current) => (current.includes(id) ? current.filter((g) => g !== id) : [...current, id]));

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = copy.errors.required;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) next.email = copy.errors.email;
    if (!country) next.country = copy.errors.required;
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setStatus("sending");
    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          role: persona || "athlete",
          country,
          locale,
          features: goals,
          referredByCode: referral ?? "",
          // The cadence answer is demand signal, not a schema field of its own.
          source: cadence ? `onboarding:${cadence}` : "onboarding",
          consent: true,
          turnstileToken: token,
        }),
      });
      const payload = (await response.json().catch(() => null)) as
        | { position?: number; referralCode?: string; error?: string }
        | null;

      if (!response.ok) {
        setStatus("idle");
        setToken(null);
        setRound((r) => r + 1);
        setErrors({ form: copy.errors.generic });
        return;
      }
      setResult(payload ?? {});
      setStatus("done");
    } catch {
      setStatus("idle");
      setErrors({ form: copy.errors.generic });
    }
  }

  if (status === "done") {
    return (
      <section className="ob" aria-live="polite">
        <div className="ob-card ob-done">
          <p className="ob-eyebrow">{copy.eyebrow}</p>
          <h1>{copy.done.title}</h1>
          <p className="ob-sub">{copy.done.sub}</p>
          {result?.position ? <p className="ob-position numeric">#{result.position}</p> : null}
          {result?.referralCode ? <code className="ob-code">{result.referralCode}</code> : null}
          <button type="button" className="ob-cta" onClick={() => router.push(`/${locale}/app`)}>
            {copy.done.cta}
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="ob">
      <div className="ob-card">
        <header className="ob-head">
          {index > 0 ? (
            <button type="button" className="ob-back" onClick={() => setIndex((c) => c - 1)}>
              ← {copy.back}
            </button>
          ) : <span />}
          <span className="ob-count">{copy.stepOf.replace("{n}", String(index + 1)).replace("{total}", String(total))}</span>
        </header>
        {/* Progress is the only persistent chrome: it is what makes a long form
            feel finite. */}
        <div className="ob-progress" role="progressbar" aria-valuenow={index + 1} aria-valuemin={1} aria-valuemax={total}>
          <i style={{ width: `${((index + 1) / total) * 100}%` }} />
        </div>

        {step === "persona" ? (
          <Question title={copy.steps.persona.title} sub={copy.steps.persona.sub}>
            <div className="ob-options">
              {copy.steps.persona.options.map((option) => (
                <button key={option.id} type="button" className={persona === option.id ? "is-on" : undefined}
                        onClick={() => choose(setPersona)(option.id)}>
                  <strong>{option.label}</strong>
                  <span>{option.note}</span>
                </button>
              ))}
            </div>
          </Question>
        ) : null}

        {step === "goals" ? (
          <Question title={copy.steps.goals.title} sub={copy.steps.goals.sub}>
            <div className="ob-options ob-options-grid" role="group">
              {copy.steps.goals.options.map((option) => (
                <button key={option.id} type="button" aria-pressed={goals.includes(option.id)}
                        className={goals.includes(option.id) ? "is-on" : undefined}
                        onClick={() => toggleGoal(option.id)}>
                  <strong>{option.label}</strong>
                </button>
              ))}
            </div>
            <button type="button" className="ob-cta" onClick={() => setIndex((c) => c + 1)}>
              {goals.length > 0 ? copy.next : copy.skip}
            </button>
          </Question>
        ) : null}

        {step === "cadence" ? (
          <Question title={copy.steps.cadence.title} sub={copy.steps.cadence.sub}>
            <div className="ob-options">
              {copy.steps.cadence.options.map((option) => (
                <button key={option.id} type="button" className={cadence === option.id ? "is-on" : undefined}
                        onClick={() => choose(setCadence)(option.id)}>
                  <strong>{option.label}</strong>
                  <span>{option.note}</span>
                </button>
              ))}
            </div>
          </Question>
        ) : null}

        {step === "details" ? (
          <form onSubmit={submit} noValidate>
            <Question title={copy.steps.details.title} sub={copy.steps.details.sub}>
              <label className={`ob-field ${errors.name ? "is-invalid" : ""}`}>
                <span>{copy.steps.details.name}</span>
                <input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
                {errors.name ? <em>{errors.name}</em> : null}
              </label>
              <label className={`ob-field ${errors.email ? "is-invalid" : ""}`}>
                <span>{copy.steps.details.email}</span>
                <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" autoComplete="email" dir="ltr" />
                {errors.email ? <em>{errors.email}</em> : null}
              </label>
              <label className={`ob-field ${errors.country ? "is-invalid" : ""}`}>
                <span>{copy.steps.details.country}</span>
                <select value={country} onChange={(e) => setCountry(e.target.value)} autoComplete="country">
                  <option value="">—</option>
                  {markets.map((market) => <option key={market.code} value={market.code}>{market.name}</option>)}
                </select>
                {errors.country ? <em>{errors.country}</em> : null}
              </label>
              <TurnstileWidget onToken={setToken} action="onboarding" resetKey={round} />
              {errors.form ? <p className="ob-error" role="alert">{errors.form}</p> : null}
              <button type="submit" className="ob-cta" disabled={status === "sending"}>
                {copy.steps.details.submit}
              </button>
            </Question>
          </form>
        ) : null}
      </div>
    </section>
  );
}

function Question({ title, sub, children }: { title: string; sub: string; children: React.ReactNode }) {
  return (
    <div className="ob-step">
      <h1>{title}</h1>
      <p className="ob-sub">{sub}</p>
      {children}
    </div>
  );
}
