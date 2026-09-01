"use client";

import Link from "next/link";
import { useState } from "react";
import type { Locale } from "@/i18n/config";

type Result = {
  years: number;
  chronological: number;
  delta: number;
  vo2max: number;
  maxHr: number;
  capped: boolean;
};

const SEXES = [
  { id: "female", label: "Female" },
  { id: "male", label: "Male" },
  { id: "undisclosed", label: "Prefer not to say" },
] as const;

/**
 * The free tool.
 *
 * Three inputs, no account, an answer in about ten seconds — and then the
 * working, because "here is your number and here is exactly how we got it" is
 * the whole argument for the product this page leads to.
 */
export function FitnessAgeCalculator({ locale }: { locale: Locale }) {
  const [age, setAge] = useState("");
  const [restingHr, setRestingHr] = useState("");
  const [sex, setSex] = useState<string>("undisclosed");
  const [result, setResult] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const ready = Number(age) >= 13 && Number(age) <= 100 && Number(restingHr) >= 30 && Number(restingHr) <= 140;

  async function calculate(event: React.FormEvent) {
    event.preventDefault();
    if (!ready || busy) return;
    setBusy(true);
    setError("");
    const response = await fetch("/api/fitness-age", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ age: Number(age), restingHr: Number(restingHr), sex }),
    }).catch(() => null);

    if (!response?.ok) {
      setError("Something went wrong. Check the numbers and try again.");
      setBusy(false);
      return;
    }
    setResult((await response.json()) as Result);
    setBusy(false);
  }

  const verdict =
    result == null
      ? ""
      : result.delta < -1
        ? `${Math.abs(result.delta)} years younger than your birthday says`
        : result.delta > 1
          ? `${result.delta} years above your birthday`
          : "Right on your years";

  return (
    <div className="fa">
      <section className="fa-hero">
        <span className="fa-eyebrow">Free · no account</span>
        <h1>What&apos;s your fitness age?</h1>
        <p className="fa-lede">
          Your resting heart rate says more about your fitness than your birthday does. Three numbers, ten seconds,
          and you can see exactly how the answer was reached.
        </p>

        <form className="fa-form" onSubmit={calculate}>
          <div className="fa-fields">
            <label>
              <span>Your age</span>
              <input
                inputMode="numeric"
                value={age}
                onChange={(event) => setAge(event.target.value.replace(/\D/g, "").slice(0, 3))}
                placeholder="34"
              />
            </label>
            <label>
              <span>Resting heart rate</span>
              <input
                inputMode="numeric"
                value={restingHr}
                onChange={(event) => setRestingHr(event.target.value.replace(/\D/g, "").slice(0, 3))}
                placeholder="58"
              />
              <small>bpm</small>
            </label>
          </div>

          <fieldset className="fa-sex">
            <legend>Sex, for the reference curve</legend>
            {SEXES.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setSex(option.id)}
                className={sex === option.id ? "active" : ""}
              >
                {option.label}
              </button>
            ))}
          </fieldset>

          <button type="submit" className="fa-submit" disabled={!ready || busy}>
            {busy ? "Working it out…" : "Show me"}
          </button>
          <p className="fa-where">
            Don&apos;t know your resting heart rate? It&apos;s in Apple Health under Heart, or on any fitness watch.
          </p>
          {error ? <p className="fa-error">{error}</p> : null}
        </form>
      </section>

      {result ? (
        <section className="fa-result">
          <div className="fa-number">
            <strong>{result.years}</strong>
            <span>your fitness age</span>
          </div>
          <p className="fa-verdict">{verdict}</p>

          <dl className="fa-detail">
            <div>
              <dt>Estimated VO₂max</dt>
              <dd>{result.vo2max} ml/kg/min</dd>
            </div>
            <div>
              <dt>Estimated max heart rate</dt>
              <dd>{result.maxHr} bpm</dd>
            </div>
            <div>
              <dt>Your resting heart rate</dt>
              <dd>{restingHr} bpm</dd>
            </div>
          </dl>

          <div className="fa-working">
            <h2>How that was worked out</h2>
            <ol>
              <li>
                Your maximum heart rate is estimated at <b>{result.maxHr} bpm</b> from your age — Tanaka et al.
                (2001), which is meaningfully better than the folk <i>220 − age</i>.
              </li>
              <li>
                Maximum over resting gives a VO₂max of <b>{result.vo2max}</b> — Uth, Sørensen, Overgaard and Pedersen
                (2004), the only estimate that needs nothing but two heart rates.
              </li>
              <li>
                That is compared against the median VO₂max for each age on the ACSM norms. The age where yours would
                be unremarkable is <b>{result.years}</b>.
              </li>
            </ol>
            {result.capped ? (
              <p className="fa-capped">
                Your reading sits beyond what this method can honestly resolve, so the answer is capped at twenty
                years from your age.
              </p>
            ) : null}
            <p className="fa-caveat">
              This is an estimate from a resting heart rate, not a laboratory test. Treat the direction it moves over
              months as the signal, rather than the number on any one day.
            </p>
          </div>

          <div className="fa-cta">
            <h2>Terrifit does this every morning</h2>
            <p>
              Recovery, sleep, strain and movement — every one showing the inputs behind it, read straight from Apple
              Health. Most apps hand you a score and ask you to trust it.
            </p>
            <Link className="fa-button" href={`/${locale}#waitlist`}>
              Get the app when it lands
            </Link>
          </div>
        </section>
      ) : null}
    </div>
  );
}
