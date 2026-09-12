"use client";

import { motion, useTransform, type MotionValue } from "framer-motion";

/**
 * Copy that changes as the product turns.
 *
 * Each chapter owns a slice of the scroll and cross-fades within it, so the
 * words are tied to what the model is doing rather than arriving on a timer.
 * Transforms are opacity and translate only — both compositor properties, so
 * the captions never cost a layout pass while the canvas is drawing.
 */
export function BandStoryCaptions({
  progress,
  chapters,
  statement,
}: {
  progress: MotionValue<number>;
  chapters: ReadonlyArray<{ kicker: string; title: string; body: string }>;
  statement?: { lead: string; emphasis: string };
}) {
  return (
    <div className="bs3-captions">
      {chapters.map((chapter, index) => (
        <Caption key={chapter.title} progress={progress} index={index} count={chapters.length} chapter={chapter} />
      ))}
      {statement ? (
        <p className="bs3-statement">
          {statement.lead} <b>{statement.emphasis}</b>
        </p>
      ) : null}
    </div>
  );
}

function Caption({
  progress,
  index,
  count,
  chapter,
}: {
  progress: MotionValue<number>;
  index: number;
  count: number;
  chapter: { kicker: string; title: string; body: string };
}) {
  const span = 1 / count;
  const start = index * span;
  const first = index === 0;
  const last = index === count - 1;

  /**
   * A explicit window rather than an interpolated keyframe array.
   *
   * The array form produced a caption whose opacity tracked scroll progress
   * across the whole scene instead of only its own slice, leaving the first
   * chapter ghosted over every later one. A function is unambiguous: outside
   * the slice the caption is simply absent.
   *
   * The ends are deliberate exceptions. The first chapter is already readable
   * the moment the scene pins, rather than the reader arriving to a blank
   * screen; the last one holds to the end, rather than fading out exactly as
   * they reach it.
   */
  const window = (value: number) => {
    const local = (value - start) / span;
    if (local < 0) return first ? 1 : 0;
    if (local > 1) return last ? 1 : 0;
    if (local < 0.2) return first ? 1 : local / 0.2;
    if (local > 0.8) return last ? 1 : (1 - local) / 0.2;
    return 1;
  };

  const opacity = useTransform(progress, window);
  const y = useTransform(progress, (value) => {
    const local = Math.min(1, Math.max(0, (value - start) / span));
    if (first && local < 0.2) return 0;
    if (last && local > 0.8) return 0;
    return 24 - local * 48;
  });

  return (
    <motion.figure className="bs3-caption" style={{ opacity, y }}>
      <figcaption>
        <span className="bs3-kicker">{chapter.kicker}</span>
        <h3>{chapter.title}</h3>
        <p>{chapter.body}</p>
      </figcaption>
    </motion.figure>
  );
}
