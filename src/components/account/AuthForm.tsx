"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Locale } from "@/i18n/config";
import type { PagesCopy } from "@/i18n/pages";
import { marketingDetails, marketingUi } from "@/i18n/marketing";
import athlete from "../../../public/media/hero-male.jpg";
import { authUi } from "./auth-copy";
import styles from "./AuthForm.module.css";

type Mode = "signup" | "signin";

export function AuthForm({
  locale,
  mode,
  copy,
  next,
}: {
  locale: Locale;
  mode: Mode;
  copy: PagesCopy["account"];
  /** Where to land after signing in. Validated by the caller. */
  next?: string;
}) {
  const router = useRouter();
  const text = mode === "signup" ? copy.signup : copy.signin;
  const ui = authUi[locale];
  const lifestyle = marketingDetails[locale].lifestyle;
  const [status, setStatus] = useState<"idle" | "working" | "error">("idle");
  const [error, setError] = useState("");
  const [invalid, setInvalid] = useState<string[]>([]);
  const [passwordVisible, setPasswordVisible] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "working") return;
    const form = new FormData(event.currentTarget);
    setStatus("working");
    setError("");
    setInvalid([]);

    const endpoint = mode === "signup" ? "/api/auth/signup" : "/api/auth/login";
    const payload =
      mode === "signup"
        ? {
            name: form.get("name"),
            email: form.get("email"),
            password: form.get("password"),
            role: form.get("role"),
            consent: form.get("consent") === "on",
            locale,
          }
        : { email: form.get("email"), password: form.get("password") };

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        // A hard refresh so the server components pick up the new session
        // cookie rather than rendering the signed-out shell from cache.
        // Falls back to the account page when nothing asked for a
        // particular destination — the ordinary sign-in case.
        router.replace(next ?? `/${locale}/account`);
        router.refresh();
        return;
      }

      const body = (await response.json().catch(() => null)) as
        | { error?: string; fields?: string[] }
        | null;

      setStatus("error");
      if (response.status === 429) setError(text.errorRate);
      else if (mode === "signup" && response.status === 409) setError(copy.signup.errorTaken);
      else if (mode === "signin" && response.status === 401) setError(copy.signin.errorCredentials);
      else if (response.status === 422) {
        setInvalid(body?.fields ?? []);
        setError(mode === "signup" ? copy.signup.errorValidation : copy.signin.errorGeneric);
      } else setError(text.errorGeneric);
    } catch {
      setStatus("error");
      setError(text.errorGeneric);
    }
  }

  return (
    <section className={styles.page} aria-labelledby="auth-title">
      <div className={styles.layout}>
        <aside className={styles.story}>
          <Image
            className={styles.photo}
            src={athlete}
            alt=""
            fill
            sizes="(max-width: 760px) 100vw, 50vw"
            placeholder="blur"
          />
          <div className={styles.storyShade} />
          <div className={styles.storyTop}>
            <span className={styles.brand} dir="ltr">
              <span className={styles.mark} aria-hidden="true"><i /><i /><i /><i /></span>
              TERRIFIT
            </span>
            <span className={styles.crosshair} aria-hidden="true">+</span>
          </div>
          <div className={styles.orbit} aria-hidden="true"><span /></div>
          <div className={styles.storyCopy}>
            <p className={styles.storyTitle}>
              {lifestyle.slice(0, 3).map((line, index) => (
                <span key={line} className={index === 2 ? styles.orange : undefined}>{line}</span>
              ))}
            </p>
            <p className={styles.storyCaption}>{lifestyle[3]}</p>
            <div className={styles.storyFooter}>
              {marketingUi[locale].nav.slice(0, 3).map((label) => <span key={label}>{label}</span>)}
              <svg viewBox="0 0 84 24" fill="none" aria-hidden="true">
                <path d="M0 12h20l5-6 7 14 10-18 7 15 5-5h30" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </div>
          </div>
        </aside>

        <div className={styles.panel}>
          <form className={styles.form} onSubmit={submit} aria-busy={status === "working"}>
            <header className={styles.heading}>
              <p className={styles.eyebrow}><span aria-hidden="true" />{text.eyebrow}</p>
              <h1 id="auth-title">{text.title}</h1>
              <p className={styles.lede}>{text.sub}</p>
            </header>

            {mode === "signup" ? (
              <label className={styles.field}>
                <span>{copy.signup.nameLabel}</span>
                <input name="name" type="text" required maxLength={120} autoComplete="name" dir="auto" aria-invalid={invalid.includes("name") || undefined} />
              </label>
            ) : null}

            <label className={styles.field}>
              <span>{text.emailLabel}</span>
              <input name="email" type="email" required maxLength={254} autoComplete="email" placeholder="you@example.com" dir="ltr" autoCapitalize="none" spellCheck={false} aria-invalid={invalid.includes("email") || undefined} />
            </label>

            <div className={styles.field}>
              <div className={styles.passwordLabel}>
                <label htmlFor="auth-password">{text.passwordLabel}</label>
                {mode === "signin" ? <Link href={`/${locale}/reset`}>{ui.forgotPassword}</Link> : null}
              </div>
              <div className={styles.passwordInput}>
                <input
                  id="auth-password"
                  name="password"
                  type={passwordVisible ? "text" : "password"}
                  required
                  minLength={mode === "signup" ? 10 : 1}
                  autoComplete={mode === "signup" ? "new-password" : "current-password"}
                  aria-invalid={invalid.includes("password") || undefined}
                  aria-describedby={mode === "signup" ? "auth-password-hint" : undefined}
                />
                <button
                  className={styles.visibility}
                  type="button"
                  aria-label={passwordVisible ? ui.hidePassword : ui.showPassword}
                  aria-pressed={passwordVisible}
                  onClick={() => setPasswordVisible((visible) => !visible)}
                >
                  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" stroke="currentColor" strokeWidth="1.5" />
                    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" />
                    {passwordVisible ? <path d="m3 3 18 18" stroke="currentColor" strokeWidth="1.5" /> : null}
                  </svg>
                </button>
              </div>
              {mode === "signup" ? <small id="auth-password-hint">{copy.signup.passwordHint}</small> : null}
            </div>

            {mode === "signup" ? (
              <>
                <fieldset className={styles.roles}>
                  <legend>{copy.signup.roleLabel}</legend>
                  {copy.signup.roles.map((role, index) => (
                    <label key={role.value}>
                      <input type="radio" name="role" value={role.value} defaultChecked={index === 0} />
                      <span>{role.label}</span>
                    </label>
                  ))}
                </fieldset>

                <label className={styles.consent}>
                  <input name="consent" type="checkbox" required aria-invalid={invalid.includes("consent") || undefined} />
                  <span>{copy.signup.consent}</span>
                </label>
              </>
            ) : null}

            {error ? (
              <p className={styles.error} role="alert">
                {error}
              </p>
            ) : null}

            <button className={styles.submit} type="submit" disabled={status === "working"}>
              <span aria-live="polite">{status === "working" ? text.submitting : text.submit}</span>
              <span className={styles.submitIcon} aria-hidden="true">
                {status === "working" ? <span className={styles.spinner} /> : <svg viewBox="0 0 24 24" fill="none"><path d="M5 12h14m-6-6 6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>}
              </span>
            </button>

            <p className={styles.swap}>
              {mode === "signup" ? copy.signup.haveAccount : copy.signin.noAccount}{" "}
              <Link href={`/${locale}/${mode === "signup" ? "signin" : "signup"}`}>
                {mode === "signup" ? copy.signup.signIn : copy.signin.createAccount}
              </Link>
            </p>
          </form>
        </div>
      </div>
    </section>
  );
}
