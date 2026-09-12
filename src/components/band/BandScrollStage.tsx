"use client";

import { useEffect, useRef, useState } from "react";
import { useMotionValueEvent, useReducedMotion, type MotionValue } from "framer-motion";
import type { Locale } from "@/i18n/config";
import { BAND_FINISHES, bandFinish } from "./colourways";
import type { BandScene } from "./band-scene";

/**
 * The V1, in 3D, driven by scroll.
 *
 * The band page already had a real Three.js model behind a drag-to-rotate
 * viewer, which is a better centrepiece than any pre-rendered sequence: it is
 * the actual product geometry, it is already in the bundle, and it needs no
 * frames rendering. This binds its camera to scroll progress so the page reads
 * as one continuous shot rather than a widget the reader has to discover.
 *
 * Mounted only when the stage is near the viewport, and torn down on exit —
 * a WebGL context left running off-screen costs battery for nothing.
 *
 * Under `prefers-reduced-motion` the scene is never created and the still
 * render is shown instead, which is also what happens if WebGL is unavailable.
 */
export function BandScrollStage({
  progress,
  colourway,
  poster,
  alt,
}: {
  progress: MotionValue<number>;
  colourway: string;
  poster: string;
  alt: string;
  locale?: Locale;
}) {
  const host = useRef<HTMLDivElement>(null);
  const scene = useRef<BandScene | null>(null);
  const [mode, setMode] = useState<"still" | "live">("still");
  const reduced = useReducedMotion();
  /**
   * The colourway is driven by scroll, not by the picker.
   *
   * The scene turns the band through most of a rotation; changing the weave as
   * it goes means one pass shows the whole range rather than whichever finish
   * happened to be selected. Each colourway holds for an equal slice, and the
   * index is derived rather than stored so scrubbing backwards restores the
   * earlier finish exactly.
   *
   * `colourway` still seeds the first frame, so the model does not flash a
   * different finish from the swatches before the first scroll event arrives.
   */
  const [scrolled, setScrolled] = useState<string | null>(null);
  const finish = bandFinish(scrolled ?? colourway);
  const finishRef = useRef(finish);

  // Kept current in an effect: writing a ref during render is not allowed here,
  // and the mount effect needs the latest finish without re-running on it.
  useEffect(() => { finishRef.current = finish; }, [finish]);

  useEffect(() => {
    const element = host.current;
    if (!element || reduced) return;

    let cancelled = false;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || scene.current || cancelled) return;
        void import("./band-scene")
          .then(async ({ mountBandScene }) => {
            if (cancelled) return;
            const created = mountBandScene(element, finishRef.current, () => setMode("still"));
            created.setAuto(false);
            scene.current = created;
            await created.ready;
            if (!cancelled) setMode("live");
          })
          .catch(() => setMode("still"));
      },
      { rootMargin: "400px" },
    );
    observer.observe(element);

    return () => {
      cancelled = true;
      observer.disconnect();
      scene.current?.dispose();
      scene.current = null;
    };
  }, [reduced]);

  useEffect(() => { scene.current?.setFinish(finish); }, [finish]);

  useMotionValueEvent(progress, "change", (value) => {
    scene.current?.setShot(value);
    const index = Math.min(
      BAND_FINISHES.length - 1,
      Math.max(0, Math.floor(value * BAND_FINISHES.length)),
    );
    const next = BAND_FINISHES[index].id;
    // Only on a change: setState on every scroll event would re-render the
    // component dozens of times a second for nothing.
    setScrolled((current) => (current === next ? current : next));
  });

  return (
    <div className="bs3-stage">
      <div ref={host} className={`bs3-canvas ${mode === "live" ? "is-live" : ""}`} aria-hidden="true" />
      {/* The still is the accessible image and the fallback for reduced motion,
          a failed WebGL context, or the moments before the model is ready. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className={`bs3-still ${mode === "live" ? "is-hidden" : ""}`} src={poster} alt={alt} decoding="async" />
      {/* Names the weave as it changes. Without it the colours read as a
          lighting effect rather than a range you can buy. Announced politely so
          a screen reader gets the change without being interrupted. */}
      {mode === "live" ? (
        <p className="bs3-finish" aria-live="polite">
          <i style={{ background: `repeating-linear-gradient(48deg,${finish.yarn} 0 3px,${finish.weave} 3px 6px)` }} aria-hidden />
          {finish.label}
        </p>
      ) : null}
    </div>
  );
}
