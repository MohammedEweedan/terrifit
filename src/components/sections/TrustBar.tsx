import type { Dictionary } from "@/i18n";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";

export function TrustBar({ d }: { d: Dictionary }) {
  return (
    <section className="band noise border-b border-border bg-bg py-16">
      <Container>
        <ul className="grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-4">
          {d.trustBar.items.map((item, index) => (
            <Reveal as="li" key={item.label} delay={index * 70}>
              <p className="numeric text-[clamp(1.9rem,3.6vw,2.6rem)] font-semibold text-accent">
                {item.value}
              </p>
              <div className="hairline my-3.5" />
              <p className="text-[0.8rem] leading-snug text-fg-2">{item.label}</p>
            </Reveal>
          ))}
        </ul>
      </Container>
    </section>
  );
}
