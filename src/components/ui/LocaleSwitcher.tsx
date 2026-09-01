"use client";

import { useEffect, useRef, useState } from "react";
import { rememberLocale } from "@/lib/locale-cookie";
import { usePathname, useRouter } from "next/navigation";
import { localeMeta, locales, type Locale } from "@/i18n/config";
import { cn } from "@/lib/cn";

/**
 * Ten locales is too many for inline buttons, so this is a popover list.
 * Switching swaps the locale segment in place — the reader stays on the same
 * section — and records the choice so it survives the next visit.
 */
export function LocaleSwitcher({
  current,
  label,
  align = "end",
}: {
  current: Locale;
  label: string;
  align?: "start" | "end";
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  function switchTo(next: Locale) {
    setOpen(false);
    if (next === current) return;

    rememberLocale(next);

    const segments = pathname.split("/");
    segments[1] = next;
    const search = typeof window !== "undefined" ? window.location.search : "";
    router.push(`${segments.join("/")}${search}`);
    router.refresh();
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={label}
        className={cn(
          "inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-full border border-border",
          "bg-surface px-3 text-[0.78rem] font-medium text-fg-2 transition-colors",
          "hover:border-border-strong hover:text-fg",
        )}
      >
        <IconGlobe />
        <span className="uppercase">{current}</span>
        <svg
          width="10"
          height="10"
          viewBox="0 0 12 12"
          fill="none"
          aria-hidden="true"
          className={cn("transition-transform", open && "rotate-180")}
        >
          <path
            d="m3 4.5 3 3 3-3"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open ? (
        <div
          role="listbox"
          aria-label={label}
          className={cn(
            "absolute top-[calc(100%+8px)] z-50 max-h-[320px] w-[190px] overflow-y-auto",
            "rounded-xl border border-border bg-bg-elev p-1 shadow-[var(--shadow-card)]",
            align === "end" ? "end-0" : "start-0",
          )}
        >
          {locales.map((locale) => {
            const meta = localeMeta[locale];
            const active = locale === current;
            return (
              <button
                key={locale}
                type="button"
                role="option"
                aria-selected={active}
                lang={meta.htmlLang}
                dir={meta.dir}
                onClick={() => switchTo(locale)}
                className={cn(
                  "flex w-full cursor-pointer items-center justify-between gap-2 rounded-lg px-3 py-2 text-start",
                  active ? "bg-accent-soft text-accent" : "text-fg-2 hover:bg-surface hover:text-fg",
                )}
              >
                <span className="min-w-0">
                  <span className="block truncate text-[0.82rem] font-medium">{meta.label}</span>
                  <span className="block truncate text-[0.68rem] text-fg-3">
                    {meta.englishLabel}
                  </span>
                </span>
                {active ? (
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                    <path
                      d="m2.5 6.2 2.4 2.4 4.6-5"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

function IconGlobe() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="6.2" stroke="currentColor" strokeWidth="1.3" />
      <path
        d="M8 1.8c-1.7 1.7-2.6 3.8-2.6 6.2S6.3 12.5 8 14.2c1.7-1.7 2.6-3.8 2.6-6.2S9.7 3.5 8 1.8ZM2 8h12"
        stroke="currentColor"
        strokeWidth="1.3"
      />
    </svg>
  );
}
