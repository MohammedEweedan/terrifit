import type { Dictionary } from "@/i18n";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { CountUp } from "@/components/ui/CountUp";
import { Ring } from "@/components/ui/Ring";
import { PhoneFrame } from "@/components/mock/parts";
import { FeedScreen } from "@/components/mock/screens";
import { CtaLink } from "@/components/ui/CtaLink";

export function Hero({
  d,
  stats,
}: {
  d: Dictionary;
  stats: { total: number; markets: number; foundingLeft: number };
}) {
  const figures = [
    { value: stats.total, label: d.hero.liveLabel },
    { value: stats.markets, label: d.hero.countriesLabel },
    { value: stats.foundingLeft, label: d.hero.creatorLabel },
  ];

  return (
    <section id="top" className="band noise relative pb-20 pt-12 sm:pt-20">
      <div className="grid-lines pointer-events-none absolute inset-0 -z-10" />
      <div className="bloom start-1/2 top-[-140px] size-[720px] -translate-x-1/2" />
      <div className="bloom start-[8%] top-[38%] hidden size-[320px] opacity-30 lg:block" />
      <div className="bloom end-[6%] top-[52%] hidden size-[280px] opacity-25 lg:block" />

      <Container>
        <div className="mx-auto max-w-3xl text-center">

          <Reveal delay={190}>
            <div className="mt-9 flex flex-wrap justify-center gap-3">
              <CtaLink href="#waitlist" location="hero_primary" variant="primary">
                {d.hero.primaryCta}
              </CtaLink>
              <CtaLink href="#waitlist" location="hero_creator" variant="secondary" role="creator">
                {d.hero.secondaryCta}
              </CtaLink>
            </div>
            <p className="mt-4 text-[0.78rem] text-fg-3">{d.hero.reassurance}</p>
          </Reveal>
        </div>

        {/* The device sits between two floating data cards so the hero reads as
            a product surface rather than a marketing illustration. */}
        <Reveal delay={220}>
          <div className="relative mt-16 flex justify-center">
            <FloatingCard className="start-[16%] top-16 hidden xl:flex">
              <Ring value={91} size={44} stroke={4} color="var(--good)" label="91%">
                <span className="numeric text-[0.7rem] font-semibold text-fg">91</span>
              </Ring>
              <div>
                <p className="text-[0.62rem] text-fg-3">{d.mock.ringAdherence}</p>
                <p className="numeric text-[0.9rem] font-semibold text-fg">91%</p>
              </div>
            </FloatingCard>

            <FloatingCard className="end-[16%] top-52 hidden xl:flex">
              <span
                className="grid size-9 place-items-center rounded-full bg-warn/15 text-warn"
                aria-hidden="true"
              >
                ●
              </span>
              <div>
                <p className="text-[0.62rem] text-fg-3">{d.mock.checkInDue}</p>
                <p className="text-[0.82rem] font-semibold text-warn">{d.mock.checkInDueValue}</p>
              </div>
            </FloatingCard>

            <div className="relative">
              <div className="bloom start-1/2 top-1/2 size-[420px] -translate-x-1/2 -translate-y-1/2 opacity-40" />
              <PhoneFrame>
                <FeedScreen m={d.mock} />
              </PhoneFrame>
            </div>
          </div>
        </Reveal>

        <Reveal delay={260}>
          <dl className="mx-auto mt-20 grid max-w-3xl grid-cols-1 gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-3">
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

function FloatingCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`absolute z-10 items-center gap-3 rounded-2xl border border-border bg-surface/85 px-4 py-3 shadow-[var(--shadow-card)] backdrop-blur-xl ${className}`}
    >
      {children}
    </div>
  );
}
