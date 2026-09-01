"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import type { Locale } from "@/i18n/config";
import type { PagesCopy } from "@/i18n/pages";

/**
 * What you can buy today, and the dates for everything else.
 *
 * It exists because the rest of the site describes a platform that is mostly
 * still being built. Naming the months is the honest version of "coming soon",
 * and it is the one thing on the page a visitor can hold us to.
 */
export function LaunchRoadmap({
  locale,
  copy,
  tone = "dark",
}: {
  locale: Locale;
  copy: PagesCopy["roadmap"];
  /** `paper` for the off-white bands, `dark` for the near-black ones. */
  tone?: "dark" | "paper";
}) {
  const reduced = useReducedMotion();

  return (
    <section className={`lr lr-${tone}`} id="roadmap">
      <div className="tf-shell">
        <div className="lr-head">
          <p className="lr-eyebrow">{copy.eyebrow}</p>
          <h2>{copy.title}</h2>
          <p className="lr-lede">{copy.body}</p>
        </div>

        <ol className="lr-track">
          <motion.li
            className="lr-now"
            initial={reduced ? false : { opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-10% 0px" }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="lr-date">
              <i aria-hidden />
              {copy.nowLabel}
            </span>
            <strong>{copy.nowTitle}</strong>
            <p>{copy.nowBody}</p>
            <Link className="lr-cta" href={`/${locale}/shop`}>
              {copy.nowCta} <span aria-hidden>→</span>
            </Link>
          </motion.li>

          {copy.items.map((item, index) => (
            <motion.li
              key={item.title}
              initial={reduced ? false : { opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-10% 0px" }}
              transition={{ duration: 0.55, delay: 0.08 * (index + 1), ease: [0.22, 1, 0.36, 1] }}
            >
              <span className="lr-date">{item.date}</span>
              <strong>{item.title}</strong>
              <p>{item.body}</p>
            </motion.li>
          ))}
        </ol>

        <p className="lr-note">{copy.note}</p>
      </div>
    </section>
  );
}
