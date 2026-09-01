import { headers } from "next/headers";
import type { Dictionary } from "@/i18n";
import { personas, type Locale } from "@/i18n/config";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { siteUrl } from "@/lib/site";

/**
 * Entry points to the five sides of the marketplace. Each professional
 * audience has its own subdomain, resolved from the live host so this works
 * on localhost, previews and production alike.
 */
export async function Audiences({ d, locale }: { d: Dictionary; locale: Locale }) {
  const host = (await headers()).get("host") ?? "";

  const cards = [
    {
      key: "main" as const,
      title: d.personaCommon.sites.main,
      body: d.audiences.athleteBody,
      href: siteUrl(host, "main", locale),
      primary: true,
    },
    ...personas.map((persona) => ({
      key: persona,
      title: d.personaCommon.sites[persona],
      body: d.personas[persona].sub,
      href: siteUrl(host, persona, locale),
      primary: false,
    })),
  ];

  return (
    <section className="band noise bg-bg py-24">
      <Container>
        <SectionHeading
          eyebrow={d.audiences.eyebrow}
          headline={d.audiences.headline}
          body={d.audiences.body}
        />

        <ul className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((card, index) => (
            <Reveal
              as="li"
              key={card.key}
              delay={(index % 3) * 80}
              className={card.primary ? "lg:col-span-1" : undefined}
            >
              <a
                href={card.href}
                className="glow-card flex h-full flex-col rounded-2xl border border-border bg-surface p-6"
              >
                <p className="text-[1.05rem] font-semibold text-fg">{card.title}</p>
                <p className="mt-2.5 flex-1 text-[0.85rem] leading-relaxed text-fg-2">
                  {card.body}
                </p>
                <span className="mt-6 inline-flex items-center gap-1.5 text-[0.78rem] font-semibold text-accent">
                  {card.primary ? d.nav.join : d.audiences.visit}
                  <span className="flip-rtl" aria-hidden="true">
                    →
                  </span>
                </span>
              </a>
            </Reveal>
          ))}
        </ul>
      </Container>
    </section>
  );
}
