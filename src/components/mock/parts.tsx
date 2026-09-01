import { cn } from "@/lib/cn";

export type Tone = "good" | "warn" | "bad" | "accent";

const TONE_TEXT: Record<Tone, string> = {
  good: "text-good",
  warn: "text-warn",
  bad: "text-bad",
  accent: "text-accent",
};

const TONE_BG: Record<Tone, string> = {
  good: "bg-good",
  warn: "bg-warn",
  bad: "bg-bad",
  accent: "bg-accent",
};

export function Chip({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-border px-1.5 py-0.5 text-[9px] font-medium",
        TONE_TEXT[tone],
      )}
    >
      <span className={cn("size-1 rounded-full", TONE_BG[tone])} />
      {children}
    </span>
  );
}

export function Bar({ value, tone = "accent" }: { value: number; tone?: Tone }) {
  return (
    <div className="h-1 w-full overflow-hidden rounded-full bg-surface-2">
      <div
        className={cn("h-full rounded-full", TONE_BG[tone])}
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}

export function Avatar({ label, tone = "accent" }: { label: string; tone?: Tone }) {
  return (
    <span
      className={cn(
        "grid size-7 shrink-0 place-items-center rounded-full border border-border bg-surface-2 text-[10px] font-semibold",
        TONE_TEXT[tone],
      )}
      aria-hidden="true"
    >
      {label}
    </span>
  );
}

/** Compact trend line for a metric card. Purely decorative. */
export function Sparkline({
  points,
  className,
  color = "var(--accent)",
}: {
  points: number[];
  className?: string;
  color?: string;
}) {
  const max = Math.max(...points);
  const min = Math.min(...points);
  const range = max - min || 1;
  const step = 100 / (points.length - 1);

  const path = points
    .map((point, index) => {
      const x = index * step;
      const y = 30 - ((point - min) / range) * 26 - 2;
      return `${index === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <svg
      viewBox="0 0 100 30"
      preserveAspectRatio="none"
      className={cn("w-full", className)}
      aria-hidden="true"
    >
      <path d={path} fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function Row({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: Tone;
}) {
  return (
    <div className="flex items-center justify-between py-1.5 text-[11px]">
      <span className="text-fg-3">{label}</span>
      <span className={cn("numeric font-semibold", tone ? TONE_TEXT[tone] : "text-fg")}>
        {value}
      </span>
    </div>
  );
}

export function PhoneFrame({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative w-[286px] shrink-0 rounded-[38px] border border-border-strong bg-bg-elev p-[7px]",
        "shadow-[var(--shadow-card)]",
        className,
      )}
    >
      <div className="relative h-[586px] overflow-hidden rounded-[31px] bg-bg">
        <div className="absolute inset-x-0 top-0 z-10 flex justify-center pt-2">
          <span className="h-[5px] w-16 rounded-full bg-border-strong" />
        </div>
        {children}
      </div>
    </div>
  );
}
