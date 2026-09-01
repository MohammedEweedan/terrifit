import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { getDictionary } from "@/i18n";
import { isLocale, isPersona, personas, type Persona } from "@/i18n/config";
import { getMarkets } from "@/lib/markets";
import { siteUrl } from "@/lib/site";
import type { Role } from "@/lib/validation";
import { PersonaNav, type SiteLink } from "@/components/sections/PersonaNav";
import {
  BrandResponsibilities,
  PersonaEconomics,
  PersonaFounding,
  PersonaHero,
  PersonaPoints,
  PersonaSteps,
} from "@/components/sections/PersonaSections";
import { Marquee } from "@/components/sections/Marquee";
import { Safeguards } from "@/components/sections/Safeguards";
import { WaitlistForm } from "@/components/sections/WaitlistForm";
import { Footer } from "@/components/sections/Footer";

export function generateStaticParams() {
  return personas.map((persona) => ({ persona }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; persona: string }>;
}): Promise<Metadata> {
  const { locale, persona } = await params;
  if (!isLocale(locale) || !isPersona(persona)) return {};

  const d = getDictionary(locale);
  const copy = d.personas[persona];

  return {
    title: `${copy.headline} — Terrifit`,
    description: copy.sub,
    openGraph: { title: copy.headline, description: copy.sub, siteName: "Terrifit" },
  };
}

/** Persona applications map one-to-one onto waitlist roles. */
const PERSONA_ROLE: Record<Persona, Role> = {
  creator: "creator",
  coach: "coach",
  nutritionist: "nutritionist",
  brand: "brand",
};

export default async function PersonaPage({
  params,
}: {
  params: Promise<{ locale: string; persona: string }>;
}) {
  const { locale, persona } = await params;
  if (!isLocale(locale) || !isPersona(persona)) notFound();

  const d = getDictionary(locale);
  const copy = d.personas[persona];
  const markets = getMarkets(locale);

  // Sibling sites are resolved from the live host, so the same code serves
  // localhost, previews and production without configuration.
  const host = (await headers()).get("host") ?? "";
  const links: SiteLink[] = [
    { key: "main" as const, label: d.personaCommon.sites.main, target: "main" as const },
    ...personas.map((key) => ({
      key,
      label: d.personaCommon.sites[key],
      target: key,
    })),
  ].map((link) => ({
    key: link.key,
    label: link.label,
    href: siteUrl(host, link.target, locale),
    active: link.key === persona,
  }));

  const earnsOnPlatform = persona !== "brand";

  return (
    <>
      <a
        href="#apply"
        className="sr-only focus:not-sr-only focus:absolute focus:start-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-accent focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-accent-fg"
      >
        {d.nav.skipToContent}
      </a>

      <PersonaNav d={d} locale={locale} persona={persona} links={links} />

      <main>
        <PersonaHero d={d} copy={copy} persona={persona} />
        <Marquee d={d} />
        <PersonaPoints copy={copy} />
        {earnsOnPlatform ? <PersonaEconomics d={d} /> : <BrandResponsibilities d={d} />}
        <PersonaSteps d={d} copy={copy} />
        {earnsOnPlatform ? <PersonaFounding d={d} persona={persona} /> : null}
        <Safeguards d={d} />
        <WaitlistForm
          d={d}
          locale={locale}
          markets={markets}
          lockedRole={PERSONA_ROLE[persona]}
          anchorId="apply"
          heading={{
            eyebrow: copy.eyebrow,
            headline: d.personaCommon.applyCta,
            body: copy.sub,
          }}
        />
      </main>

      <Footer d={d} locale={locale} />
    </>
  );
}
