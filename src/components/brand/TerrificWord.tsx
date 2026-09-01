/**
 * "TERRIFIC" with its last letter flickering to a T.
 *
 * The brand name is the joke: the C keeps trying to become the T in Terrifit,
 * like a sign that has not quite settled. Done entirely in CSS keyframes with
 * `steps(1)` so it snaps rather than fades, needs no JavaScript, cannot cause a
 * hydration mismatch, and stops dead for anyone who has asked the OS to reduce
 * motion (settling on the T).
 *
 * Both glyphs are `aria-hidden`; the caller supplies the real text for screen
 * readers, so the accessible name is a normal sentence.
 */
export function TerrificWord({ word = "TERRIFIC" }: { word?: string }) {
  const stem = word.slice(0, -1);
  const last = word.slice(-1);

  return (
    <span className="tf-terrific" aria-hidden="true">
      {stem}
      <span className="tf-terrific-swap">
        <i>{last}</i>
        <i>T</i>
      </span>
    </span>
  );
}

/**
 * Splits a headline around the word to animate.
 * Returns null when the word is not in this locale's headline, so the caller
 * can fall back to plain text rather than mangling a translation.
 */
export function splitHeadline(headline: string, word: string): { lead: string; tail: string; match: string } | null {
  const index = headline.toLowerCase().indexOf(word.toLowerCase());
  if (index === -1) return null;
  return {
    lead: headline.slice(0, index),
    match: headline.slice(index, index + word.length),
    tail: headline.slice(index + word.length),
  };
}
