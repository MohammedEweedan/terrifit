"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Locale } from "@/i18n/config";
import type { PagesCopy } from "@/i18n/pages";

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
  const [status, setStatus] = useState<"idle" | "working" | "error">("idle");
  const [error, setError] = useState("");
  const [invalid, setInvalid] = useState<string[]>([]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
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
    <div className="ac-auth">
      <div className="tf-shell ac-auth-inner">
        <form onSubmit={submit}>
          <p className="ac-eyebrow">{text.eyebrow}</p>
          <h1>{text.title}</h1>
          <p className="ac-lede">{text.sub}</p>

          {mode === "signup" ? (
            <label className={`ac-field ${invalid.includes("name") ? "is-invalid" : ""}`}>
              <span>{copy.signup.nameLabel}</span>
              <input name="name" type="text" required maxLength={120} autoComplete="name" />
            </label>
          ) : null}

          <label className={`ac-field ${invalid.includes("email") ? "is-invalid" : ""}`}>
            <span>{text.emailLabel}</span>
            <input name="email" type="email" required maxLength={254} autoComplete="email" />
          </label>

          <label className={`ac-field ${invalid.includes("password") ? "is-invalid" : ""}`}>
            <span>{text.passwordLabel}</span>
            <input
              name="password"
              type="password"
              required
              minLength={mode === "signup" ? 10 : 1}
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
            />
            {mode === "signup" ? <small>{copy.signup.passwordHint}</small> : null}
          </label>

          {mode === "signup" ? (
            <>
              <fieldset className="ac-roles">
                <legend>{copy.signup.roleLabel}</legend>
                {copy.signup.roles.map((role, index) => (
                  <label key={role.value}>
                    <input type="radio" name="role" value={role.value} defaultChecked={index === 0} />
                    <span>{role.label}</span>
                  </label>
                ))}
              </fieldset>

              <label className="ac-consent">
                <input name="consent" type="checkbox" required />
                <span>{copy.signup.consent}</span>
              </label>
            </>
          ) : null}

          {error ? (
            <p className="ac-error" role="alert">
              {error}
            </p>
          ) : null}

          <button className="ac-button" type="submit" disabled={status === "working"}>
            {status === "working" ? text.submitting : text.submit}
          </button>

          <p className="ac-swap">
            {mode === "signup" ? copy.signup.haveAccount : copy.signin.noAccount}{" "}
            <Link href={`/${locale}/${mode === "signup" ? "signin" : "signup"}`}>
              {mode === "signup" ? copy.signup.signIn : copy.signin.createAccount}
            </Link>
          </p>

          {/* Without this a forgotten password is a permanently lost account. */}
          {mode === "signin" ? (
            <p className="ac-swap">
              <Link href={`/${locale}/reset`}>Forgot your password?</Link>
            </p>
          ) : null}
        </form>
      </div>
    </div>
  );
}
