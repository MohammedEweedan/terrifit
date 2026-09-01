"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Dictionary } from "@/i18n";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { PhoneFrame } from "@/components/mock/parts";
import {
  CheckInScreen,
  DashboardScreen,
  FeedScreen,
  MapScreen,
  ProgressScreen,
} from "@/components/mock/screens";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/cn";

type ScreenKey = keyof Dictionary["prototypes"]["tabs"];

const ORDER: ScreenKey[] = ["feed", "map", "checkin", "dashboard", "progress"];
const DWELL_MS = 5000;

export function Prototypes({ d }: { d: Dictionary }) {
  const [active, setActive] = useState<ScreenKey>("feed");
  // Auto-advance stops for good once the reader takes control.
  const [auto, setAuto] = useState(true);
  const [inView, setInView] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const node = sectionRef.current;
    if (!node || typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.25 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  // Only cycle while the section is on screen — an off-screen timer is wasted
  // work, and it would also desync the progress bar from what is visible.
  useEffect(() => {
    if (!auto || !inView) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const timer = window.setTimeout(() => {
      setActive((current) => ORDER[(ORDER.indexOf(current) + 1) % ORDER.length]);
    }, DWELL_MS);

    return () => window.clearTimeout(timer);
  }, [active, auto, inView]);

  const choose = useCallback((key: ScreenKey) => {
    setActive(key);
    setAuto(false);
    track("prototype_tab", { tab: key });
  }, []);

  const screens: Record<ScreenKey, React.ReactNode> = {
    feed: <FeedScreen m={d.mock} />,
    map: <MapScreen m={d.mock} d={d} />,
    checkin: <CheckInScreen m={d.mock} d={d} />,
    dashboard: <DashboardScreen m={d.mock} />,
    progress: <ProgressScreen m={d.mock} />,
  };

  return (
    <section ref={sectionRef} className="band noise border-y border-border bg-bg-elev py-24">
      <Container>
        <SectionHeading
          eyebrow={d.prototypes.eyebrow}
          headline={d.prototypes.headline}
          body={d.prototypes.body}
          align="center"
        />

        <Reveal delay={80}>
          <div
            role="tablist"
            aria-label={d.prototypes.eyebrow}
            className="mx-auto mt-10 flex max-w-full flex-wrap justify-center gap-2"
          >
            {ORDER.map((key) => {
              const isActive = key === active;
              return (
                <button
                  key={key}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => choose(key)}
                  className={cn(
                    "relative cursor-pointer overflow-hidden rounded-full border px-4 py-2 text-[0.8rem] font-medium transition-colors",
                    isActive
                      ? "border-accent bg-accent text-accent-fg"
                      : "border-border bg-surface text-fg-2 hover:text-fg",
                  )}
                >
                  {d.prototypes.tabs[key].label}
                  {/* Progress bar shows how long until the next screen. */}
                  {isActive && auto && inView ? (
                    <span
                      key={`${key}-progress`}
                      className="tab-progress absolute inset-x-0 bottom-0 h-[2px] bg-accent-fg/45"
                      style={{ "--tab-duration": `${DWELL_MS}ms` } as React.CSSProperties}
                      aria-hidden="true"
                    />
                  ) : null}
                </button>
              );
            })}
          </div>
        </Reveal>

        <Reveal delay={140}>
          <div className="mt-12 flex flex-col items-center">
            <div className="relative">
              <div className="bloom start-1/2 top-1/2 size-[380px] -translate-x-1/2 -translate-y-1/2 opacity-30" />
              <PhoneFrame>
                {/* Keying on `active` restarts the fade for each screen. */}
                <div key={active} className="h-full animate-[fade-in_0.45s_ease-out]">
                  {screens[active]}
                </div>
              </PhoneFrame>
            </div>
            <p
              key={`${active}-caption`}
              className="mt-7 max-w-sm animate-[fade-in_0.45s_ease-out] text-center text-[0.85rem] text-fg-2"
            >
              {d.prototypes.tabs[active].caption}
            </p>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
