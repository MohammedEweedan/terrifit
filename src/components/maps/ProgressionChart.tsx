"use client";

import { useId, useState } from "react";

/**
 * Estimated one-rep max across a twelve-week block.
 *
 * One series, so there is no legend — the heading names it — and no categorical
 * palette to validate. The single hue is the brand orange, stepped lighter for
 * the dark surface it sits on. Grid and axis are recessive; only the final point
 * is labelled, because a number on every point is noise. Hover gives a crosshair
 * and a readout, and the same numbers are in a table underneath for screen
 * readers and anyone who would rather read them.
 */
export type Point = { week: number; value: number; note?: string };

const W = 720;
const H = 300;
const PAD = { top: 26, right: 54, bottom: 34, left: 44 };

export function ProgressionChart({
  points,
  unit,
  caption,
  title,
}: {
  points: Point[];
  unit: string;
  caption: string;
  title: string;
}) {
  const id = useId();
  const [hover, setHover] = useState<number | null>(null);

  const values = points.map((point) => point.value);
  // A little headroom either side so the line never touches the frame.
  const min = Math.floor((Math.min(...values) - 6) / 5) * 5;
  const max = Math.ceil((Math.max(...values) + 6) / 5) * 5;
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;

  const x = (week: number) =>
    PAD.left + ((week - points[0].week) / (points.at(-1)!.week - points[0].week)) * plotW;
  const y = (value: number) => PAD.top + (1 - (value - min) / (max - min)) * plotH;

  const line = points.map((point, index) => `${index === 0 ? "M" : "L"}${x(point.week).toFixed(1)} ${y(point.value).toFixed(1)}`).join(" ");
  const area = `${line} L${x(points.at(-1)!.week).toFixed(1)} ${PAD.top + plotH} L${x(points[0].week).toFixed(1)} ${PAD.top + plotH} Z`;

  const ticks = [min, min + (max - min) / 2, max];
  const last = points.at(-1)!;
  const active = hover === null ? null : points[hover];

  return (
    <figure className="mp-chart">
      <div className="mp-chart-frame">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          role="img"
          aria-label={`${title}. ${points[0].value} ${unit} in week ${points[0].week}, rising to ${last.value} ${unit} by week ${last.week}.`}
          onMouseLeave={() => setHover(null)}
        >
          <defs>
            <linearGradient id={`${id}-fill`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ff7a45" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#ff7a45" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Grid: three lines, recessive, no vertical rules. */}
          {ticks.map((tick) => (
            <g key={tick}>
              <line
                x1={PAD.left}
                x2={W - PAD.right}
                y1={y(tick)}
                y2={y(tick)}
                stroke="currentColor"
                strokeOpacity="0.13"
                strokeWidth="1"
              />
              <text x={PAD.left - 10} y={y(tick) + 4} textAnchor="end" className="mp-chart-axis">
                {Math.round(tick)}
              </text>
            </g>
          ))}

          <path d={area} fill={`url(#${id}-fill)`} />
          <path d={line} fill="none" stroke="#ff7a45" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />

          {/* Only the last point is labelled; the rest are found by hovering. */}
          <circle cx={x(last.week)} cy={y(last.value)} r="5" fill="#ff7a45" stroke="#0a0a0a" strokeWidth="2" />
          <text x={x(last.week) + 12} y={y(last.value) + 4} className="mp-chart-value">
            {last.value} {unit}
          </text>

          {points.map((point) => (
            <text key={point.week} x={x(point.week)} y={H - 10} textAnchor="middle" className="mp-chart-axis">
              {point.week % 2 === 1 ? point.week : ""}
            </text>
          ))}

          {active ? (
            <g>
              <line
                x1={x(active.week)}
                x2={x(active.week)}
                y1={PAD.top}
                y2={PAD.top + plotH}
                stroke="#ff7a45"
                strokeOpacity="0.5"
                strokeWidth="1"
              />
              <circle cx={x(active.week)} cy={y(active.value)} r="5" fill="#ff7a45" stroke="#0a0a0a" strokeWidth="2" />
            </g>
          ) : null}

          {/* Invisible hit areas, one per week and much wider than the marks. */}
          {points.map((point, index) => (
            <rect
              key={point.week}
              x={x(point.week) - plotW / (points.length - 1) / 2}
              y={PAD.top}
              width={plotW / (points.length - 1)}
              height={plotH}
              fill="transparent"
              onMouseEnter={() => setHover(index)}
              onFocus={() => setHover(index)}
              tabIndex={0}
              role="button"
              aria-label={`Week ${point.week}: ${point.value} ${unit}${point.note ? `, ${point.note}` : ""}`}
            />
          ))}
        </svg>

        {active ? (
          <div
            className="mp-chart-tip"
            style={{ left: `${(x(active.week) / W) * 100}%`, top: `${(y(active.value) / H) * 100}%` }}
          >
            <strong className="numeric">
              {active.value} {unit}
            </strong>
            <span>Week {active.week}</span>
            {active.note ? <em>{active.note}</em> : null}
          </div>
        ) : null}
      </div>

      <figcaption>{caption}</figcaption>

      {/* The same numbers, readable without the picture. */}
      <details className="mp-chart-table">
        <summary>Show the numbers</summary>
        <table>
          <caption className="sr-only">{title}</caption>
          <thead>
            <tr>
              <th scope="col">Week</th>
              <th scope="col">Estimated 1RM ({unit})</th>
            </tr>
          </thead>
          <tbody>
            {points.map((point) => (
              <tr key={point.week}>
                <th scope="row">{point.week}</th>
                <td className="numeric">{point.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}
