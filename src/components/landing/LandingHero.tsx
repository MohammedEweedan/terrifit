"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import type { Locale } from "@/i18n/config";
import { storefrontCopy } from "@/i18n/storefront";
import { marketingDetails } from "@/i18n/marketing";
import { SloganMark } from "./SloganMark";
import athlete from "../../../public/media/hoodie-sec.png";
import band from "../../../public/media/band/colourways-v2/ember.png";
import styles from "./LandingHero.module.css";

function openWaitlist(event: React.MouseEvent<HTMLAnchorElement>) {
  event.preventDefault();
  window.dispatchEvent(new CustomEvent("terrifit:open-waitlist"));
}

export function LandingHero({ locale }: { locale: Locale }) {
  const text = storefrontCopy(locale);
  const reduce = useReducedMotion();
  const ease = [0.22, 1, 0.36, 1] as const;

  return (
    <section className={styles.hero} id="top">
      <div className={`tf-shell ${styles.grid}`}>
        <motion.div className={styles.copy} initial={reduce ? false : { opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.65, ease }}>
          <div className={styles.headline}><SloganMark /></div>
          <div className={styles.actions}>
            <a className={styles.primary} href="#waitlist" onClick={openWaitlist}>{text.early}<span aria-hidden="true">↗</span></a>
            <Link className={styles.secondary} href={`/${locale}/app`}>{text.explore}<span aria-hidden="true">→</span></Link>
          </div>
          <p className={styles.note}><span aria-hidden="true">✓</span>{text.waitFoot}</p>
          <div className={styles.signature}><span aria-hidden="true">✳</span><span>{text.heroFoot}</span></div>
        </motion.div>

        <motion.div className={styles.visual} initial={reduce ? false : { opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.85, delay: 0.08, ease }}>
          <div className={styles.photo}>
            <Image src={athlete} alt="Runner in full stride across a sunlit landscape" fill preload placeholder="blur" sizes="(max-width: 760px) 100vw, 52vw" />
            <div className={styles.photoTop}><span>TERRIFIT</span><span aria-hidden="true">↗</span></div>
            <svg className={styles.orbit} viewBox="0 0 500 600" fill="none" aria-hidden="true"><ellipse cx="264" cy="306" rx="215" ry="260" transform="rotate(25 264 306)" /><ellipse cx="264" cy="306" rx="202" ry="245" transform="rotate(25 264 306)" /></svg>
            <div className={styles.photoBottom}><p>{text.heroCaption}</p><a href="#metrics" aria-label={text.browse}>↓</a></div>
          </div>
          <Link className={styles.product} href={`/${locale}/band`}>
            <div className={styles.productImage}><Image src={band} alt="" sizes="112px" /></div>
            <div><span>TERRIFIT V1</span><strong>{marketingDetails[locale].band[4]}</strong></div>
            <span className={styles.productArrow} aria-hidden="true">↗</span>
          </Link>
          <span className={styles.edgeNote} aria-hidden="true">TERRIFIT / 01</span>
        </motion.div>
      </div>

      <nav id="metrics" className={`tf-shell ${styles.paths}`} aria-label={text.browse}>
        {text.paths.map((path, index) => (
          <Link key={path.href} href={`/${locale}/${path.href}`}>
            <div className={styles.pathTop}><span className={styles.pathIcon} aria-hidden="true"><PathIcon index={index} /></span><span className={styles.pathNumber} aria-hidden="true">0{index + 1}</span></div>
            <div className={styles.pathCopy}><h2>{path.title}</h2><p>{path.body}</p><span>{path.label}<b aria-hidden="true">↗</b></span></div>
          </Link>
        ))}
      </nav>
    </section>
  );
}

function PathIcon({ index }: { index: number }) {
  return <svg viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {index === 0 ? <><path d="M5 22V7m0 15h18M9 17l5-5 4 3 6-9" /><path d="M19 6h5v5" /></> : index === 1 ? <><circle cx="14" cy="14" r="10" /><path d="M4 14h5l3-6 4 12 3-6h5" /></> : <><path d="M7 9h14l2 15H5L7 9Z" /><path d="M10 10V7a4 4 0 0 1 8 0v3" /></>}
  </svg>;
}
