import type { Dictionary } from "@/i18n";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { CountUp } from "@/components/ui/CountUp";
import { CtaLink } from "@/components/ui/CtaLink";
import type { WaitlistStats } from "@/lib/stats";

export function FinalCta({ d, stats }: { d: Dictionary; stats: WaitlistStats }) {
  const figures = [
    { value: stats.total, label: d.hero.liveLabel },
    { value: stats.markets, label: d.hero.countriesLabel },
    { value: stats.foundingLeft, label: d.hero.creatorLabel },
  ];

  return (
    <section className="band noise border-t border-border bg-bg py-28">
      <div className="bloom start-1/2 top-0 size-[560px] -translate-x-1/2 -translate-y-1/2" />
      <Container>
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="eyebrow text-accent">{d.finalCta.eyebrow}</p>
          <h2 className="display-xl mt-5 text-fg">{d.finalCta.headline}</h2>
          <p className="mx-auto mt-6 max-w-lg text-[1rem] leading-relaxed text-fg-2">
            {d.finalCta.sub}
          </p>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <CtaLink href="#waitlist" location="final_primary" variant="primary">
              {d.finalCta.primary}
            </CtaLink>
            <CtaLink href="#waitlist" location="final_creator" variant="secondary" role="creator">
              {d.finalCta.secondary}
            </CtaLink>
          </div>
          <p className="mt-5 text-[0.78rem] text-fg-3">{d.finalCta.note}</p>
        </Reveal>

        {/* Live counters: the scarcity claim above has to be backed by a number. */}
        <Reveal delay={120}>
          <dl className="mx-auto mt-16 grid max-w-3xl grid-cols-1 gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-3">
            {figures.map((figure) => (
              <div key={figure.label} className="bg-surface px-6 py-7 text-center">
                <dt className="sr-only">{figure.label}</dt>
                <dd>
                  <span className="numeric block text-[2.1rem] font-semibold text-fg">
                    <CountUp value={figure.value} />
                  </span>
                  <span className="mt-1.5 block text-[0.72rem] leading-snug text-fg-3">
                    {figure.label}
                  </span>
                </dd>
              </div>
            ))}
          </dl>
        </Reveal>
      </Container>
    </section>
  );
}
