import type { PagesCopy } from "@/i18n/pages";

/**
 * What the V1 measures, as three plain columns.
 *
 * A specification table that reads like a specification table, on purpose. By
 * the time somebody scrolls this far they have had the story; what they want
 * now is the list, and dressing a list up as anything else only makes it
 * slower to scan.
 *
 * The grouping carries the argument on its own: what the band *senses*, what
 * Terrifit *derives* from that, and what happens *during a session*. It is the
 * same three-layer claim the rest of the site makes — the band measures, the
 * app explains — set out where it can be checked line by line.
 */
export function Capabilities({ copy }: { copy: PagesCopy["capabilities"] }) {
  return (
    <section className="tf-caps" id="measures" aria-labelledby="tf-caps-title">
      <div className="tf-shell">
        <header className="tf-caps-head">
          <p className="tf-caps-eyebrow">{copy.eyebrow}</p>
          <h2 id="tf-caps-title">{copy.title}</h2>
          <p className="tf-caps-lede">{copy.body}</p>
        </header>

        <div className="tf-caps-grid">
          {copy.groups.map((group) => (
            <section key={group.name} className="tf-caps-group">
              <h3>{group.name}</h3>
              <dl>
                {group.items.map((item) => (
                  <div key={item.name}>
                    <dt>{item.name}</dt>
                    <dd>{item.detail}</dd>
                  </div>
                ))}
              </dl>
            </section>
          ))}
        </div>

        {/* Not small print by accident — it is the sentence that keeps every
            claim above it inside what a wellness device may say. */}
        <p className="tf-caps-footnote">{copy.footnote}</p>
      </div>
    </section>
  );
}
