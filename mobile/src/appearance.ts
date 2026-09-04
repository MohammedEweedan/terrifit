import { Appearance, DevSettings, NativeModules } from "react-native";
import Storage from "expo-sqlite/kv-store";
import * as SystemUI from "expo-system-ui";
import { ACCENT_KEY, APPEARANCE_KEY, TRANSITION_KEY, backgroundFor, type AccentKey, type AppearanceMode } from "./theme";
import { COVER_FADE } from "./components/ThemeTransition";

/**
 * Changes the theme and restarts the JS bundle.
 *
 * Every screen builds its StyleSheet at import time, so the palette is fixed
 * for the life of a bundle — the only honest way to switch is to load it
 * again. It is a JS-only reload: the splash shows for a moment and the app
 * comes back on the new palette, which is what a native appearance change
 * looks like anyway.
 */
export async function setAppearance(mode: AppearanceMode): Promise<void> {
  await Storage.setItem(APPEARANCE_KEY, mode);

  await beginSwap(() => {
    // Keeps native chrome (keyboards, action sheets) in step with the choice,
    // and repaints the window behind the bundle so the gap during the reload is
    // already the new colour. Deliberately deferred until the cover is opaque:
    // called up front it repainted the window instantly, and the old palette
    // flashed to the new one in full view before the swap had even started.
    // "system" means handing control back, which the types spell as null even
    // though ColorSchemeName does not admit it.
    if (mode === "system") Appearance.setColorScheme(null as unknown as "dark");
    else Appearance.setColorScheme(mode);

    // The window behind the JS. Between the reload and the new bundle's first
    // paint there is nothing on screen but this colour, so setting it to the
    // palette being moved *to* is what makes the gap invisible — left on the
    // old value the swap ended with a flash of the theme just left behind.
    void SystemUI.setBackgroundColorAsync(backgroundFor(mode)).catch(() => {});
  });
}

/**
 * Flags the swap and reloads.
 *
 * The flag is what lets the next bundle start already covered, so the reload
 * happens inside a wipe rather than as a flash of the old palette. Written
 * before the reload, cleared by `ThemeTransition` once the new palette is up.
 */
async function beginSwap(whileCovered?: () => void): Promise<void> {
  await Storage.setItem(TRANSITION_KEY, "1");
  // Long enough for the caller's cover to reach full opacity before anything
  // visible changes underneath it — see COVER_FADE, which this must outlast.
  await new Promise((resolve) => setTimeout(resolve, COVER_FADE + 90));
  whileCovered?.();
  reloadApp();
}

export function reloadApp(): void {
  if (__DEV__) {
    DevSettings.reload();
    return;
  }
  // Release builds have no DevSettings; DevLauncher exposes the same thing and
  // is present in a development build. Falling through leaves the setting
  // saved, so it applies on the next launch rather than failing silently.
  const launcher = (NativeModules as { DevLauncher?: { reload?: () => void } }).DevLauncher;
  launcher?.reload?.();
}

/**
 * Changes the accent colour. Same story as the theme: the palette is fixed for
 * the life of a bundle, so the honest way to apply it is to load a new one.
 */
export async function setAccent(key: AccentKey): Promise<void> {
  await Storage.setItem(ACCENT_KEY, key);
  // Same swap as the theme. Reloading without flagging it first would drop the
  // new bundle in uncovered, so the accent change flashed where the theme
  // change wiped.
  await beginSwap();
}

/**
 * Paints the native window to match the stored theme.
 *
 * Called once at startup. The colour compiled into the app is a single fixed
 * value, so without this a cold launch in light mode shows a dark window until
 * React paints over it — and every reload after that reopens the same gap.
 */
export function syncNativeBackground(mode: AppearanceMode): void {
  void SystemUI.setBackgroundColorAsync(backgroundFor(mode)).catch(() => {});
}
