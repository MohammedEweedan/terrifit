import type { Dictionary } from "@/i18n";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";

/**
 * Native <details> — keyboard accessible, searchable by the browser's find,
 * and works before hydration.
 */
export function Faq({ d }: { d: Dictionary }) {
  return (
    <section className="py-24">
      <Container className="max-w-3xl">
        <SectionHeading eyebrow={d.faq.eyebrow} headline={d.faq.headline} />

        <div className="mt-10 divide-y divide-border border-y border-border">
          {d.faq.items.map((item, index) => (
            <Reveal key={item.q} delay={index * 40}>
              <details className="group">
                <summary className="flex cursor-pointer list-none items-start justify-between gap-4 py-5 text-[0.95rem] font-medium text-fg [&::-webkit-details-marker]:hidden">
                  {item.q}
                  <span
                    className="mt-1 shrink-0 text-fg-3 transition-transform group-open:rotate-45"
                    aria-hidden="true"
                  >
                    +
                  </span>
                </summary>
                <p className="pb-6 pe-8 text-[0.85rem] leading-relaxed text-fg-2">{item.a}</p>
              </details>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
