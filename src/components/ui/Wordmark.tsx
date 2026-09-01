import { cn } from "@/lib/cn";

/**
 * The mark is a route peak — the shape of a plan that goes up and comes back
 * down under control. Always rendered LTR: a wordmark does not mirror in RTL.
 */
export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)} dir="ltr">
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <rect x="0.5" y="0.5" width="19" height="19" rx="5.5" stroke="var(--border-strong)" />
        <path
          d="M4 13.5 8 6.5l2.6 4.4L12.4 8l3.6 5.5"
          stroke="var(--accent)"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className="text-[0.95rem] font-semibold tracking-[0.16em] text-fg">Terrifit</span>
    </span>
  );
}
