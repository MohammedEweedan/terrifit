import type { Dictionary } from "@/i18n";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";

export function HowItWorks({ d }: { d: Dictionary }) {
  return (
    <section className="band noise bg-bg py-24">
      <Container>
        <SectionHeading
          eyebrow={d.howItWorks.eyebrow}
          headline={d.howItWorks.headline}
          body={d.howItWorks.body}
        />

        <ol className="relative mt-14 grid gap-8 md:grid-cols-4 md:gap-5">
          {/* Rail behind the step markers, drawn only on the horizontal layout. */}
          <span
            className="absolute inset-x-0 top-[18px] hidden h-px bg-gradient-to-r from-transparent via-border-strong to-transparent md:block"
            aria-hidden="true"
          />
          {d.howItWorks.steps.map((step, index) => (
            <Reveal as="li" key={step.title} delay={index * 110} className="relative">
              <span
                className="numeric relative z-10 grid size-9 place-items-center rounded-full border border-accent-line bg-bg text-[0.8rem] font-semibold text-accent"
                aria-hidden="true"
              >
                {index + 1}
              </span>
              <p className="mt-5 text-[1rem] font-semibold leading-snug text-fg">{step.title}</p>
              <p className="mt-2.5 text-[0.85rem] leading-relaxed text-fg-2">{step.body}</p>
            </Reveal>
          ))}
        </ol>
      </Container>
    </section>
  );
}
