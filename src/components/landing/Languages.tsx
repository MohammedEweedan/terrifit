"use client";

import { useState } from "react";
import { locales, localeMeta, type Locale } from "@/i18n/config";
import { marketingDetails } from "@/i18n/marketing";
import type { PagesCopy } from "@/i18n/pages";

/**
 * Ten languages, shown rather than claimed.
 *
 * Every other site says "available in 10 languages" over a row of flags. This
 * one prints the same brand line in all ten, each in its own script, with the
 * right `lang` and `dir` on the element — so the browser applies the correct
 * shaping and the Arabic line runs right-to-left on its own. The section is
 * therefore its own proof: if a translation were missing or a script were
 * broken, this is where it would be visible first.
 *
 * Flags are deliberately absent. A flag is a country, and a language is not —
 * Arabic is not Saudi Arabia, Portuguese is not Portugal, and Spanish belongs
 * to twenty countries before it belongs to Spain.
 */
export function Languages({ copy, current }: { copy: PagesCopy["languages"]; current: Locale }) {
  // Opens on the reader's own language, because the first thing anybody checks
  // is whether their own is any good.
  const [active, setActive] = useState<Locale>(current);
  const meta = localeMeta[active];
  const line = marketingDetails[active].lifestyle[3];

  return (
    <section className="tf-langs" aria-labelledby="tf-langs-title">
      <div className="tf-shell">
        <header className="tf-langs-head">
          <p className="tf-langs-eyebrow">{copy.eyebrow}</p>
          <h2 id="tf-langs-title">{copy.title}</h2>
          <p className="tf-langs-lede">{copy.body}</p>
        </header>

        {/* The line itself, in whichever language is selected. `key` forces a
            remount so the change is a cross-fade rather than a text swap. */}
        <p
          key={active}
          className="tf-langs-line"
          lang={meta.htmlLang}
          dir={meta.dir}
        >
          {line}
        </p>

        <ul className="tf-langs-list" role="list">
          {locales.map((code) => {
            const item = localeMeta[code];
            return (
              <li key={code}>
                <button
                  type="button"
                  lang={item.htmlLang}
                  dir={item.dir}
                  aria-pressed={code === active}
                  className={code === active ? "is-active" : undefined}
                  onMouseEnter={() => setActive(code)}
                  onFocus={() => setActive(code)}
                  onClick={() => setActive(code)}
                >
                  {item.label}
                </button>
              </li>
            );
          })}
        </ul>

      </div>
    </section>
  );
}
