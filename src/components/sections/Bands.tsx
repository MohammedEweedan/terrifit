import fs from "node:fs";
import path from "node:path";
import Image, { type StaticImageData } from "next/image";
import type { Dictionary } from "@/i18n";
import type { Locale } from "@/i18n/config";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { CtaLink } from "@/components/ui/CtaLink";
import { Sparkline } from "@/components/mock/parts";
import { cn } from "@/lib/cn";

import heroAthlete from "../../../public/media/hero-athlete.jpg";
import heroFemale from "../../../public/media/hero-female.jpg";
import wearable from "../../../public/media/wearable.jpg";
import community from "../../../public/media/community.jpg";
import trainingSled from "../../../public/media/training-sled.jpg";

/** Localised single-letter weekday labels, week starting Monday. */
function weekdayInitials(locale: Locale): string[] {
  const formatter = new Intl.DateTimeFormat(locale, { weekday: "narrow" });
  return Array.from({ length: 7 }, (_, index) =>
    formatter.format(new Date(Date.UTC(2024, 0, 1 + index))),
  );
}

/**
 * Hero background.
 *
 * If a video is present at public/media/hero.mp4 it is used, with the still as
 * its poster; otherwise the still carries the hero with a slow push-in. That
 * means dropping a file into public/media is all it takes to switch the hero
 * to motion — no code change, and no broken <video> when the file is absent.
 */
function HeroMedia() {
  const videoPath = path.join(process.cwd(), "public", "media", "hero.mp4");
  const hasVideo = fs.existsSync(videoPath);

  if (hasVideo) {
    return (
      <>
        <video
          autoPlay
          muted
          loop
          playsInline
          poster={heroAthlete.src}
          className="absolute inset-0 -z-20 size-full object-cover object-[72%_center]"
        >
          <source src="/media/hero.mp4" type="video/mp4" />
        </video>
      </>
    );
  }

  return (
    <div className="absolute inset-0 -z-20 overflow-hidden">
      <Image
        src={heroFemale}
        alt=""
        preload
        placeholder="blur"
        sizes="100vw"
        className="ken-burns size-full object-cover object-[68%_center]"
      />
    </div>
  );
}

export function PhotoHero({ d }: { d: Dictionary }) {
  const metrics = [
    { label: "Recovery", value: "82%", note: "Good to go." },
    { label: "Strain", value: "6.4", note: "Moderate" },
    { label: "Sleep", value: "7h 32m", note: "Good" },
    { label: "Map progress", value: "33%", note: "Week 4 of 12" },
  ];

  return (
    <section id="top" className="relative isolate flex min-h-[100svh] items-center overflow-hidden bg-black">
      <HeroMedia />
      {/* Scrim, not a flat overlay: the headline side goes near-black while the
          subject stays legible. */}
      <div className="scrim-full absolute inset-0 -z-10" />

      <Container className="relative flex min-h-[100svh] flex-col justify-center pb-40 pt-28 sm:pb-44">
        <div className="max-w-xl">
          <Reveal delay={30}>
            <p className="eyebrow text-white/55">{d.hero.eyebrow}</p>
          </Reveal>
          <Reveal delay={70}>
            <h1 className="display-xl mt-5 max-w-[9ch] text-white">{d.hero.headline}</h1>
          </Reveal>

          <Reveal delay={130}>
            <p className="mt-7 max-w-[430px] text-[0.96rem] leading-relaxed text-white/72 sm:text-[1.02rem]">
              {d.hero.sub}
            </p>
          </Reveal>

          <Reveal delay={190}>
            <div className="mt-8 flex flex-wrap gap-3">
              <CtaLink href="#waitlist" location="hero_primary" variant="primary" className="rounded-none px-6 py-3 uppercase tracking-[0.06em]">
                {d.hero.primaryCta}
              </CtaLink>
              <a
                href="#platform"
                className="inline-flex min-h-11 items-center gap-3 px-5 py-2.5 text-[0.76rem] font-semibold uppercase tracking-[0.06em] text-white transition-colors hover:bg-white/10"
              >
                {d.hero.secondaryCta}
                <span className="flip-rtl" aria-hidden="true">
                  →
                </span>
              </a>
            </div>
          </Reveal>
        </div>

        <div className="absolute inset-x-5 bottom-5 overflow-hidden rounded-xl border border-white/15 bg-black/68 backdrop-blur-md sm:inset-x-8 lg:inset-x-auto lg:end-8 lg:w-[650px]">
          <dl className="grid grid-cols-2 sm:grid-cols-4">
            {metrics.map((metric) => (
              <div key={metric.label} className="border-white/12 px-4 py-4 even:border-s sm:border-s sm:first:border-s-0">
                <dt className="text-[0.58rem] font-semibold uppercase tracking-[0.1em] text-white/48">{metric.label}</dt>
                <dd className="numeric mt-2 text-[1.6rem] font-semibold leading-none text-white">{metric.value}</dd>
                <dd className="mt-2 text-[0.62rem] text-white/52">{metric.note}</dd>
              </div>
            ))}
          </dl>
        </div>
      </Container>
    </section>
  );
}

/** Dark band: statement on the left, oversized figures on the right. */
export function StatBand({ d }: { d: Dictionary }) {
  return (
    <section className="band noise border-y border-border bg-bg-elev py-14">
      <Container>
        <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
          <Reveal>
            <p className="text-[0.85rem] text-fg-3">{d.statement.lead}</p>
            <p className="rule-accent mt-2 text-[clamp(1.3rem,2.4vw,1.75rem)] font-semibold leading-snug text-fg">
              {d.statement.emphasis}
            </p>
          </Reveal>

          <Reveal delay={90}>
            <ul className="grid grid-cols-2 gap-y-8 sm:grid-cols-4">
              {d.trustBar.items.map((item, index) => (
                <li
                  key={item.label}
                  className={cn(
                    "px-5 first:ps-0",
                    index > 0 && "sm:border-s sm:border-border-strong",
                  )}
                >
                  <p className="numeric text-[clamp(1.7rem,3vw,2.3rem)] font-semibold leading-none text-accent">
                    {item.value}
                  </p>
                  <p className="mt-2.5 text-[0.74rem] leading-snug text-fg-3">
                    {item.label}
                  </p>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}

/**
 * Paper band with a full-bleed photograph on one side. `flip` puts the image
 * on the start side; the grid order is set with explicit column placement so
 * it mirrors correctly under RTL.
 */
function PhotoSplit({
  image,
  alt,
  flip = false,
  children,
}: {
  image: StaticImageData;
  alt: string;
  flip?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className="paper band noise">
      <div className="grid lg:grid-cols-2">
        <div
          className={cn(
            "relative min-h-[320px] lg:min-h-[540px]",
            flip ? "lg:order-1" : "lg:order-2",
          )}
        >
          <Image
            src={image}
            alt={alt}
            placeholder="blur"
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="absolute inset-0 size-full object-cover"
          />
        </div>
        <div
          className={cn(
            "flex items-center px-6 py-16 sm:px-12 lg:py-24",
            flip ? "lg:order-2" : "lg:order-1",
          )}
        >
          <div className="mx-auto w-full max-w-lg">{children}</div>
        </div>
      </div>
    </section>
  );
}

export function MapsBand({ d }: { d: Dictionary }) {
  return (
    <PhotoSplit image={trainingSled} alt="" flip={false}>
      <Reveal>
        <p className="eyebrow text-accent">{d.mapAnatomy.eyebrow}</p>
        <h2 className="rule-accent mt-4 text-[clamp(1.9rem,3.6vw,2.7rem)] font-semibold leading-tight text-fg">
          {d.mapAnatomy.headline}
        </h2>
        <p className="mt-6 text-[0.95rem] leading-relaxed text-fg-2">{d.mapAnatomy.body}</p>
        <div className="mt-8">
          <CtaLink href="#map" location="maps_band" variant="primary">
            {d.nav.theMap}
          </CtaLink>
        </div>
      </Reveal>
    </PhotoSplit>
  );
}

export function HealthBand({ d, locale }: { d: Dictionary; locale: Locale }) {
  const days = weekdayInitials(locale);
  // Recovery trend across the week; the final day is the current reading.
  const recovery = [54, 61, 58, 72, 66, 79, 92];

  return (
    <PhotoSplit image={wearable} alt="" flip>
      <Reveal>
        <p className="eyebrow text-accent">{d.progress.eyebrow}</p>
        <h2 className="rule-accent mt-4 text-[clamp(1.9rem,3.6vw,2.7rem)] font-semibold leading-tight text-fg">
          {d.progress.headline}
        </h2>
        <p className="mt-6 text-[0.95rem] leading-relaxed text-fg-2">{d.progress.body}</p>

        {/* Recovery bars — the last column is today, in the accent. */}
        <div className="mt-9 flex items-end gap-6">
          <div className="shrink-0">
            <p className="text-[0.65rem] uppercase tracking-wider text-fg-3">
              {d.mock.ringRecovery}
            </p>
            <p className="numeric mt-1 text-[2.4rem] font-semibold leading-none text-fg">
              92<span className="text-[1.2rem] text-fg-3">%</span>
            </p>
          </div>
          <div className="flex flex-1 items-end justify-between gap-1.5" aria-hidden="true">
            {recovery.map((value, index) => (
              <div key={index} className="flex flex-1 flex-col items-center gap-2">
                <div
                  className={cn(
                    "w-full rounded-sm",
                    index === recovery.length - 1 ? "bg-accent" : "bg-surface-2",
                  )}
                  style={{ height: `${Math.round(value * 0.62)}px` }}
                />
                <span className="text-[0.6rem] text-fg-3">{days[index]}</span>
              </div>
            ))}
          </div>
        </div>

        <ul className="mt-9 flex flex-wrap gap-2">
          {d.progress.integrations.map((integration) => (
            <li
              key={integration}
              className="rounded-full border border-border bg-surface px-3 py-1.5 text-[0.74rem] text-fg-2"
            >
              {integration}
            </li>
          ))}
        </ul>

        <p className="mt-7 border-t border-border pt-5 text-[0.75rem] leading-relaxed text-fg-3">
          {d.progress.disclaimerBody}
        </p>
      </Reveal>
    </PhotoSplit>
  );
}

/** Full-bleed photograph with a single line of type over it. */
export function CommunityBand({ d }: { d: Dictionary }) {
  return (
    <section className="relative isolate flex min-h-[380px] items-center overflow-hidden lg:min-h-[460px]">
      <Image
        src={community}
        alt=""
        placeholder="blur"
        sizes="100vw"
        className="absolute inset-0 -z-20 size-full object-cover object-center"
      />
      <div className="scrim-center absolute inset-0 -z-10" />
      <Container>
        <Reveal className="mx-auto max-w-3xl text-center">
          <h2 className="rule-accent rule-accent-center text-[clamp(1.9rem,4.4vw,3.1rem)] font-semibold leading-tight text-white">
            {d.community.headline}
          </h2>
          <p className="mt-7 text-[0.95rem] leading-relaxed text-white/75">{d.community.body}</p>
        </Reveal>
      </Container>
    </section>
  );
}

/** Earnings card used in the creators band, mirroring the reference layout. */
export function EarningsCard({ d }: { d: Dictionary }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-6">
      <p className="text-[0.65rem] uppercase tracking-wider text-fg-3">{d.mock.revenue}</p>
      <p className="numeric mt-2 text-[2.2rem] font-semibold leading-none text-fg">
        {d.mock.revenueValue}
      </p>
      <Sparkline
        points={[4, 6, 5.4, 8, 7.2, 11, 10.4, 14]}
        className="mt-6 h-16"
        color="var(--accent)"
      />
      <p className="mt-4 text-[0.75rem] text-fg-3">
        <span className="numeric font-semibold text-accent">{d.mock.revenueDelta}</span>{" "}
        {d.mock.vsLastMonth}
      </p>
    </div>
  );
}
