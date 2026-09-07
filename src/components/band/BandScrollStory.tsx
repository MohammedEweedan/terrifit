"use client";

import { SmartImage } from "@/components/media/SmartImage";
import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from "framer-motion";
import { useRef } from "react";
import type { PagesCopy } from "@/i18n/pages";

/**
 * The V1 told as a scroll rather than a page.
 *
 * The device Apple uses on the Mac mini page, and the reason it works: the
 * product is pinned in the middle of the screen and *the reader moves past it*,
 * so one object carries six claims instead of six photographs carrying one
 * each. The band never leaves; only what is being said about it changes.
 *
 * Three rules keep it from becoming the usual scrolljacked mess:
 *
 *  - **Nothing is hidden at rest.** Every chapter's text is in the document and
 *    legible with JavaScript off; scrolling changes emphasis, not existence.
 *  - **Scroll speed is never touched.** The page scrolls at the speed the user
 *    scrolls it. Only transforms are driven by progress.
 *  - **`prefers-reduced-motion` collapses it** to a plain stacked article with
 *    the product shown once, which is a perfectly good version of this page.
 */

export type StoryChapter = {
  /** Two or three words. Sits above the claim. */
  kicker: string;
  /** The claim itself, large. */
  title: string;
  body: string;
};

export function BandScrollStory({
  chapters,
  image,
  statement,
}: {
  chapters: StoryChapter[];
  image: { src: string; alt: string };
  /** The single line the whole sequence is building toward. */
  statement: { lead: string; emphasis: string };
}) {
  const track = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  // Progress through the whole pinned track, 0 → 1.
  const { scrollYProgress } = useScroll({
    target: track,
    offset: ["start start", "end end"],
  });

  // The band settles from slightly oversized to its resting size across the
  // first chapter, then holds. It does not spin, tilt or float — the product is
  // the one thing on this page that should look still.
  const scale = useTransform(scrollYProgress, [0, 0.28, 1], reduce ? [1, 1, 1] : [1.18, 1, 1]);
  const lift = useTransform(scrollYProgress, [0, 0.28], reduce ? ["0%", "0%"] : ["6%", "0%"]);

  if (reduce) {
    return (
      <section className="bs-static">
        <div className="bs-shell">
          <SmartImage src={image.src} alt={image.alt} width={900} height={600} className="bs-static-image" />
          <ol className="bs-static-list">
            {chapters.map((chapter) => (
              <li key={chapter.title}>
                <p className="bs-kicker">{chapter.kicker}</p>
                <h3>{chapter.title}</h3>
                <p>{chapter.body}</p>
              </li>
            ))}
          </ol>
          <p className="bs-statement">
            {statement.lead} <em>{statement.emphasis}</em>
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="bs-story" aria-label={statement.emphasis}>
      {/* The track is as tall as the number of chapters; the stage inside it is
          one viewport and sticks. That ratio is the whole mechanism. */}
      <div ref={track} className="bs-track" style={{ height: `${(chapters.length + 1) * 100}vh` }}>
        <div className="bs-stage">
          <motion.div className="bs-product" style={{ scale, y: lift }}>
            <SmartImage
              src={image.src}
              alt={image.alt}
              width={900}
              height={600}
              priority
              className="bs-product-image"
            />
          </motion.div>

          <div className="bs-chapters">
            {chapters.map((chapter, index) => (
              <Chapter
                key={chapter.title}
                chapter={chapter}
                index={index}
                count={chapters.length}
                progress={scrollYProgress}
              />
            ))}
          </div>

          <ol className="bs-progress" aria-hidden>
            {chapters.map((chapter, index) => (
              <Pip key={chapter.title} index={index} count={chapters.length} progress={scrollYProgress} />
            ))}
          </ol>
        </div>
      </div>

      <div className="bs-statement-block">
        <p className="bs-statement">
          {statement.lead} <em>{statement.emphasis}</em>
        </p>
      </div>
    </section>
  );
}

/**
 * One claim, fading through its own slice of the track.
 *
 * Each chapter owns `1 / count` of the scroll and crosses in and out inside it.
 * The text is always in the DOM — it is opacity and a few pixels of travel that
 * move, so a screen reader and a crawler get the whole article regardless.
 */
function Chapter({
  chapter,
  index,
  count,
  progress,
}: {
  chapter: StoryChapter;
  index: number;
  count: number;
  progress: MotionValue<number>;
}) {
  // Chapters start after the settle, and the last one holds to the end.
  const span = 1 / (count + 1);
  const start = span * (index + 1);
  const opacity = useTransform(
    progress,
    [start - span * 0.75, start - span * 0.2, start + span * 0.55, start + span * 0.9],
    [0, 1, 1, index === count - 1 ? 1 : 0],
  );
  const y = useTransform(progress, [start - span * 0.75, start - span * 0.2], [26, 0]);

  return (
    <motion.article className="bs-chapter" style={{ opacity, y }}>
      <p className="bs-kicker">{chapter.kicker}</p>
      <h3>{chapter.title}</h3>
      <p className="bs-chapter-body">{chapter.body}</p>
    </motion.article>
  );
}

function Pip({ index, count, progress }: { index: number; count: number; progress: MotionValue<number> }) {
  const span = 1 / (count + 1);
  const start = span * (index + 1);
  const opacity = useTransform(
    progress,
    [start - span * 0.7, start - span * 0.2, start + span * 0.6, start + span],
    [0.22, 1, 1, 0.22],
  );
  return <motion.li style={{ opacity }} />;
}
