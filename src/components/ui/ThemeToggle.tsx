"use client";

import { useSyncExternalStore } from "react";
import { cn } from "@/lib/cn";
import { getTheme, getServerTheme, setTheme, subscribeTheme } from "@/lib/theme";


export function ThemeToggle({
  labels,
  className,
}: {
  labels: { theme: string; light: string; dark: string };
  className?: string;
}) {
  const theme = useSyncExternalStore(subscribeTheme, getTheme, getServerTheme);
  function toggle() { setTheme(theme === "dark" ? "light" : "dark"); }

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
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
