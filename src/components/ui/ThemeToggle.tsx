"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import { THEME_KEY } from "@/lib/theme";
import { useClientValue, useHydrated } from "@/lib/client-value";

type Theme = "light" | "dark";

/**
 * The theme already applied to the document. The inline head script sets
 * `data-theme` before first paint, so this reads what is on screen rather than
 * guessing; it falls back to the stored value and then the OS preference.
 */
function readInitialTheme(): Theme {
  const applied = document.documentElement.getAttribute("data-theme");
  if (applied === "light" || applied === "dark") return applied;
  try {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === "light" || stored === "dark") return stored;
    if (window.matchMedia("(prefers-color-scheme: light)").matches) return "light";
  } catch {
    // Storage blocked — dark-first is the correct fallback.
  }
  return "dark";
}

/**
 * Two-state switch. There is no "system" option by design — the reader gets an
 * unambiguous choice. The initial state still respects the OS preference on a
 * first visit, it just isn't a selectable third state.
 */
export function ThemeToggle({
  labels,
  className,
}: {
  labels: { theme: string; light: string; dark: string };
  className?: string;
}) {
  // The stored preference and the OS setting are external state, read during
  // render rather than copied into state by an effect. `chosen` is null until
  // the visitor actually presses the switch, so their own choice always wins.
  const initial = useClientValue(readInitialTheme, "dark");
  const [chosen, setChosen] = useState<Theme | null>(null);
  const mounted = useHydrated();
  const theme = chosen ?? initial;

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setChosen(next);
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      // Non-fatal: the choice still holds for this page view.
    }
  }

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      role="switch"
      aria-checked={mounted ? isDark : undefined}
      aria-label={`${labels.theme}: ${isDark ? labels.dark : labels.light}`}
      title={labels.theme}
      onClick={toggle}
      className={cn(
        "relative inline-flex h-8 w-[58px] shrink-0 cursor-pointer items-center rounded-full",
        "border border-border bg-surface p-1 transition-colors hover:border-border-strong",
        className,
      )}
    >
      {/* Knob slides with a logical offset so it mirrors correctly in RTL. */}
      <span
        className={cn(
          "absolute grid size-6 place-items-center rounded-full bg-accent text-accent-fg",
          "transition-[inset-inline-start] duration-300 ease-out",
          isDark ? "start-1" : "start-[calc(100%-1.75rem)]",
        )}
        aria-hidden="true"
      >
        {isDark ? <IconMoon /> : <IconSun />}
      </span>
    </button>
  );
}

function IconSun() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M8 1.2v1.5M8 13.3v1.5M14.8 8h-1.5M2.7 8H1.2M12.8 3.2l-1 1M4.2 11.8l-1 1M12.8 12.8l-1-1M4.2 4.2l-1-1"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconMoon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M13.4 9.7A5.7 5.7 0 0 1 6.3 2.6a5.7 5.7 0 1 0 7.1 7.1Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}
