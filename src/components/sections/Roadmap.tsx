import type { Dictionary } from "@/i18n";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";

export function Roadmap({ d }: { d: Dictionary }) {
  return (
    <section className="paper band noise py-24">
      <Container>
        <SectionHeading
          eyebrow={d.roadmap.eyebrow}
          headline={d.roadmap.headline}
          body={d.roadmap.body}
        />

        <div className="mt-14 grid gap-5 md:grid-cols-3">
          {d.roadmap.phases.map((phase, index) => (
            <Reveal
              key={phase.label}
              delay={index * 100}
              className="glow-card rounded-2xl border border-border bg-surface p-6"
            >
              <div className="flex items-baseline justify-between gap-3">
                <p className="eyebrow text-accent">{phase.label}</p>
                {index === 0 ? (
                  <span className="rounded-full border border-accent-line bg-accent-soft px-2.5 py-0.5 text-[0.65rem] font-medium text-accent">
                    MVP
                  </span>
                ) : null}
              </div>
              <p className="mt-3 text-[1.05rem] font-semibold text-fg">{phase.title}</p>
              <ul className="mt-5 space-y-2.5">
                {phase.items.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-[0.83rem] text-fg-2">
                    <span
                      className="mt-[7px] size-1.5 shrink-0 rounded-full bg-accent"
                      aria-hidden="true"
                    />
                    {item}
                  </li>
                ))}
              </ul>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
