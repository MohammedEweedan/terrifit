import type { Dictionary } from "@/i18n";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";

export function CommunitySection({ d }: { d: Dictionary }) {
  return (
    <section className="py-24">
      <Container>
        <SectionHeading
          eyebrow={d.community.eyebrow}
          headline={d.community.headline}
          body={d.community.body}
        />

        <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {d.community.items.map((item, index) => (
            <Reveal
              as="li"
              key={item.title}
              delay={index * 70}
              className="glow-card rounded-2xl border border-border bg-surface p-6"
            >
              <p className="text-[0.95rem] font-semibold text-fg">{item.title}</p>
              <p className="mt-2 text-[0.82rem] leading-relaxed text-fg-2">{item.body}</p>
            </Reveal>
          ))}
        </ul>

        <Reveal delay={120}>
          <p className="mt-6 text-[0.78rem] text-fg-3">{d.community.phaseNote}</p>
        </Reveal>
      </Container>
    </section>
  );
}
