import type { Dictionary } from "@/i18n";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";

/** Full-bleed typographic band that breaks up the card-heavy sections. */
export function Statement({ d }: { d: Dictionary }) {
  return (
    <section className="band noise bg-bg py-28 sm:py-36">
      <div className="bloom start-1/2 top-1/2 size-[520px] -translate-x-1/2 -translate-y-1/2" />
      <Container>
        <Reveal className="mx-auto max-w-4xl text-center">
          <p className="display-lg text-fg-3">{d.statement.lead}</p>
          <p className="display-lg mt-3 text-fg">
            {d.statement.emphasis}
          </p>
        </Reveal>
      </Container>
    </section>
  );
}
