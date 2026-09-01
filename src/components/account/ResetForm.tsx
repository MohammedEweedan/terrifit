"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import type { Locale } from "@/i18n/config";

/**
 * Two states in one page: ask for a link, or use one.
 *
 * Which is decided by whether the URL carries a token, so the email's link
 * lands directly on the "set a new password" step rather than making somebody
 * request a second one from the same page.
 */
export function ResetForm({ locale }: { locale: Locale }) {
  return (
    <Suspense fallback={null}>
      <ResetInner locale={locale} />
    </Suspense>
  );
}

function ResetInner({ locale }: { locale: Locale }) {
  const token = useSearchParams().get("token");
  return token ? <SetPassword locale={locale} token={token} /> : <RequestLink locale={locale} />;
}

function RequestLink({ locale }: { locale: Locale }) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (state === "sending") return;
    setState("sending");
    await fetch("/api/auth/reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, locale }),
    }).catch(() => {});
    // Always the same answer, whether or not that address has an account —
    // otherwise this page becomes a tool for finding out who has one.
    setState("sent");
  }

  if (state === "sent") {
    return (
      <div className="rs-page">
        <p className="rs-eyebrow">Password reset</p>
        <h1>Check your inbox</h1>
        <p className="rs-body">
          If there is a Terrifit account on {email || "that address"}, a link is on its way. It works once and
          expires in 30 minutes.
        </p>
        <p className="rs-body">Nothing arrived? Check spam, then try again in a few minutes.</p>
        <Link className="rs-back" href={`/${locale}/signin`}>
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <form className="rs-page" onSubmit={submit}>
      <p className="rs-eyebrow">Password reset</p>
      <h1>Forgot your password?</h1>
      <p className="rs-body">Put in your email and we&apos;ll send you a link to set a new one.</p>

      <label className="rs-label" htmlFor="reset-email">
        Email
      </label>
      <input
        id="reset-email"
        className="rs-input"
        type="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        autoComplete="email"
        required
      />

      <button className="rs-submit" type="submit" disabled={state === "sending"}>
        {state === "sending" ? "Sending…" : "Send the link"}
      </button>
      <Link className="rs-back" href={`/${locale}/signin`}>
        Back to sign in
      </Link>
    </form>
  );
}

function SetPassword({ locale, token }: { locale: Locale; token: string }) {
  const [password, setPassword] = useState("");
  const [state, setState] = useState<"idle" | "saving" | "done">("idle");
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (state === "saving") return;
    setState("saving");
    setError("");

    const response = await fetch("/api/auth/reset", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    }).catch(() => null);

    if (response?.ok) {
      setState("done");
      return;
    }
    setState("idle");
    setError(
      response?.status === 400
        ? "That link has expired or has already been used. Ask for a new one."
        : "That didn't save. Check the password is at least 10 characters and try again.",
    );
  }

  if (state === "done") {
    return (
      <div className="rs-page">
        <p className="rs-eyebrow">Password reset</p>
        <h1>Done</h1>
        <p className="rs-body">
          Your password is changed and everything else has been signed out — including anyone who should not have
          been there. Sign in with the new one.
        </p>
        <Link className="rs-back" href={`/${locale}/signin`}>
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <form className="rs-page" onSubmit={submit}>
      <p className="rs-eyebrow">Password reset</p>
      <h1>Set a new password</h1>
      <p className="rs-body">
        At least 10 characters. Length beats symbols — a phrase you will remember is stronger than a short one full of
        punctuation.
      </p>

      <label className="rs-label" htmlFor="reset-password">
        New password
      </label>
      <input
        id="reset-password"
        className="rs-input"
        type="password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        minLength={10}
        autoComplete="new-password"
        required
      />

      {error ? <p className="rs-error">{error}</p> : null}

      <button className="rs-submit" type="submit" disabled={state === "saving"}>
        {state === "saving" ? "Saving…" : "Save it"}
      </button>
    </form>
  );
}
