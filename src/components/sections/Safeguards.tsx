import type { Dictionary } from "@/i18n";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";

export function Safeguards({ d }: { d: Dictionary }) {
  return (
    <section id="safeguards" className="scroll-mt-20 py-24">
      <Container>
        <SectionHeading
          eyebrow={d.safeguards.eyebrow}
          headline={d.safeguards.headline}
          body={d.safeguards.body}
        />

        <ul className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
          {d.safeguards.items.map((item, index) => (
            <Reveal
              as="li"
              key={item.title}
              delay={(index % 4) * 60}
              className="glow-card bg-surface p-6"
            >
              <p className="text-[0.88rem] font-semibold text-fg">{item.title}</p>
              <p className="mt-2 text-[0.8rem] leading-relaxed text-fg-2">{item.body}</p>
            </Reveal>
          ))}
        </ul>
      </Container>
    </section>
  );
}
