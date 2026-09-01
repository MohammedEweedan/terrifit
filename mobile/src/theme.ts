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

const dark: Record<string, string> & {
  bg: string; surface: string; raised: string; line: string; lineStrong: string;
  ink: string; ink2: string; muted: string; accent: string; accentSoft: string;
  good: string; fair: string; poor: string; sleep: string;
} = {
  bg: "#08090a",
  surface: "#121417",
  raised: "#181b1f",
  line: "#22262b",
  lineStrong: "#333941",
  ink: "#f2f4f6",
  ink2: "#9aa2ab",
  muted: "#6f767e",
  accent: "#ff5a1f",
  accentSoft: "rgba(255,90,31,0.16)",
  good: "#45c98a",
  fair: "#e8b23c",
  poor: "#f0654f",
  sleep: "#9a75ff",
};

export type Theme = typeof dark;

/**
 * Paper, not white. The light theme is the brand's paper stock — a warm off-white
 * with warm greys — so it reads as the same brand rather than the dark theme
 * with the lights turned on.
 */
const light: Theme = {
  bg: "#f5f2ec",
  surface: "#ffffff",
  raised: "#faf8f4",
  line: "#e4ded5",
  lineStrong: "#cbc3b8",
  ink: "#121212",
  ink2: "#5f5c57",
  muted: "#858079",
  accent: "#e8480f",
  accentSoft: "rgba(232,72,15,0.10)",
  good: "#1f9c63",
  fair: "#b7801d",
  poor: "#c9432c",
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

export const scheme: "light" | "dark" =
  appearanceMode === "system" ? (Appearance.getColorScheme() === "light" ? "light" : "dark") : appearanceMode;

export const theme = scheme === "light" ? light : dark;

export type Band = "good" | "fair" | "poor" | "unknown";

/** Readiness has its own ramp; the brand orange is for actions and the T Score. */
export function bandColour(band: Band): string {
  if (band === "good") return theme.good;
  if (band === "fair") return theme.fair;
  if (band === "poor") return theme.poor;
  return theme.accent;
}

export const display = "Anton_400Regular";
