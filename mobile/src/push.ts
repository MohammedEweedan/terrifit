import { Platform } from "react-native";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { API_BASE } from "./api";

/**
 * Push registration.
 *
 * Notifications are written server-side whether or not this succeeds — the
 * in-app list is the source of truth — so every failure here is silent by
 * design. A simulator cannot receive push at all, which is why the device
 * check comes first.
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function registerForPush(token: string): Promise<string | null> {
  if (!Device.isDevice) return null;

  const existing = await Notifications.getPermissionsAsync();
  let granted = existing.granted;
  if (!granted && existing.canAskAgain) {
    granted = (await Notifications.requestPermissionsAsync()).granted;
  }
  if (!granted) return null;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "Terrifit",
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId ?? undefined;

  const push = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined).catch(
    () => null,
  );
  if (!push) return null;

  await fetch(`${API_BASE}/api/app/push`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ token: push.data, platform: Platform.OS === "android" ? "android" : "ios" }),
  }).catch(() => {});

  return push.data;
}

/** Called on sign-out so a shared phone stops showing someone else's alerts. */
export async function unregisterPush(token: string, pushToken: string | null): Promise<void> {
  await fetch(`${API_BASE}/api/app/push`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(pushToken ? { token: pushToken } : {}),
  }).catch(() => {});
}
