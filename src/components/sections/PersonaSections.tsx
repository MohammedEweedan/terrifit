import type { Dictionary } from "@/i18n";
import type { Persona } from "@/i18n/config";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { CtaLink } from "@/components/ui/CtaLink";
import { PhoneFrame } from "@/components/mock/parts";
import {
  CheckInScreen,
  DashboardScreen,
  MapScreen,
  ProgressScreen,
} from "@/components/mock/screens";

type PersonaCopy = Dictionary["personas"][Persona];

/** The screen that best represents what each persona actually does all day. */
function personaScreen(persona: Persona, d: Dictionary) {
  switch (persona) {
    case "coach":
    case "creator":
      return <DashboardScreen m={d.mock} />;
    case "nutritionist":
      return <CheckInScreen m={d.mock} d={d} />;
    case "brand":
      return <MapScreen m={d.mock} d={d} />;
    default:
      return <ProgressScreen m={d.mock} />;
  }
}

export function PersonaHero({
  d,
  copy,
  persona,
}: {
  d: Dictionary;
  copy: PersonaCopy;
  persona: Persona;
}) {
  return (
    <section id="top" className="band noise pb-20 pt-12 sm:pt-20">
      <div className="grid-lines pointer-events-none absolute inset-0 -z-10" />
      <div className="bloom start-[30%] top-[-160px] size-[620px]" />

      <Container className="grid items-center gap-14 lg:grid-cols-[minmax(0,1fr)_auto]">
        <div className="max-w-xl">
          <Reveal>
            <p className="inline-flex items-center gap-2 rounded-full border border-accent-line bg-accent-soft px-3.5 py-1.5">
              <span className="eyebrow text-accent">{copy.eyebrow}</span>
            </p>
          </Reveal>

          <Reveal delay={70}>
            <h1 className="display-xl mt-7 text-fg">{copy.headline}</h1>
          </Reveal>

          <Reveal delay={130}>
            <p className="mt-7 max-w-lg text-[1.02rem] leading-relaxed text-fg-2">{copy.sub}</p>
          </Reveal>

          <Reveal delay={190}>
            <div className="mt-9 flex flex-wrap gap-3">
              <CtaLink href="#apply" location={`persona_hero_${persona}`} variant="primary">
                {d.personaCommon.applyCta}
              </CtaLink>
            </div>
          </Reveal>
        </div>

        <Reveal delay={220} className="mx-auto lg:mx-0">
          <div className="relative">
            <div className="bloom start-1/2 top-1/2 size-[380px] -translate-x-1/2 -translate-y-1/2 opacity-40" />
            <PhoneFrame>{personaScreen(persona, d)}</PhoneFrame>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}

export function PersonaPoints({ copy }: { copy: PersonaCopy }) {
  return (
    <section className="border-y border-border bg-bg-elev py-20">
      <Container>
        <ul className="grid gap-5 md:grid-cols-3">
          {copy.points.map((point, index) => (
            <Reveal
              as="li"
              key={point.title}
              delay={index * 80}
              className="glow-card rounded-2xl border border-border bg-surface p-6"
            >
              <span className="numeric block text-[0.72rem] font-semibold text-accent">
                {String(index + 1).padStart(2, "0")}
              </span>
              <p className="mt-4 text-[1.05rem] font-semibold text-fg">{point.title}</p>
              <p className="mt-2.5 text-[0.85rem] leading-relaxed text-fg-2">{point.body}</p>
            </Reveal>
          ))}
        </ul>
      </Container>
    </section>
  );
}

export function PersonaSteps({ d, copy }: { d: Dictionary; copy: PersonaCopy }) {
  return (
    <section className="py-24">
      <Container>
        <SectionHeading eyebrow={d.personaCommon.stepsTitle} headline={d.personaCommon.stepsTitle} />

        <ol className="mt-12 grid gap-5 md:grid-cols-3">
          {copy.steps.map((step, index) => (
            <Reveal
              as="li"
              key={step.title}
              delay={index * 80}
              className="relative rounded-2xl border border-border bg-surface p-6"
            >
              <span
                className="numeric grid size-9 place-items-center rounded-full bg-accent-soft text-[0.8rem] font-semibold text-accent"
                aria-hidden="true"
              >
                {index + 1}
              </span>
              <p className="mt-4 text-[1rem] font-semibold text-fg">{step.title}</p>
              <p className="mt-2 text-[0.85rem] leading-relaxed text-fg-2">{step.body}</p>
            </Reveal>
          ))}
        </ol>
      </Container>
    </section>
  );
}

/** Commission table, shown to the personas who earn on the platform. */
export function PersonaEconomics({ d }: { d: Dictionary }) {
  return (
    <section className="border-y border-border bg-bg-elev py-24">
      <Container>
        <SectionHeading
          eyebrow={d.personaCommon.whatYouKeep}
          headline={d.creators.headline}
          body={d.creators.body}
        />

        <div className="mt-12 grid gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
          <Reveal>
            <div className="glow-card h-full rounded-2xl border border-border bg-surface p-6">
              <p className="eyebrow text-fg-3">{d.creators.economicsTitle}</p>
              <table className="mt-5 w-full border-collapse">
                <tbody>
                  {d.creators.economics.map((row) => (
                    <tr key={row.item} className="border-b border-border last:border-0">
                      <th
                        scope="row"
                        className="py-3.5 pe-3 text-start text-[0.85rem] font-normal text-fg-2"
                      >
                        {row.item}
                      </th>
                      <td className="py-3.5 text-end">
                        <span className="numeric block text-[1.05rem] font-semibold text-fg">
                          {row.you}
                        </span>
                        <span className="mt-0.5 block text-[0.68rem] text-fg-3">{row.platform}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="mt-5 border-t border-border pt-4 text-[0.72rem] leading-relaxed text-fg-3">
                {d.creators.economicsFootnote}
              </p>
            </div>
          </Reveal>

          <Reveal delay={80}>
            <div className="glow-card h-full rounded-2xl border border-border bg-surface p-6">
              <p className="eyebrow text-fg-3">{d.creators.toolsTitle}</p>
              <ul className="mt-5 space-y-3.5">
                {d.creators.tools.map((tool) => (
                  <li key={tool} className="flex items-start gap-3 text-[0.85rem] text-fg-2">
                    <span className="mt-[7px] size-1.5 shrink-0 rounded-full bg-accent" aria-hidden="true" />
                    {tool}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>

        <Reveal delay={60}>
          <div className="mt-6 rounded-2xl border border-accent-line bg-accent-soft p-6">
            <p className="text-[0.9rem] font-semibold text-fg">{d.creators.obligationTitle}</p>
            <p className="mt-2 max-w-3xl text-[0.85rem] leading-relaxed text-fg-2">
              {d.creators.obligationBody}
            </p>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}

export function PersonaFounding({ d, persona }: { d: Dictionary; persona: Persona }) {
  return (
    <section className="py-24">
      <Container>
        <Reveal>
          <div className="rounded-2xl border border-border bg-surface p-7">
            <p className="eyebrow text-accent">{d.creators.foundingTitle}</p>
            <ul className="mt-6 grid gap-x-8 gap-y-4 sm:grid-cols-2">
              {d.creators.founding.map((benefit) => (
                <li key={benefit} className="flex items-start gap-3 text-[0.88rem] text-fg-2">
                  <span className="mt-px shrink-0 text-accent" aria-hidden="true">
                    ✓
                  </span>
                  {benefit}
                </li>
              ))}
            </ul>
            <div className="mt-8">
              <CtaLink href="#apply" location={`persona_founding_${persona}`}>
                {d.personaCommon.applyCta}
              </CtaLink>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}

/** Compliance block shown only on the brand site. */
export function BrandResponsibilities({ d }: { d: Dictionary }) {
  return (
    <section className="border-y border-border bg-bg-elev py-20">
      <Container>
        <Reveal className="rounded-2xl border border-warn/35 bg-warn/[0.06] p-7">
          <p className="flex items-center gap-2 text-[0.9rem] font-semibold text-warn">
            <span aria-hidden="true">⚠</span>
            {d.safeguards.items[7].title}
          </p>
          <p className="mt-3 max-w-3xl text-[0.86rem] leading-relaxed text-fg-2">
            {d.personas.brand.responsibilities}
          </p>
        </Reveal>
      </Container>
    </section>
  );
}
