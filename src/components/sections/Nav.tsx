"use client";

import { useEffect, useState } from "react";
import type { Dictionary } from "@/i18n";
import type { Locale } from "@/i18n/config";
import { Container } from "@/components/ui/Container";
import { Wordmark } from "@/components/ui/Wordmark";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { LocaleSwitcher } from "@/components/ui/LocaleSwitcher";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/cn";

export function Nav({ d, locale }: { d: Dictionary; locale: Locale }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // A pinned nav over an open menu would let the page scroll behind it.
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const links = [
    { href: "#platform", label: "Platform" },
    { href: "#band", label: "Band" },
    { href: "#maps", label: "Maps" },
    { href: "#creators", label: d.nav.creators },
    { href: "#shop", label: "Shop" },
  ];

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 border-b text-white transition-colors duration-300",
        scrolled ? "border-white/10 bg-black/88 backdrop-blur-xl" : "border-transparent bg-transparent",
      )}
    >
      <Container className="flex h-16 items-center gap-4">
        <a href="#top" className="shrink-0" aria-label="Terrifit">
          <Wordmark className="[&>span]:!text-white" />
        </a>

        <nav className="hidden flex-1 items-center justify-center gap-7 lg:flex">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-[0.68rem] font-semibold uppercase tracking-[0.06em] text-white/72 transition-colors hover:text-white"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="ms-auto flex items-center gap-2 lg:ms-0">
          <div className="hidden md:block [&_button]:!border-white/20 [&_button]:!text-white">
            <LocaleSwitcher current={locale} label={d.nav.language} />
          </div>
          <div className="hidden">
            <ThemeToggle
              labels={{
                theme: d.nav.theme,
                light: d.nav.themeLight,
                dark: d.nav.themeDark,
              }}
            />
          </div>

          <a
            href="#waitlist"
            onClick={() => track("cta_click", { location: "nav" })}
            className="hidden bg-accent px-5 py-2.5 text-[0.68rem] font-semibold uppercase tracking-[0.06em] text-white transition-colors hover:bg-accent-hover sm:inline-block"
          >
            {d.nav.joinShort}
          </a>

          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            aria-label={open ? d.nav.closeMenu : d.nav.openMenu}
            className="grid size-11 cursor-pointer place-items-center border border-white/25 text-white lg:hidden"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              {open ? (
                <path
                  d="M3.5 3.5l9 9m0-9l-9 9"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              ) : (
                <path
                  d="M2.5 4.5h11M2.5 8h11M2.5 11.5h11"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              )}
            </svg>
          </button>
        </div>
      </Container>

      {open ? (
        <div className="border-t border-border bg-bg lg:hidden">
          <Container className="flex flex-col gap-1 py-4">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-2 py-2.5 text-sm text-fg-2 hover:bg-surface hover:text-fg"
              >
                {link.label}
              </a>
            ))}
            <a
              href="#waitlist"
              onClick={() => {
                setOpen(false);
                track("cta_click", { location: "nav_mobile" });
              }}
              className="mt-2 rounded-lg bg-accent px-4 py-2.5 text-center text-sm font-semibold text-accent-fg"
            >
              {d.nav.join}
            </a>
            <div className="mt-3 flex items-center justify-between sm:hidden">
              <LocaleSwitcher current={locale} label={d.nav.language} />
              <ThemeToggle
                labels={{
                  theme: d.nav.theme,
                  light: d.nav.themeLight,
                  dark: d.nav.themeDark,
                }}
              />
            </div>
          </Container>
        </div>
      ) : null}
    </header>
  );
}
