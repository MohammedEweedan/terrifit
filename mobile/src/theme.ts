import { Appearance } from "react-native";
import Storage from "expo-sqlite/kv-store";

/**
 * The app's tokens, kept identical to the `.ap-` block in the web app's
 * globals.css. Two surfaces, one set of numbers — if a colour changes it
 * changes in both places or it is a bug.
 *
 * The palette is resolved once, at module load, from a synchronously readable
 * store. That matters: every screen builds its StyleSheet at import time, so a
 * value that arrives later (SecureStore is async) would be baked in wrong and
 * the app would render one theme's text on the other theme's ground. Changing
 * the setting therefore reloads the JS bundle — see `applyAppearance`.
 *
 * `DynamicColorIOS` was the obvious alternative and does not work here: under
 * the New Architecture it resolved to its light variant regardless of the trait
 * collection, even with UIUserInterfaceStyle forced to Dark, and on Android it
 * had no effect at all.
 */
export type AppearanceMode = "dark" | "light" | "system";

export const APPEARANCE_KEY = "terrifit.appearance";
export const ACCENT_KEY = "terrifit.accent";
/** Set while a palette change is mid-reload, so the new bundle knows to uncover. */
export const TRANSITION_KEY = "terrifit.themeSwap";

/**
 * The brand orange, and the colours somebody can put in its place.
 *
 * Each is given twice because the two themes need different weights of the
 * same hue: a colour bright enough to read on near-black is washed out on
 * paper, and one dark enough for paper disappears on black.
 */
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

function storedAccent(): AccentKey {
  try {
    const value = Storage.getItemSync(ACCENT_KEY);
    return ACCENTS.some((item) => item.key === value) ? (value as AccentKey) : "terrifit";
  } catch {
    return "terrifit";
  }
}

export const accentKey: AccentKey = storedAccent();

/** `#rrggbb` plus an alpha, as the rgba() the soft variants need. */
function soften(hex: string, alpha: number): string {
  const value = hex.replace("#", "");
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

const dark: Record<string, string> & {
  bg: string; surface: string; raised: string; line: string; lineStrong: string;
  ink: string; ink2: string; muted: string; accent: string; accentSoft: string; accentLine: string;
  good: string; fair: string; poor: string; sleep: string;
} = {
  bg: "#08090b",
  surface: "#121519",
  raised: "#191d23",
  line: "#22272e",
  lineStrong: "#333a44",
  ink: "#f3f5f7",
  ink2: "#a3acb6",
  muted: "#6d7681",
  accent: "#ff5a1f",
  accentSoft: "rgba(255,90,31,0.16)",
  accentLine: "rgba(255,90,31,0.42)",
  good: "#12d18e",
  fair: "#ffc53d",
  poor: "#ff5c5c",
  sleep: "#9a75ff",
};

export type Theme = typeof dark;

/** The website's light tokens, kept byte-for-byte aligned with globals.css. */
const light: Theme = {
  bg: "#f6f6f4",
  surface: "#ffffff",
  raised: "#f0f0ed",
  line: "#e4e4e0",
  lineStrong: "#cdcdc7",
  ink: "#0a0b0d",
  ink2: "#545b64",
  muted: "#838a93",
  accent: "#c2410c",
  accentSoft: "rgba(194,65,12,0.09)",
  accentLine: "rgba(194,65,12,0.28)",
  good: "#05a36c",
  fair: "#a16207",
  poor: "#d63b3b",
  sleep: "#6d47d6",
};

function storedMode(): AppearanceMode {
  try {
    const value = Storage.getItemSync(APPEARANCE_KEY);
    return value === "light" || value === "dark" || value === "system" ? value : "dark";
  } catch {
    // No store yet on a first run, or a device that refuses it.
    return "dark";
  }
}

export const appearanceMode: AppearanceMode = storedMode();

/**
 * The type stack, matched to the website.
 *
 * Inter for everything that is read, Anton for display figures, and Noto Kufi
 * Arabic for Arabic — the same three faces `src/app/[locale]/layout.tsx` loads,
 * so the app and the site are recognisably one product rather than two designs
 * that happen to share a colour.
 *
 * Arabic is not a fallback here. Inter has no Arabic coverage, so an Arabic
 * string set in Inter silently renders in whatever the OS substitutes — which
 * is a different weight, a different height, and obviously not the brand.
 */
function storedLocale(): string {
  try {
    return Storage.getItemSync("terrifit.locale") ?? "en";
  } catch {
    return "en";
  }
}

/**
 * Arabic gets its own cuts because Inter has no Arabic glyphs — a string set in
 * Inter falls back to whatever the OS substitutes, which is a different weight
 * and obviously not the brand.
 *
 * Resolved at module load, like the palette. That is not a compromise here:
 * Arabic is the only script that differs and it is also the only right-to-left
 * locale, so switching to or from it already reloads the bundle for
 * `I18nManager`. Every other language change needs no new font at all.
 */
const isArabic = storedLocale() === "ar";

export const fonts = {
  body: isArabic ? "NotoKufiArabic_400Regular" : "Inter_400Regular",
  medium: isArabic ? "NotoKufiArabic_500Medium" : "Inter_500Medium",
  semibold: isArabic ? "NotoKufiArabic_500Medium" : "Inter_600SemiBold",
  bold: isArabic ? "NotoKufiArabic_700Bold" : "Inter_700Bold",
  black: isArabic ? "NotoKufiArabic_900Black" : "Inter_900Black",
  // Anton has no Arabic, so display figures there fall to the heaviest Kufi.
  display: isArabic ? "NotoKufiArabic_900Black" : "Anton_400Regular",
} as const;

export const scheme: "light" | "dark" =
  appearanceMode === "system" ? (Appearance.getColorScheme() === "light" ? "light" : "dark") : appearanceMode;

const base = scheme === "light" ? light : dark;

const chosenAccent = ACCENTS.find((item) => item.key === accentKey) ?? ACCENTS[0];
const accent = scheme === "light" ? chosenAccent.light : chosenAccent.dark;

/**
 * The palette, with the member's accent swapped in.
 *
 * Resolved once at module load like everything else here, because a
 * StyleSheet built at import time cannot be repainted later — changing it
 * reloads the bundle, the same as changing light and dark.
 */
/**
 * The background a given mode resolves to, without switching to it.
 *
 * The transition cover has to be painted in the palette being moved *to* —
 * otherwise the outgoing half is dark, the incoming half is light, and the
 * wipe that was meant to hide the reload contains a flash of its own.
 */
export function backgroundFor(mode: AppearanceMode): string {
  const target = mode === "system" ? (Appearance.getColorScheme() === "light" ? "light" : "dark") : mode;
  return target === "light" ? light.bg : dark.bg;
}

export const theme: Theme = {
  ...base,
  accent,
  accentSoft: soften(accent, scheme === "light" ? 0.1 : 0.16),
  /** The accent at border strength. Used for outlines that should read as brand. */
  accentLine: soften(accent, 0.42),
};

export type Band = "good" | "fair" | "poor" | "unknown";

/** Readiness has its own ramp; the brand orange is for actions and the T Score. */
export function bandColour(band: Band): string {
  if (band === "good") return theme.good;
  if (band === "fair") return theme.fair;
  if (band === "poor") return theme.poor;
  return theme.accent;
}

export const display = "Anton_400Regular";
/** The same type system used by the website. */
export const body = "Inter_400Regular";
export const bodyMedium = "Inter_500Medium";
export const bodySemibold = "Inter_600SemiBold";
export const bodyBold = "Inter_700Bold";
export const bodyBlack = "Inter_900Black";
export const arabic = "NotoKufiArabic_500Medium";
export const arabicBold = "NotoKufiArabic_700Bold";
export const arabicBlack = "NotoKufiArabic_900Black";
