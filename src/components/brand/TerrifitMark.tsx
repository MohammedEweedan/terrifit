/**
 * The Terrifit mark.
 *
 * A 2×2 tile grid — the same four-square silhouette the brand already used —
 * with one corner of every tile rounded and each tile's rounded corner turned
 * 90° from the last. The result is rotationally symmetric: the grid reads as
 * still when you glance at it and as turning when you look, which is the whole
 * proposition (four states of one person, always in motion).
 *
 * It is a single flat path set with no strokes, so it survives being rendered
 * at 14px in a header, punched out of a favicon, or blown up across a footer.
 * The orange is baked into the fill rather than inherited: the mark sits inside
 * a white wordmark in the header and a paper footer, and in both it must read
 * orange — inheriting `currentColor` there would silently paint it white.
 *
 * The same geometry is drawn in `mobile/src/components/TerrifitMark.tsx` and in
 * `src/app/icon.svg`. If one changes, all three do.
 */
export function TerrifitMark({
  size = 20,
  className,
  title,
}: {
  size?: number | string;
  className?: string;
  title?: string;
}) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="#ff4d16"
      role={title ? "img" : "presentation"}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      focusable="false"
    >
      {title ? <title>{title}</title> : null}
      {/* Top-left tile — rounded corner at top-right. */}
      <path d="M3 1.5H5A5.5 5.5 0 0 1 10.5 7V9A1.5 1.5 0 0 1 9 10.5H3A1.5 1.5 0 0 1 1.5 9V3A1.5 1.5 0 0 1 3 1.5Z" />
      {/* Top-right tile — rounded corner at bottom-right. */}
      <path d="M15 1.5H21A1.5 1.5 0 0 1 22.5 3V5A5.5 5.5 0 0 1 17 10.5H15A1.5 1.5 0 0 1 13.5 9V3A1.5 1.5 0 0 1 15 1.5Z" />
      {/* Bottom-right tile — rounded corner at bottom-left. */}
      <path d="M15 13.5H21A1.5 1.5 0 0 1 22.5 15V21A1.5 1.5 0 0 1 21 22.5H19A5.5 5.5 0 0 1 13.5 17V15A1.5 1.5 0 0 1 15 13.5Z" />
      {/* Bottom-left tile — rounded corner at top-left. */}
      <path d="M7 13.5H9A1.5 1.5 0 0 1 10.5 15V21A1.5 1.5 0 0 1 9 22.5H3A1.5 1.5 0 0 1 1.5 21V19A5.5 5.5 0 0 1 7 13.5Z" />
    </svg>
  );
}
