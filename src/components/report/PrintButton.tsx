"use client";

/**
 * Opens the browser's print dialogue, which is also how you save a PDF on every
 * desktop and on iOS. Hidden from the printed page itself — a button in the
 * margin of a printout is the classic tell that nobody tested printing it.
 */
export function PrintButton() {
  return (
    <button type="button" className="rp-print" onClick={() => window.print()}>
      Print or save as PDF
    </button>
  );
}
