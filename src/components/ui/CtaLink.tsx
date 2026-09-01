"use client";

import { track } from "@/lib/analytics";
import { cn } from "@/lib/cn";

/**
 * Anchor that records which call to action produced a signup, and pre-selects
 * a waitlist role when the copy promises one (the creator CTAs).
 */
export function CtaLink({
  href,
  children,
  location,
  variant = "primary",
  role,
  className,
}: {
  href: string;
  children: React.ReactNode;
  location: string;
  variant?: "primary" | "secondary";
  role?: string;
  className?: string;
}) {
  function onClick() {
    track("cta_click", { location, role: role ?? null });
    if (role) {
      window.dispatchEvent(new CustomEvent("ryvn:select-role", { detail: role }));
    }
  }

  return (
    <a
      href={href}
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[0.85rem] font-semibold transition-colors",
        variant === "primary"
          ? "bg-accent text-accent-fg hover:bg-accent-hover"
          : "border border-border-strong text-fg hover:border-fg-3 hover:bg-surface",
        className,
      )}
    >
      {children}
      <span className="flip-rtl" aria-hidden="true">
        →
      </span>
    </a>
  );
}
