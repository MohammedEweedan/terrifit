"use client";

import Image, { type StaticImageData } from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import type { PagesCopy } from "@/i18n/pages";

type Callout = PagesCopy["band"]["callouts"][number];

/**
 * The band, annotated.
 *
 * On a wide screen each label sits in the gutter beside the photograph with a
 * leader line and an arrowhead pointing at the part it names, and they arrive
 * one after another as the section comes into view rather than all at once.
 *
 * On a phone there is no room for gutters, so the same six points become
 * numbered pins on the photograph and a numbered list underneath. Nothing is
 * dropped — the explanation is complete at both sizes.
 */
export function BandCallouts({
  image,
  alt,
  copy,
  title,
}: {
  image: StaticImageData;
  alt: string;
  copy: readonly Callout[];
  title: string;
}) {
  const reduced = useReducedMotion();

  return (
    <div className="tf-band-annotated">
      <div className="tf-band-annotated-stage">
        <Image src={image} alt={alt} placeholder="blur" sizes="(max-width: 900px) 100vw, 52vw" />

        {/* Leader lines are drawn as one SVG in stage coordinates so a label can
            sit clear of its anchor point. Two callouts on almost the same part
            of the band would otherwise print on top of each other. */}
        <svg className="tf-callout-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          {copy.map((callout, index) => {
            const edge = callout.side === "left" ? 0 : 100;
            const bend = callout.side === "left" ? callout.x - 9 : callout.x + 9;
            return (
              <motion.path
                key={callout.title}
                d={`M ${edge} ${callout.labelY} H ${bend} L ${callout.x} ${callout.y}`}
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
                vectorEffect="non-scaling-stroke"
                initial={reduced ? false : { pathLength: 0, opacity: 0 }}
                whileInView={{ pathLength: 1, opacity: 0.55 }}
                viewport={{ once: true, margin: "-15% 0px" }}
                transition={{ duration: 0.55, delay: 0.25 + index * 0.24, ease: [0.22, 1, 0.36, 1] }}
              />
            );
          })}
        </svg>

        {copy.map((callout, index) => (
          <motion.div
            key={callout.title}
            className="tf-callout"
            data-side={callout.side}
            style={
              {
                "--x": `${callout.x}%`,
                "--y": `${callout.y}%`,
                "--label-y": `${callout.labelY}%`,
              } as React.CSSProperties
            }
            initial={reduced ? false : { opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: "-15% 0px" }}
            transition={{ duration: 0.45, delay: 0.4 + index * 0.24, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="tf-callout-dot" aria-hidden />
            <span className="tf-callout-index numeric" aria-hidden>
              {String(index + 1).padStart(2, "0")}
            </span>
            <div className="tf-callout-label">
              <strong>{callout.title}</strong>
              <p>{callout.body}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* The same points, for the small-screen layout and for anyone reading
          with the photograph turned off. */}
      <ol className="tf-callout-list">
        <li className="tf-callout-list-title" aria-hidden>
          {title}
        </li>
        {copy.map((callout, index) => (
          <motion.li
            key={callout.title}
            initial={reduced ? false : { opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-10% 0px" }}
            transition={{ duration: 0.45, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="numeric">{String(index + 1).padStart(2, "0")}</span>
            <div>
              <strong>{callout.title}</strong>
              <p>{callout.body}</p>
            </div>
          </motion.li>
        ))}
      </ol>
    </div>
  );
}
