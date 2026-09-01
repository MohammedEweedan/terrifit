import Svg, { Path } from "react-native-svg";

/**
 * The Terrifit mark, identical to the one on the site.
 *
 * A 2×2 tile grid with one corner of every tile rounded and each tile's
 * rounded corner turned 90° from the last, so the grid reads as still at a
 * glance and as turning when you look. The path data is copied verbatim from
 * `src/components/brand/TerrifitMark.tsx` — if one changes, both do.
 */
export function TerrifitMark({ size = 20, colour = "#ff4d16" }: { size?: number; colour?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={colour}>
      {/* Top-left tile — rounded corner at top-right. */}
      <Path d="M3 1.5H5A5.5 5.5 0 0 1 10.5 7V9A1.5 1.5 0 0 1 9 10.5H3A1.5 1.5 0 0 1 1.5 9V3A1.5 1.5 0 0 1 3 1.5Z" />
      {/* Top-right tile — rounded corner at bottom-right. */}
      <Path d="M15 1.5H21A1.5 1.5 0 0 1 22.5 3V5A5.5 5.5 0 0 1 17 10.5H15A1.5 1.5 0 0 1 13.5 9V3A1.5 1.5 0 0 1 15 1.5Z" />
      {/* Bottom-right tile — rounded corner at bottom-left. */}
      <Path d="M15 13.5H21A1.5 1.5 0 0 1 22.5 15V21A1.5 1.5 0 0 1 21 22.5H19A5.5 5.5 0 0 1 13.5 17V15A1.5 1.5 0 0 1 15 13.5Z" />
      {/* Bottom-left tile — rounded corner at top-left. */}
      <Path d="M7 13.5H9A1.5 1.5 0 0 1 10.5 15V21A1.5 1.5 0 0 1 9 22.5H3A1.5 1.5 0 0 1 1.5 21V19A5.5 5.5 0 0 1 7 13.5Z" />
    </Svg>
  );
}
