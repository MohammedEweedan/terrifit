import type { ReactNode } from "react";

/**
 * One message, one composition, one screen.
 *
 * The brief's rule is a single major idea per viewport, so this deliberately
 * offers no slot for a card row or a feature grid: an eyebrow, a headline, one
 * optional line of support, and whatever visual the section is actually about.
 * Sections that need more than that are the wrong shape.
 */
export function EditorialSection({
  eyebrow,
  headline,
  lead,
  children,
  tone = "paper",
  align = "start",
  full = false,
  id,
}: {
  eyebrow?: string;
  headline: ReactNode;
  lead?: ReactNode;
  /** The visual. Given the full width when `full`, so imagery can break out. */
  children?: ReactNode;
  tone?: "paper" | "ink";
  align?: "start" | "center";
  full?: boolean;
  id?: string;
}) {
  return (
    <section id={id} className={`ed ed-${tone} ${align === "center" ? "is-center" : ""}`}>
      <div className={full ? "ed-bleed" : "ed-shell"}>
        <header className="ed-head">
          {eyebrow ? <p className="ed-eyebrow">{eyebrow}</p> : null}
          <h2 className="ed-headline">{headline}</h2>
          {lead ? <p className="ed-lead">{lead}</p> : null}
        </header>
        {children ? <div className="ed-visual">{children}</div> : null}
      </div>
    </section>
  );
}
