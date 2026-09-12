"use client";

import { useEffect, useRef, useState } from "react";
import { useMotionValueEvent, type MotionValue } from "framer-motion";

/**
 * A frame sequence painted to canvas and scrubbed by scroll progress.
 *
 * Canvas rather than stacked <img> elements: swapping a src forces a decode on
 * the main thread mid-scroll, while drawing an already-decoded bitmap is a
 * blit. Frames are fetched as ImageBitmap off the main thread for the same
 * reason.
 *
 * Loading is staged. A handful of evenly spaced frames arrive first so the
 * scene is scrubbable almost immediately, then the rest fill in behind them —
 * a 120-frame sequence requested at once is several megabytes of blocking
 * network before anything can be shown.
 *
 * `frameUrl` is a function rather than a directory so the caller decides the
 * format and naming. When the frames do not exist yet the component renders its
 * poster and nothing else, which is the asset slot the brief asks for rather
 * than a broken canvas.
 */
export function ScrollSequence({
  progress,
  frames,
  frameUrl,
  poster,
  alt,
  className = "",
}: {
  progress: MotionValue<number>;
  frames: number;
  frameUrl: (index: number) => string;
  /** Shown until the first frame decodes, and the whole visual if none load. */
  poster: string;
  alt: string;
  className?: string;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const bitmaps = useRef<(ImageBitmap | undefined)[]>([]);
  const [ready, setReady] = useState(false);
  const current = useRef(-1);

  useEffect(() => {
    let cancelled = false;
    bitmaps.current = new Array(frames);

    const load = async (index: number) => {
      try {
        const response = await fetch(frameUrl(index));
        if (!response.ok) return false;
        const bitmap = await createImageBitmap(await response.blob());
        if (cancelled) { bitmap.close(); return false; }
        bitmaps.current[index] = bitmap;
        return true;
      } catch {
        return false;
      }
    };

    (async () => {
      // Ten spread across the sequence: enough that any scroll position has a
      // near neighbour to draw while the rest arrive.
      const seeds = Array.from({ length: 10 }, (_, i) => Math.round((i / 9) * (frames - 1)));
      const seeded = await Promise.all(seeds.map(load));
      if (cancelled) return;
      if (!seeded.some(Boolean)) return;   // no frames on disk: poster stands in
      setReady(true);

      for (let i = 0; i < frames && !cancelled; i += 1) {
        if (!bitmaps.current[i]) await load(i);
      }
    })();

    return () => {
      cancelled = true;
      for (const bitmap of bitmaps.current) bitmap?.close();
      bitmaps.current = [];
    };
  }, [frames, frameUrl]);

  /** Nearest loaded frame, so a gap never blanks the canvas mid-scroll. */
  const draw = (value: number) => {
    const element = canvas.current;
    if (!element) return;
    const target = Math.min(frames - 1, Math.max(0, Math.round(value * (frames - 1))));
    let index = target;
    if (!bitmaps.current[index]) {
      for (let step = 1; step < frames; step += 1) {
        if (bitmaps.current[target - step]) { index = target - step; break; }
        if (bitmaps.current[target + step]) { index = target + step; break; }
      }
    }
    const bitmap = bitmaps.current[index];
    if (!bitmap || index === current.current) return;
    current.current = index;

    const context = element.getContext("2d", { alpha: true });
    if (!context) return;
    if (element.width !== bitmap.width) { element.width = bitmap.width; element.height = bitmap.height; }
    context.clearRect(0, 0, element.width, element.height);
    context.drawImage(bitmap, 0, 0);
  };

  useMotionValueEvent(progress, "change", draw);

  return (
    <div className={`sq ${className}`}>
      {/* The poster is the accessible image and the fallback. The canvas is
          decoration layered over it once frames exist. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="sq-poster" src={poster} alt={alt} decoding="async" />
      <canvas ref={canvas} className={`sq-canvas ${ready ? "is-ready" : ""}`} aria-hidden="true" />
    </div>
  );
}
