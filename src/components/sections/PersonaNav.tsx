"use client";

import { useEffect, useState } from "react";
import type { Dictionary } from "@/i18n";
import type { Locale, Persona } from "@/i18n/config";
import { Container } from "@/components/ui/Container";
import { Wordmark } from "@/components/ui/Wordmark";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { LocaleSwitcher } from "@/components/ui/LocaleSwitcher";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/cn";

export type SiteLink = { key: Persona | "main"; label: string; href: string; active: boolean };

export function PersonaNav({
  d,
  locale,
  persona,
  links,
}: {
  d: Dictionary;
  locale: Locale;
  persona: Persona;
  links: SiteLink[];
}) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const siteLabel = d.personaCommon.sites[persona];

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b transition-colors duration-300",
        scrolled ? "border-border bg-bg/85 backdrop-blur-xl" : "border-transparent bg-transparent",
      )}
    >
      <Container className="flex h-16 items-center gap-4">
        <a href={`#top`} className="flex shrink-0 items-center gap-2.5" aria-label={`Terrifit ${siteLabel}`}>
          <Wordmark />
          <span className="hidden border-s border-border ps-2.5 text-[0.78rem] font-medium text-fg-2 sm:inline">
            {siteLabel}
          </span>
        </a>

        {/* Cross-links between the persona sites, which live on sibling subdomains. */}
        <nav className="hidden flex-1 items-center justify-center gap-6 lg:flex">
          {links.map((link) => (
            <a
              key={link.key}
              href={link.href}
              onClick={() => track("persona_nav", { from: persona, to: link.key })}
              className={cn(
                "text-[0.8rem] transition-colors",
                link.active ? "text-fg" : "text-fg-3 hover:text-fg",
              )}
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="ms-auto flex items-center gap-2 lg:ms-0">
          <div className="hidden sm:block">
            <LocaleSwitcher current={locale} label={d.nav.language} />
          </div>
          <div className="hidden sm:block">
            <ThemeToggle
              labels={{
                theme: d.nav.theme,
                light: d.nav.themeLight,
                dark: d.nav.themeDark,
              }}
            />
          </div>
          <a
            href="#apply"
            onClick={() => track("cta_click", { location: "persona_nav", persona })}
            className="hidden rounded-full bg-accent px-4 py-2 text-[0.8rem] font-semibold text-accent-fg transition-colors hover:bg-accent-hover sm:inline-block"
          >
            {d.nav.joinShort}
          </a>
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            aria-label={open ? d.nav.closeMenu : d.nav.openMenu}
            className="grid size-9 cursor-pointer place-items-center rounded-full border border-border text-fg lg:hidden"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              {open ? (
                <path d="M3.5 3.5l9 9m0-9l-9 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              ) : (
                <path d="M2.5 4.5h11M2.5 8h11M2.5 11.5h11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
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
                key={link.key}
                href={link.href}
                className={cn(
                  "rounded-lg px-2 py-2.5 text-sm",
                  link.active ? "bg-surface text-fg" : "text-fg-2 hover:bg-surface hover:text-fg",
                )}
              >
                {link.label}
              </a>
            ))}
            <a
              href="#apply"
              onClick={() => setOpen(false)}
              className="mt-2 rounded-lg bg-accent px-4 py-2.5 text-center text-sm font-semibold text-accent-fg"
            >
              {d.personaCommon.applyCta}
            </a>
            <div className="mt-3 flex items-center justify-between sm:hidden">
              <LocaleSwitcher current={locale} label={d.nav.language} align="start" />
              <ThemeToggle
                labels={{ theme: d.nav.theme, light: d.nav.themeLight, dark: d.nav.themeDark }}
              />
            </div>
          </Container>
        </div>
      ) : null}
    </header>
  );
}
