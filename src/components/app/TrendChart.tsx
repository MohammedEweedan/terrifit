"use client";

import { useId, useState } from "react";

export type TrendPoint = { date: string; value: number | null };

/**
 * How to render a value. A descriptor rather than a function, because a server
 * component cannot hand a closure to a client one — the props have to survive
 * serialisation.
 */
export type TrendUnit = "percent" | "ms" | "bpm" | "duration" | "count" | "kg";

function formatValue(value: number, unit: TrendUnit): string {
  switch (unit) {
    case "percent": return `${Math.round(value)}%`;
    case "ms": return `${Math.round(value)} ms`;
    case "bpm": return `${Math.round(value)} bpm`;
    case "kg": return `${value.toFixed(1)} kg`;
    case "count": return Math.round(value).toLocaleString();
    case "duration": {
      const hours = Math.floor(value / 60);
      const rest = Math.round(value % 60);
      return hours > 0 ? `${hours}h ${String(rest).padStart(2, "0")}m` : `${rest}m`;
    }
  }
}

/** The axis wants the number, not the unit. */
function formatTick(value: number, unit: TrendUnit): string {
  return unit === "duration" ? `${Math.round(value / 60)}h` : formatValue(value, unit).replace(/ .*$/, "");
}

const W = 640;
const H = 150;
const PAD = { top: 14, right: 12, bottom: 18, left: 44 };

/**
 * Ninety days of one metric.
 *
 * One series, so no legend — the heading names it. Gaps in the data are drawn
 * as gaps rather than joined across, because a straight line through a week you
 * did not wear anything is a claim the data does not support.
 */
export function TrendChart({
  label,
  points,
  unit,
  averageLabel,
  emptyLabel,
}: {
  label: string;
  points: TrendPoint[];
  unit: TrendUnit;
  averageLabel: string;
  emptyLabel: string;
}) {
  const format = (value: number) => formatValue(value, unit);
  const id = useId();
  const [hover, setHover] = useState<number | null>(null);

  const present = points.filter((point): point is { date: string; value: number } => point.value !== null);
  if (present.length < 2) {
    return (
      <figure className="ap-chart is-empty">
        <figcaption>{label}</figcaption>
        <p>{emptyLabel}</p>
      </figure>
    );
  }

  const values = present.map((point) => point.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const lo = min - span * 0.15;
  const hi = max + span * 0.15;
  const mean = values.reduce((total, value) => total + value, 0) / values.length;

  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;
  const x = (index: number) => PAD.left + (index / Math.max(1, points.length - 1)) * plotW;
  const y = (value: number) => PAD.top + (1 - (value - lo) / (hi - lo)) * plotH;

  // Broken into runs so a gap in the data stays a gap in the line.
  const runs: Array<Array<{ i: number; v: number }>> = [];
  points.forEach((point, i) => {
    if (point.value === null) {
      if (runs.at(-1)?.length) runs.push([]);
      return;
    }
    if (runs.length === 0) runs.push([]);
    runs.at(-1)!.push({ i, v: point.value });
  });

  const active = hover === null ? null : points[hover];

  return (
    <figure className="ap-chart">
      <figcaption>
        {label}
        <span className="numeric">
          {format(mean)} {averageLabel}
        </span>
      </figcaption>

      <div className="ap-chart-frame">
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${label}: ${format(min)} to ${format(max)} over ${points.length} days.`} onMouseLeave={() => setHover(null)}>
          <defs>
            <linearGradient id={`${id}-f`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ff7a45" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#ff7a45" stopOpacity="0" />
            </linearGradient>
          </defs>

          {[hi, (hi + lo) / 2, lo].map((tick) => (
            <g key={tick}>
              <line x1={PAD.left} x2={W - PAD.right} y1={y(tick)} y2={y(tick)} className="ap-chart-grid" />
              <text x={PAD.left - 8} y={y(tick) + 3.5} textAnchor="end" className="ap-chart-axis">
                {formatTick(tick, unit)}
              </text>
            </g>
          ))}

          {runs.filter((run) => run.length > 1).map((run) => {
            const d = run.map((p, k) => `${k === 0 ? "M" : "L"}${x(p.i).toFixed(1)} ${y(p.v).toFixed(1)}`).join(" ");
            const area = `${d} L${x(run.at(-1)!.i).toFixed(1)} ${PAD.top + plotH} L${x(run[0].i).toFixed(1)} ${PAD.top + plotH} Z`;
            return (
              <g key={run[0].i}>
                <path d={area} fill={`url(#${id}-f)`} />
                <path d={d} className="ap-chart-line" />
              </g>
            );
          })}

          {active?.value != null ? (
            <g>
              <line x1={x(hover!)} x2={x(hover!)} y1={PAD.top} y2={PAD.top + plotH} className="ap-chart-cross" />
              <circle cx={x(hover!)} cy={y(active.value)} r="4" className="ap-chart-dot" />
            </g>
          ) : null}

          {points.map((point, index) => (
            <rect
              key={point.date}
              x={x(index) - plotW / points.length / 2}
              y={PAD.top}
              width={plotW / points.length}
              height={plotH}
              fill="transparent"
              onMouseEnter={() => setHover(index)}
            />
          ))}
        </svg>

        {active?.value != null ? (
          <div className="ap-chart-tip" style={{ left: `${(x(hover!) / W) * 100}%` }}>
            <strong className="numeric">{format(active.value)}</strong>
            <span>{new Date(active.date).toLocaleDateString(undefined, { day: "numeric", month: "short" })}</span>
          </div>
        ) : null}
      </div>
    </figure>
  );
}
