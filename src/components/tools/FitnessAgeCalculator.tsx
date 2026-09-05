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
  /** Population median resting heart rate for the chosen reference curve. */
  median: number;
  restingHr: number;
  capped: boolean;
};

const SEXES = [
  { id: "female", label: "Female" },
  { id: "male", label: "Male" },
  { id: "undisclosed", label: "Prefer not to say" },
] as const;

/** How far either side of your birthday the dial reaches. */
const DIAL_SWING = 12;

/**
 * The free tool.
 *
 * Three inputs, no account, an answer in about ten seconds — and then the
 * working, because "here is your number and here is exactly how we got it" is
 * the whole argument for the product this page leads to.
 *
 * The result is deliberately built as two readings rather than one figure: the
 * age itself on a dial that shows your birthday beside it, and the resting
 * heart rate on the scale it was actually judged against. A single number with
 * a verdict under it is what every other calculator does, and it is exactly the
 * thing that cannot be checked.
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

  const tone = result == null ? "level" : result.delta < -1 ? "younger" : result.delta > 1 ? "older" : "level";

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
        <section className="fa-result" data-tone={tone} aria-live="polite">
          <div className="fa-readout">
            <AgeDial result={result} tone={tone} />
            <div className="fa-readout-copy">
              <p className="fa-result-eyebrow">Your fitness age</p>
              <strong className="fa-number">{result.years}</strong>
              <p className="fa-verdict">{verdict}</p>
              {result.capped ? (
                <p className="fa-capped">
                  Your reading sits beyond what this method can honestly resolve, so the answer is pinned at the
                  limit. Treat it as a floor, not a measurement.
                </p>
              ) : null}
            </div>
          </div>

          {/* The mechanism, drawn. One reading against the distribution it was
              judged against is the entire calculation — showing it is more
              convincing than any sentence claiming the same thing. */}
          <RestingScale result={result} tone={tone} />

          <dl className="fa-detail">
            <div>
              <dt>Estimated VO₂max</dt>
              <dd>{result.vo2max}<small> ml/kg/min</small></dd>
            </div>
            <div>
              <dt>Estimated max heart rate</dt>
              <dd>{result.maxHr}<small> bpm</small></dd>
            </div>
            <div>
              <dt>Your resting heart rate</dt>
              <dd>{result.restingHr}<small> bpm</small></dd>
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
            <p className="fa-caveat">
              This is an estimate from a resting heart rate, not a laboratory test. Treat the direction it moves over
              months as the signal, rather than the number on any one day.
            </p>
          </div>

          <div className="fa-cta">
            <h2>This is one number from one reading</h2>
            <p>
              Terrifit does it every morning from four — heart-rate variability, resting heart rate, sleep and
              breathing rate — and every score opens up the same way this page does. Most apps hand you a figure and
              ask you to trust it.
            </p>
            <Link className="fa-button" href={`/${locale}/band`}>
              See the band
            </Link>
            <Link className="fa-text-link" href={`/${locale}#waitlist`}>
              Or join the list <span aria-hidden>→</span>
            </Link>
          </div>
        </section>
      ) : null}
    </div>
  );
}

/**
 * The age, on a dial that also carries your birthday.
 *
 * A number alone cannot show a gap. Putting the chronological age on the same
 * arc turns "27" into "27, and you are 34", which is the whole finding — and it
 * makes the size of the gap legible without reading a word.
 */
function AgeDial({ result, tone }: { result: Result; tone: string }) {
  const low = result.chronological - DIAL_SWING;
  const span = DIAL_SWING * 2;

  /** Position on the arc, 0 at the left end and 1 at the right. */
  const at = (value: number) => Math.max(0, Math.min(1, (value - low) / span));

  const point = (t: number) => ({
    x: 100 - 80 * Math.cos(Math.PI * t),
    y: 100 - 80 * Math.sin(Math.PI * t),
  });

  const you = at(result.years);
  const birthday = at(result.chronological);
  const marker = point(you);
  const tick = point(birthday);

  // Semicircle, left to right over the top. Length is πr.
  const arc = "M 20 100 A 80 80 0 0 1 180 100";
  const length = Math.PI * 80;

  // The lit portion runs from your birthday to your reading, so the arc itself
  // draws the gap rather than a bar from zero that means nothing.
  const from = Math.min(you, birthday);
  const to = Math.max(you, birthday);

  return (
    <svg className="fa-dial" viewBox="0 0 200 116" role="img" aria-label={`Fitness age ${result.years} against a chronological age of ${result.chronological}`}>
      <path d={arc} className="fa-dial-track" />
      <path
        d={arc}
        className="fa-dial-span"
        strokeDasharray={`${length * (to - from)} ${length}`}
        strokeDashoffset={-length * from}
      />
      {/* Your birthday, as a plain tick. Deliberately quiet — it is the
          reference, not the finding. */}
      <line
        className="fa-dial-tick"
        x1={100 - 68 * Math.cos(Math.PI * birthday)}
        y1={100 - 68 * Math.sin(Math.PI * birthday)}
        x2={tick.x}
        y2={tick.y}
      />
      <circle className="fa-dial-marker" cx={marker.x} cy={marker.y} r={7} />
      <text className="fa-dial-end" x={16} y={114} textAnchor="start">{low}</text>
      <text className="fa-dial-end" x={184} y={114} textAnchor="end">{low + span}</text>
      <text className="fa-dial-tone" x={100} y={114} textAnchor="middle" data-tone={tone}>
        {result.chronological} today
      </text>
    </svg>
  );
}

/**
 * Where the reading sits on the distribution it was judged against.
 *
 * The calculation is one comparison: your resting heart rate against the median
 * for your reference curve. Drawing that comparison is the most honest thing
 * this page can do, because it shows both how far from the middle you are and
 * how much of the scale a few beats actually cover.
 */
function RestingScale({ result, tone }: { result: Result; tone: string }) {
  // The visible window is roughly ±2.5 population SDs, which covers almost
  // everybody without squeezing the middle where most readings land.
  const sd = 9.5;
  const low = result.median - sd * 2.5;
  const high = result.median + sd * 2.5;
  const place = (value: number) => Math.max(2, Math.min(98, ((value - low) / (high - low)) * 100));

  const you = place(result.restingHr);
  const middle = place(result.median);
  const lower = result.restingHr < result.median;

  return (
    <figure className="fa-scale" data-tone={tone}>
      <figcaption>
        <strong>Your resting heart rate against the reference</strong>
        <span>
          {result.restingHr} bpm, {Math.abs(result.restingHr - result.median)} {lower ? "below" : "above"} a median of{" "}
          {result.median}. {lower ? "A lower resting rate is what moves the number down." : "That is what moved the number up."}
        </span>
      </figcaption>

      <div className="fa-scale-track">
        <span className="fa-scale-median" style={{ left: `${middle}%` }} aria-hidden />
        <span className="fa-scale-you" style={{ left: `${you}%` }} aria-hidden />
      </div>

      <div className="fa-scale-labels" aria-hidden>
        <span>Fitter</span>
        <span style={{ left: `${middle}%` }} className="fa-scale-mid-label">Median {result.median}</span>
        <span>Less fit</span>
      </div>
    </figure>
  );
}
