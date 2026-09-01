"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Counts to a value once it scrolls into view. Large figures are the point of
 * this design, and a static number reads as a placeholder where an animated
 * one reads as live data. Reduced-motion users get the final value straight
 * away, and so does anyone whose JS never runs — the server renders the value.
 */
export function CountUp({
  value,
  duration = 1400,
  className,
}: {
  value: number;
  duration?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState(value);
  const started = useRef(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    // The final value is what renders first, so a visitor without JavaScript,
    // with reduced motion on, or without an observer simply reads the number.
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || started.current) return;
        started.current = true;
        observer.disconnect();
        // Counting starts here rather than in the effect body: setting state
        // synchronously on mount is a cascading render.
        setDisplay(0);

        const start = performance.now();
        let frame = 0;

        const tick = (now: number) => {
          const progress = Math.min(1, (now - start) / duration);
          // Ease-out cubic: fast settle, no bounce.
          const eased = 1 - Math.pow(1 - progress, 3);
          setDisplay(Math.round(value * eased));
          if (progress < 1) frame = requestAnimationFrame(tick);
        };

        frame = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(frame);
      },
      { threshold: 0.4 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [value, duration]);

  return (
    <span ref={ref} className={className}>
      {display.toLocaleString("en-US")}
    </span>
  );
}
