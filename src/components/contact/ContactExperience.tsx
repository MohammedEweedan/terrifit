"use client";

import Link from "next/link";
import { useState } from "react";
import type { Locale } from "@/i18n/config";
import type { PagesCopy } from "@/i18n/pages";
import { TurnstileWidget } from "@/components/security/TurnstileWidget";

type Status = "idle" | "sending" | "sent" | "error";

export function ContactExperience({ locale, copy }: { locale: Locale; copy: PagesCopy["contact"] }) {
  return (
    <div className="ct">
      <header className="ct-hero">
        <div className="tf-shell">
          <p className="ct-eyebrow">{copy.hero.eyebrow}</p>
          <h1>{copy.hero.title}</h1>
          <p className="ct-lede">{copy.hero.sub}</p>
        </div>
      </header>

      <section className="ct-main">
        <div className="tf-shell ct-layout">
          <ContactForm locale={locale} copy={copy.form} />
          <aside className="ct-aside">
            <div className="ct-panel">
              <h2>{copy.channels.title}</h2>
              <ul className="ct-channels">
                {copy.channels.items.map((item) => (
                  <li key={item.email}>
                    <strong>{item.label}</strong>
                    <a href={`mailto:${item.email}`}>{item.email}</a>
                    <span>{item.note}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="ct-panel">
              <h2>{copy.response.title}</h2>
              <dl className="ct-response">
                {copy.response.rows.map(([label, value]) => (
                  <div key={label}>
                    <dt>{label}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="ct-panel">
              <h2>{copy.offices.title}</h2>
              <ul className="ct-offices">
                {copy.offices.items.map((office) => (
                  <li key={office.city}>
                    <strong>{office.city}</strong>
                    <span>{office.line}</span>
                    <em>{office.detail}</em>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </section>

      <section className="ct-faq">
        <div className="tf-shell">
          <h2>{copy.faq.title}</h2>
          <div className="ct-faq-list">
            {copy.faq.items.map((item) => (
              <details key={item.q}>
                <summary>{item.q}</summary>
                <p>{item.a}</p>
              </details>
            ))}
          </div>
          <Link className="ct-link" href={`/${locale}/support`}>
            {copy.channels.title} <span aria-hidden>→</span>
          </Link>
        </div>
      </section>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function ContactForm({ locale, copy }: { locale: Locale; copy: PagesCopy["contact"]["form"] }) {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const [invalid, setInvalid] = useState<string[]>([]);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setStatus("sending");
    setError("");
    setInvalid([]);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: form.get("topic"),
          name: form.get("name"),
          email: form.get("email"),
          message: form.get("message"),
          consent: form.get("consent") === "on",
          turnstileToken,
          locale,
        }),
      });

      if (response.ok) {
        setStatus("sent");
        return;
      }

      const payload = (await response.json().catch(() => null)) as
        | { error?: string; fields?: string[] }
        | null;

      setStatus("error");
      if (response.status === 429) setError(copy.errorRate);
      else if (response.status === 422) {
        setInvalid(payload?.fields ?? []);
        setError(copy.errorValidation);
      } else setError(copy.errorGeneric);
    } catch {
      setStatus("error");
      setError(copy.errorGeneric);
    }
  }

  if (status === "sent") {
    return (
      <div className="ct-form ct-sent" role="status">
        <strong>{copy.successTitle}</strong>
        <p>{copy.successBody}</p>
      </div>
    );
  }

  return (
    <form className="ct-form" onSubmit={submit} noValidate={false}>
      <h2>{copy.title}</h2>

      <label className="ct-field">
        <span>{copy.topicLabel}</span>
        <select name="topic" defaultValue={copy.topics[0].value} required>
          {copy.topics.map((topic) => (
            <option key={topic.value} value={topic.value}>
              {topic.label}
            </option>
          ))}
        </select>
      </label>

      <div className="ct-field-row">
        <label className={`ct-field ${invalid.includes("name") ? "is-invalid" : ""}`}>
          <span>{copy.nameLabel}</span>
          <input name="name" type="text" required maxLength={120} placeholder={copy.namePlaceholder} autoComplete="name" />
        </label>
        <label className={`ct-field ${invalid.includes("email") ? "is-invalid" : ""}`}>
          <span>{copy.emailLabel}</span>
          <input name="email" type="email" required maxLength={254} placeholder={copy.emailPlaceholder} autoComplete="email" />
        </label>
      </div>

      <label className={`ct-field ${invalid.includes("message") ? "is-invalid" : ""}`}>
        <span>{copy.messageLabel}</span>
        <textarea name="message" required minLength={10} maxLength={4000} rows={7} placeholder={copy.messagePlaceholder} />
      </label>

      <label className="ct-consent">
        <input name="consent" type="checkbox" required />
        <span>{copy.consent}</span>
      </label>

      {error ? (
        <p className="ct-error" role="alert">
          {error}
        </p>
      ) : null}

      <TurnstileWidget onToken={setTurnstileToken} action="contact" />

      <button className="ct-button" type="submit" disabled={status === "sending"}>
        {status === "sending" ? copy.sending : copy.submit}
      </button>
    </form>
  );
}
