import Link from "next/link";
import type { Locale } from "@/i18n/config";
import { LEGAL_DOCUMENTS, type LegalDocument } from "@/lib/legal/content";

/**
 * A legal page.
 *
 * Set at a readable measure with real hierarchy rather than a wall of 11px
 * grey: these are the pages somebody reads when they are already worried about
 * something, and making them hard to read is its own kind of answer.
 */
export function LegalPage({ locale, document }: { locale: Locale; document: LegalDocument }) {
  return (
    <article className="lg-page">
      <header className="lg-head">
        <p className="lg-eyebrow">Legal</p>
        <h1>{document.title}</h1>
        <p className="lg-summary">{document.summary}</p>
        <p className="lg-updated">Last updated {document.updated}</p>
      </header>

      <div className="lg-body">
        {document.sections.map((section) => (
          <section key={section.heading}>
            <h2>{section.heading}</h2>
            {section.body.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
            {section.list ? (
              <ul>
                {section.list.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ) : null}
          </section>
        ))}
      </div>

      <nav className="lg-nav" aria-label="Other legal pages">
        {LEGAL_DOCUMENTS.filter((other) => other.slug !== document.slug).map((other) => (
          <Link key={other.slug} href={`/${locale}/legal/${other.slug}`}>
            {other.title}
          </Link>
        ))}
      </nav>
    </article>
  );
}
