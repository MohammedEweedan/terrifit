"use client";

import { useEffect, useRef, useState } from "react";
import { useMotionValueEvent, useReducedMotion, type MotionValue } from "framer-motion";
import type { Locale } from "@/i18n/config";
import { bandFinish } from "./colourways";
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
  const finish = bandFinish(colourway);
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
  useMotionValueEvent(progress, "change", (value) => scene.current?.setShot(value));

  return (
    <div className="bs3-stage">
      <div ref={host} className={`bs3-canvas ${mode === "live" ? "is-live" : ""}`} aria-hidden="true" />
      {/* The still is the accessible image and the fallback for reduced motion,
          a failed WebGL context, or the moments before the model is ready. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className={`bs3-still ${mode === "live" ? "is-hidden" : ""}`} src={poster} alt={alt} decoding="async" />
    </div>
  );
}
