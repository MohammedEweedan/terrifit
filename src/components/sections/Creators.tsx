import type { Dictionary } from "@/i18n";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { CtaLink } from "@/components/ui/CtaLink";
import { EarningsCard } from "./Bands";

export function Creators({ d }: { d: Dictionary }) {
  return (
    <section id="creators" className="paper band noise scroll-mt-20 scroll-mt-20 py-24">
      <Container>
        <SectionHeading
          eyebrow={d.creators.eyebrow}
          headline={d.creators.headline}
          body={d.creators.body}
        />

        <div className="mt-12 grid gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
          <Reveal>
            <div className="h-full rounded-2xl border border-border bg-surface p-6 shadow-[var(--shadow-card)]">
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
                        <span className="mt-0.5 block text-[0.68rem] text-fg-3">
                          {row.platform}
                        </span>
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

          <Reveal delay={80} className="flex h-full flex-col gap-6">
            <EarningsCard d={d} />
            <div className="h-full rounded-2xl border border-border bg-surface p-6 shadow-[var(--shadow-card)]">
              <p className="eyebrow text-fg-3">{d.creators.toolsTitle}</p>
              <ul className="mt-5 space-y-3.5">
                {d.creators.tools.map((tool) => (
                  <li key={tool} className="flex items-start gap-3 text-[0.85rem] text-fg-2">
                    <span
                      className="mt-[7px] size-1.5 shrink-0 rounded-full bg-accent"
                      aria-hidden="true"
                    />
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

        <Reveal delay={80}>
          <div className="mt-6 rounded-2xl border border-border bg-surface p-6">
            <p className="eyebrow text-accent">{d.creators.foundingTitle}</p>
            <ul className="mt-5 grid gap-x-8 gap-y-3.5 sm:grid-cols-2">
              {d.creators.founding.map((benefit) => (
                <li key={benefit} className="flex items-start gap-3 text-[0.85rem] text-fg-2">
                  <span className="mt-px shrink-0 text-accent" aria-hidden="true">
                    ✓
                  </span>
                  {benefit}
                </li>
              ))}
            </ul>
            <div className="mt-7">
              <CtaLink href="#waitlist" location="creators_section" role="creator">
                {d.creators.cta}
              </CtaLink>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
