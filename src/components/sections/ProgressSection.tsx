import type { Dictionary } from "@/i18n";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { PhoneFrame } from "@/components/mock/parts";
import { ProgressScreen } from "@/components/mock/screens";

export function ProgressSection({ d }: { d: Dictionary }) {
  return (
    <section className="border-y border-border bg-bg-elev py-24">
      <Container className="grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_auto]">
        <div>
          <SectionHeading
            eyebrow={d.progress.eyebrow}
            headline={d.progress.headline}
            body={d.progress.body}
          />

          <Reveal delay={80}>
            <div className="mt-9">
              <p className="eyebrow text-fg-3">{d.progress.metricsTitle}</p>
              <ul className="mt-4 grid gap-x-8 gap-y-2.5 sm:grid-cols-2">
                {d.progress.metrics.map((metric) => (
                  <li key={metric} className="flex items-start gap-2.5 text-[0.85rem] text-fg-2">
                    <span
                      className="mt-[7px] size-1.5 shrink-0 rounded-full bg-accent"
                      aria-hidden="true"
                    />
                    {metric}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>

          <Reveal delay={120}>
            <div className="mt-8">
              <p className="eyebrow text-fg-3">{d.progress.integrationsTitle}</p>
              <ul className="mt-3 flex flex-wrap gap-2">
                {d.progress.integrations.map((integration) => (
                  <li
                    key={integration}
                    className="rounded-full border border-border bg-surface px-3 py-1.5 text-[0.75rem] text-fg-2"
                  >
                    {integration}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>

          <Reveal delay={160}>
            <div className="mt-8 rounded-2xl border border-border bg-surface p-5">
              <p className="text-[0.85rem] font-semibold text-fg">
                {d.progress.disclaimerTitle}
              </p>
              <p className="mt-2 text-[0.8rem] leading-relaxed text-fg-2">
                {d.progress.disclaimerBody}
              </p>
            </div>
          </Reveal>
        </div>

        <Reveal delay={140} className="mx-auto lg:mx-0">
          <PhoneFrame>
            <ProgressScreen m={d.mock} />
          </PhoneFrame>
        </Reveal>
      </Container>
    </section>
  );
}
