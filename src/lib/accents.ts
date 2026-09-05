/**
 * The accent palette, shared with the app.
 *
 * Keys and hex values are byte-for-byte the same as `ACCENTS` in
 * `mobile/src/theme.ts`. Somebody who sets their app to Mint and then opens the
 * site should find the site is Mint — two products that share a brand should
 * not disagree about what Mint is.
 *
 * Each accent carries a dark and a light value because the site has both
 * grounds, and a colour that reads well on near-black is usually too pale on
 * paper. These are the same pairs the app resolves between.
 */
export const ACCENT_KEY = "terrifit.accent";

export const ACCENTS = [
  { key: "terrifit", name: "Terrifit", dark: "#ff5a1f", light: "#c2410c" },
  { key: "ember", name: "Ember", dark: "#ff3b30", light: "#d92c22" },
  { key: "amber", name: "Amber", dark: "#ffb020", light: "#c97f00" },
  { key: "lime", name: "Lime", dark: "#8ee63f", light: "#4f8f16" },
  { key: "mint", name: "Mint", dark: "#2ee6a8", light: "#0f9c6d" },
  { key: "sky", name: "Sky", dark: "#3ba9ff", light: "#0d72c4" },
  { key: "indigo", name: "Indigo", dark: "#7b7bff", light: "#4b46d6" },
  { key: "violet", name: "Violet", dark: "#b06bff", light: "#7a34c9" },
  { key: "magenta", name: "Magenta", dark: "#ff5ea8", light: "#cc1f6e" },
  { key: "steel", name: "Steel", dark: "#9aa8b8", light: "#5a6673" },
] as const;

export type AccentKey = (typeof ACCENTS)[number]["key"];

export function findAccent(key: string | null | undefined) {
  return ACCENTS.find((accent) => accent.key === key) ?? ACCENTS[0];
}

/** `#rrggbb` plus an alpha, as the rgba() the soft variants need. */
export function soften(hex: string, alpha: number): string {
  const value = hex.replace("#", "");
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

/**
 * There is deliberately no `applyAccent` here any more.
 *
 * The picker changes which app screenshot is shown and nothing else. It used
 * to repaint the site's own accent tokens as well, which meant picking Mint
 * turned one landing-page section green and left everything around it orange
 * — a picker that half-works reads as a bug, and a brand that follows a
 * visitor preference is not a brand. The app's colour is the app's; the site
 * stays Terrifit orange.
 */
