import { ImageResponse } from "next/og";

// Apple's touch icon must be a raster image, so the mark is redrawn here rather
// than imported from the SVG component. Keep the four paths in sync with
// `src/components/brand/TerrifitMark.tsx`.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

const TILES = [
  "M3 1.5H5A5.5 5.5 0 0 1 10.5 7V9A1.5 1.5 0 0 1 9 10.5H3A1.5 1.5 0 0 1 1.5 9V3A1.5 1.5 0 0 1 3 1.5Z",
  "M15 1.5H21A1.5 1.5 0 0 1 22.5 3V5A5.5 5.5 0 0 1 17 10.5H15A1.5 1.5 0 0 1 13.5 9V3A1.5 1.5 0 0 1 15 1.5Z",
  "M15 13.5H21A1.5 1.5 0 0 1 22.5 15V21A1.5 1.5 0 0 1 21 22.5H19A5.5 5.5 0 0 1 13.5 17V15A1.5 1.5 0 0 1 15 13.5Z",
  "M7 13.5H9A1.5 1.5 0 0 1 10.5 15V21A1.5 1.5 0 0 1 9 22.5H3A1.5 1.5 0 0 1 1.5 21V19A5.5 5.5 0 0 1 7 13.5Z",
];

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0b0b0b",
        }}
      >
        <svg width="112" height="112" viewBox="0 0 24 24" fill="#ff4d16">
          {TILES.map((d) => (
            <path key={d} d={d} />
          ))}
        </svg>
      </div>
    ),
    size,
  );
}
