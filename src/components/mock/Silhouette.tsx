import { cn } from "@/lib/cn";

/**
 * Stand-in for a progress photograph.
 *
 * Real transformation photography is licensed and shot per market — until
 * then this abstract figure carries the layout honestly rather than implying
 * results with a stock body. The head sits at a known position so the
 * face-blur demo can target it.
 */
export function Silhouette({
  blur = 0,
  className,
  label,
  tone = "accent",
}: {
  /** Blur radius in pixels applied over the face region. */
  blur?: number;
  className?: string;
  label?: string;
  tone?: "accent" | "neutral";
}) {
  const gradientId = `sil-${tone}`;

  return (
    <div className={cn("relative overflow-hidden bg-surface-2", className)}>
      <svg
        viewBox="0 0 100 160"
        preserveAspectRatio="xMidYMid slice"
        className="h-full w-full"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0.6" y2="1">
            <stop
              offset="0%"
              stopColor={tone === "accent" ? "var(--accent)" : "var(--fg-3)"}
              stopOpacity="0.42"
            />
            <stop offset="100%" stopColor="var(--fg-3)" stopOpacity="0.1" />
          </linearGradient>
        </defs>
        <rect width="100" height="160" fill="var(--surface-2)" />
        <g fill={`url(#${gradientId})`}>
          <circle cx="50" cy="34" r="13" />
          <path d="M50 50c-13 0-21 7-23 19l-4 24h10l2 45h30l2-45h10l-4-24c-2-12-10-19-23-19Z" />
        </g>
        {/* Faint grid, echoing the measurement language of the product. */}
        <g stroke="var(--border)" strokeWidth="0.4" opacity="0.55">
          <path d="M0 40h100M0 80h100M0 120h100" />
        </g>
      </svg>

      {blur > 0 ? (
        <div
          className="pointer-events-none absolute start-[28%] top-[13%] size-[30%] rounded-full"
          style={{
            backdropFilter: `blur(${blur}px)`,
            WebkitBackdropFilter: `blur(${blur}px)`,
          }}
        />
      ) : null}

      {label ? (
        <p className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 to-transparent p-2 text-[9px] leading-tight text-white/85">
          {label}
        </p>
      ) : null}
    </div>
  );
}
