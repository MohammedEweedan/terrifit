"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import type { Locale } from "@/i18n/config";
import type { PagesCopy } from "@/i18n/pages";

/**
 * What you can buy right now.
 *
 * This replaced a dated roadmap. The roadmap was honest but it read as a list
 * of things that do not exist yet, and it put the two products that *do* ship
 * — supplements and gymwear — below three future dates. A visitor scanning the
 * page came away thinking there was nothing to buy.
 *
 * Two cards go to the shop, one takes a reservation. The refund line is not
 * marketing: taking money for hardware that has not been built carries an
 * obligation, and stating it here is where somebody actually reads it.
 */
export function AvailableNow({
  locale,
  copy,
  tone = "dark",
}: {
  locale: Locale;
  copy: PagesCopy["availableNow"];
  /** `paper` for the off-white bands, `dark` for the near-black ones. */
  tone?: "dark" | "paper";
}) {
  const reduced = useReducedMotion();

  return (
    <section className={`lr lr-${tone}`} id="available">
      <div className="tf-shell">
        <div className="lr-head">
          <p className="lr-eyebrow">{copy.eyebrow}</p>
          <h2>{copy.title}</h2>
          <p className="lr-lede">{copy.body}</p>
        </div>

        <ol className="lr-track">
          {copy.items.map((item, index) => (
            <motion.li
              key={item.title}
              // The pre-order card is the one being asked for, so it carries
              // the accent treatment the two shipping cards do not.
              className={item.href === "band" ? "lr-now" : undefined}
              initial={reduced ? false : { opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-10% 0px" }}
              transition={{ duration: 0.55, delay: 0.08 * index, ease: [0.22, 1, 0.36, 1] }}
            >
              <span className="lr-date">
                <i aria-hidden />
                {item.status}
              </span>
              <strong>{item.title}</strong>
              <p>{item.body}</p>
              <Link className="lr-cta" href={`/${locale}/${item.href}`}>
                {item.cta} <span aria-hidden>→</span>
              </Link>
            </motion.li>
          ))}
        </ol>

        <p className="lr-note">{copy.note}</p>
      </div>
    </section>
  );
}
