"use client";

import { useState } from "react";
import type { PagesCopy } from "@/i18n/pages";
import type { Score } from "@/lib/health/scores";

type AppCopy = PagesCopy["app"];

/**
 * One score, and the arithmetic behind it.
 *
 * The expandable breakdown is the whole argument for this app over the ones
 * that came before it: a recovery number you cannot interrogate is a horoscope.
 * Every input shows its reading, what it was compared against, how much weight
 * it carried and the sub-score it produced — and what is missing shows too.
 */
export function ScoreCard({
  copy,
  label,
  blurb,
  score,
  unit,
  max = 100,
  hero = false,
}: {
  copy: AppCopy;
  label: string;
  blurb: string;
  score: Score;
  unit: string;
  max?: number;
  hero?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const pct = score.value === null ? 0 : Math.min(100, (score.value / max) * 100);

  return (
    <article className={`ap-card ap-band-${score.band} ${hero ? "is-hero" : ""}`}>
      <header>
        <h2>{label}</h2>
        {score.value !== null && score.band !== "unknown" ? (
          <span className="ap-pill">{copy.bands[score.band]}</span>
        ) : null}
      </header>

      <div className="ap-readout">
        <Dial value={score.value} unit={unit} pct={pct} hero={hero} />
        <p>{blurb}</p>
      </div>

      {score.value === null ? (
        <p className="ap-nodata">{copy.noScore}</p>
      ) : (
        <button type="button" className="ap-why" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
          {open ? copy.whyClose : copy.why}
          <span aria-hidden>{open ? "−" : "+"}</span>
        </button>
      )}

      {open && score.value !== null ? (
        <div className="ap-breakdown">
          <div className="ap-scroller">
            <table>
              <thead>
                <tr>
                  {copy.inputsHead.map((head, index) => (
                    <th key={head} scope="col" className={index > 2 ? "num" : undefined}>
                      {head}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {score.inputs.map((input) => (
                  <tr key={input.label}>
                    <th scope="row">
                      {input.label}
                      <small>{copy[input.direction]}</small>
                    </th>
                    <td>{input.value}</td>
                    <td className="ap-muted">{input.baseline ?? "—"}</td>
                    <td className="num">{input.weight > 0 ? `${Math.round(input.weight * 100)}%` : "—"}</td>
                    <td className="num">
                      {input.weight > 0 ? (
                        <span className="ap-sub">
                          <i style={{ width: `${Math.round(input.contribution)}%` }} />
                          {Math.round(input.contribution)}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {score.missing.length > 0 ? (
            <div className="ap-missing">
              <strong>{copy.missingTitle}</strong>
              <p>{copy.missingBody}</p>
              <ul>
                {score.missing.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}

      {score.caveat ? <p className="ap-caveat">{score.caveat}</p> : null}
    </article>
  );
}

/**
 * The number itself. An arc for the hero card, a bar for the rest — a row of
 * four identical rings reads as decoration rather than hierarchy.
 */
function Dial({
  value,
  unit,
  pct,
  hero,
}: {
  value: number | null;
  unit: string;
  pct: number;
  hero: boolean;
}) {
  if (!hero) {
    return (
      <div className="ap-figure">
        <strong className="numeric">
          {value === null ? "—" : value}
          {value !== null && unit ? <em>{unit}</em> : null}
        </strong>
        <span className="ap-bar" aria-hidden>
          <i style={{ width: `${pct}%` }} />
        </span>
      </div>
    );
  }

  const r = 52;
  const circumference = 2 * Math.PI * r;
  return (
    <div className="ap-dial">
      <svg viewBox="0 0 120 120" aria-hidden="true">
        <circle cx="60" cy="60" r={r} className="ap-dial-track" />
        <circle
          cx="60"
          cy="60"
          r={r}
          className="ap-dial-fill"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - pct / 100)}
        />
      </svg>
      <strong className="numeric">
        {value === null ? "—" : value}
        {value !== null && unit ? <em>{unit}</em> : null}
      </strong>
    </div>
  );
}
