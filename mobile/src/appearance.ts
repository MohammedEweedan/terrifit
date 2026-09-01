import { Appearance, DevSettings, NativeModules } from "react-native";
import Storage from "expo-sqlite/kv-store";
import { APPEARANCE_KEY, type AppearanceMode } from "./theme";

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

  // Keeps native chrome (keyboards, action sheets) in step with the choice.
  // "system" means handing control back, which the types spell as null even
  // though ColorSchemeName does not admit it.
  if (mode === "system") Appearance.setColorScheme(null as unknown as "dark");
  else Appearance.setColorScheme(mode);

  reload();
}

function reload(): void {
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
