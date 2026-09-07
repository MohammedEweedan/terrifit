/**
 * "Get terrificly fit" collapsing into "Get terrifit".
 *
 * The trick is that the brand is already inside the slogan: "terrifi·cly· ·fi·t"
 * keeps its own final "t". Removing `cly`, the space and `fi` leaves
 * "terrifi" + "t" — so every piece of the animation is a collapse, and the last
 * letter simply slides into place. Nothing has to grow into an exact width,
 * which is what made an earlier attempt clip: `ch` units are sized from the "0"
 * glyph and bear no relation to the width of wide display capitals.
 *
 * Pure CSS keyframes, so it runs in the server-rendered HTML with no JavaScript
 * and no state — this codebase does not allow setting state from effects.
 * Under `prefers-reduced-motion` the resolved wordmark is rendered outright.
 *
 * The animated pieces are `aria-hidden`; assistive technology reads the label,
 * because announcing letters dissolving is noise.
 */
export function SloganMark({ label = "Get terrificly fit" }: { label?: string }) {
  return (
    <h1 className="th-slogan" aria-label={label}>
      <span className="th-slogan-line" aria-hidden="true">
        <span className="th-slogan-get">Get</span>
        {/* The brand half carries the colour change, resolving to orange over
            the same window the letters are moving. */}
        <span className="th-slogan-word">
          <span>terrifi</span>
          {/* `--w` is each fragment's real width in Anton, measured in the
              browser at this letter-spacing. Collapsing from the true width
              means the squeeze is visible across the whole duration: an
              earlier version animated from a max-width far larger than the
              content, so most of the timeline did nothing and the letters then
              snapped shut. `em` keeps it correct at every font size, and a
              grid `1fr` track cannot be used here — `overflow: hidden` removes
              the min-content floor, so it resolves to zero in a shrink-to-fit
              container and the fragments start collapsed. */}
          <span className="th-slogan-drop" style={{ "--w": "1.302em", animationDelay: "2200ms" } as React.CSSProperties}>cly</span>
          <span className="th-slogan-drop" style={{ "--w": "0.239em", animationDelay: "2430ms" } as React.CSSProperties}>&nbsp;</span>
          <span className="th-slogan-drop" style={{ "--w": "0.636em", animationDelay: "2600ms" } as React.CSSProperties}>fi</span>
          <span>t</span>
        </span>
      </span>
    </h1>
  );
}
