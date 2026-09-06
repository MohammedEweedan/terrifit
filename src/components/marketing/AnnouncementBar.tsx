"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { dismiss, getDismissed, getServerDismissed, subscribeDismissed } from "@/lib/announcement-store";

/**
 * One line of news across the top of the landing page, below the header.
 *
 * Two behaviours, decided by measurement rather than by breakpoint alone:
 *
 *  - **Narrow, or too long to fit** — it tickers. The content is duplicated and
 *    the track translates by exactly half its width, so the loop is seamless
 *    and the reader never sees a gap or a jump.
 *  - **Wide enough to hold the sentence** — it sits still. A marquee that runs
 *    when the text already fits is decoration, and decoration that moves is the
 *    thing people install extensions to kill.
 *
 * The measurement is what makes that split honest: on desktop it scrolls only
 * when the sentence genuinely overflows, and then slowly, because a long line
 * that has to move is being read rather than glanced at.
 */

/** Below this the bar always tickers — a phone cannot hold a sentence. */
const ALWAYS_TICKER_PX = 760;

/** Pixels per second. Slow enough to read without chasing it. */
const SPEED = 34;

export type Announcement = {
  /** Changing this makes the bar reappear for everyone. */
  id: string;
  text: string;
  href: string;
  cta: string;
};

export function AnnouncementBar({ announcement }: { announcement: Announcement | null }) {
  // Starts *visible*: the store's server snapshot is "nothing dismissed", so
  // the bar renders on the server and through hydration and only disappears
  // once the real value is read. The other way round — hidden until proven
  // otherwise — drops the bar in after hydration and shoves the page down,
  // which is a layout shift on every first visit to save a flash on a
  // returning one. Reading storage in an effect would do the same thing one
  // cascading render later, which is what the lint rule is there to stop.
  const dismissed = useSyncExternalStore(subscribeDismissed, getDismissed, getServerDismissed);
  const visible = announcement != null && dismissed !== announcement.id;

  const [ticker, setTicker] = useState(false);
  const [duration, setDuration] = useState(24);

  const viewport = useRef<HTMLDivElement>(null);
  const run = useRef<HTMLSpanElement>(null);

  /**
   * Decide whether to move, and how fast.
   *
   * Speed is derived from the distance travelled rather than fixed, so a short
   * sentence and a long one scroll at the same *reading* pace instead of the
   * long one racing to finish in the same time.
   */
  const measure = useCallback(() => {
    const box = viewport.current;
    const text = run.current;
    if (!box || !text) return;

    const overflows = text.scrollWidth > box.clientWidth;
    const narrow = window.innerWidth <= ALWAYS_TICKER_PX;
    const shouldTicker = narrow || overflows;

    setTicker(shouldTicker);
    if (shouldTicker) {
      // The track holds two copies, so a full loop travels one copy's width.
      const distance = text.scrollWidth + 48;
      setDuration(Math.max(12, distance / SPEED));
    }
  }, []);

  useEffect(() => {
    if (!visible || !announcement) return;
    measure();
    window.addEventListener("resize", measure);
    // Fonts land after first paint and change the measurement underneath us.
    document.fonts?.ready.then(measure).catch(() => {});
    return () => window.removeEventListener("resize", measure);
  }, [visible, announcement, measure]);

  if (!announcement || !visible) return null;

  const line = (
    <span className="tf-announce-run" ref={run}>
      <span className="tf-announce-dot" aria-hidden />
      {announcement.text} <b className="tf-announce-cta">{announcement.cta}</b>
    </span>
  );

  return (
    <aside className="tf-announce" aria-label="Announcement" data-ticker={ticker ? "on" : undefined}>
      {/* The whole bar is the link. A moving anchor inside the track is one you
          have to chase, and it left the CTA unclickable for most of the loop. */}
      <Link className="tf-announce-hit" href={announcement.href}>
        <span className="sr-only">{announcement.cta}</span>
      </Link>
      <div className="tf-announce-viewport" ref={viewport}>
        <div
          className="tf-announce-track"
          style={ticker ? { animationDuration: `${duration}s` } : undefined}
        >
          {line}
          {/* The second copy is what makes the loop seamless: by the time the
              track has travelled one copy's width, the duplicate is exactly
              where the original started. It is decorative to a screen reader. */}
          {ticker ? (
            <span className="tf-announce-run" aria-hidden>
              <span className="tf-announce-dot" />
              {announcement.text} <b className="tf-announce-cta">{announcement.cta}</b>
            </span>
          ) : null}
        </div>
      </div>

      <button
        type="button"
        aria-label="Dismiss announcement"
        onClick={() => dismiss(announcement.id)}
      >
        <svg width="11" height="11" viewBox="0 0 24 24" aria-hidden>
          <path d="M5 5 19 19M19 5 5 19" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" fill="none" />
        </svg>
      </button>
    </aside>
  );
}
