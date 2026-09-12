"use client";

import { useRef, type ReactNode } from "react";
import { useScroll, useReducedMotion, type MotionValue } from "framer-motion";

/**
 * A tall scroll track with a viewport-height stage pinned inside it.
 *
 * This is the shape every scroll-driven section in the redesign takes: the
 * track gives the scene its duration, the stage stays still while the page
 * moves through it, and `progress` normalises that movement to 0–1 so the
 * visuals scrub rather than play. Scrolling back reverses everything, because
 * nothing is driven by a timer.
 *
 * Driven by framer-motion's scroll primitives rather than GSAP ScrollTrigger.
 * framer-motion is already in the bundle and in fourteen components; adding a
 * second scroll engine for the same capability is roughly 70KB for no new
 * behaviour. Say the word if you want GSAP specifically and I will swap it.
 *
 * Under `prefers-reduced-motion` the track collapses to a single screen and the
 * stage stops being sticky, so the scene becomes one still composition instead
 * of a long empty scroll.
 */
export function StickyScene({
  children,
  screens = 3,
  className = "",
  id,
}: {
  /** Receives scroll progress through the track, normalised 0–1. */
  children: (progress: MotionValue<number>) => ReactNode;
  /** Track height in viewports. More screens means a slower, longer scene. */
  screens?: number;
  className?: string;
  id?: string;
}) {
  const track = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: track,
    // Starts when the track's top reaches the viewport top and ends when its
    // bottom does, which is exactly the span the stage is pinned for.
    offset: ["start start", "end end"],
  });

  return (
    <section
      ref={track}
      id={id}
      className={`sn-track ${className}`}
      style={{ height: reduced ? "100svh" : `${Math.max(1, screens) * 100}svh` }}
    >
      <div className="sn-stage">{children(scrollYProgress)}</div>
    </section>
  );
}
