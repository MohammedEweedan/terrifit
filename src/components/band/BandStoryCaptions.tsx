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
  /**
   * A window centred on the slice, wide enough to overlap its neighbours.
   *
   * Windows that stop exactly at the slice boundary leave a moment where the
   * outgoing caption has reached zero and the incoming one has not started —
   * measured at the midpoint, every caption read 0. Reaching 0.6 of a span
   * either side of centre means adjacent captions cross at roughly half
   * opacity instead, which is a cross-fade rather than a blink.
   *
   * The ends stay exceptions: the first chapter is readable the moment the
   * scene pins, the last holds to the end.
   */
  const centre = start + span / 2;
  // Full opacity across most of the slice, reaching zero exactly at the
  // boundary. Overlapping the windows was tried and rejected: two captions
  // sharing one grid cell at 33% each is double-exposed text, which reads worse
  // than a clean swap. The crossing is an instant, not a gap.
  const hold = span * 0.44;
  const fade = span * 0.5;

  const curve = (value: number) => {
    const distance = Math.abs(value - centre);
    if (first && value < centre) return 1;
    if (last && value > centre) return 1;
    if (distance <= hold) return 1;
    if (distance >= fade) return 0;
    return 1 - (distance - hold) / (fade - hold);
  };

  const opacity = useTransform(progress, curve);
  const y = useTransform(progress, (value) => {
    if ((first && value < centre) || (last && value > centre)) return 0;
    // Drifts through the slice rather than jumping, and stays small: this is
    // punctuation for the model turning, not a movement of its own.
    return Math.max(-20, Math.min(20, ((value - centre) / span) * -40));
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
