import { prisma } from "@/lib/db";

/**
 * Delivery for the notifications we already record.
 *
 * Rows go into `Notification` regardless — the in-app list is the source of
 * truth and works with no push permission at all. This just also puts the
 * important ones on the lock screen. A send that fails is logged and dropped:
 * a missed push must never fail the action that caused it.
 */
const EXPO_PUSH = "https://exp.host/--/api/v2/push/send";

type Payload = {
  userId: string;
  title: string;
  body: string;
  /** Deep-link path the notification opens, e.g. "/thread/abc". */
  path?: string;
};

export async function sendPush({ userId, title, body, path }: Payload): Promise<void> {
  const devices = await prisma.pushDevice.findMany({ where: { userId }, select: { token: true } });
  if (devices.length === 0) return;

  const messages = devices.map((device) => ({
    to: device.token,
    title,
    body,
    sound: "default",
    ...(path ? { data: { path } } : {}),
  }));

  try {
    const response = await fetch(EXPO_PUSH, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(messages),
    });

    if (!response.ok) return;

    // Expo reports per-token errors in the body. A token the device no longer
    // owns is dead forever, so it is removed rather than retried every time.
    const result = (await response.json().catch(() => null)) as {
      data?: Array<{ status?: string; details?: { error?: string } }>;
    } | null;

    const dead = (result?.data ?? [])
      .map((entry, index) =>
        entry.status === "error" && entry.details?.error === "DeviceNotRegistered"
          ? devices[index]?.token
          : null,
      )
      .filter((token): token is string => Boolean(token));

    if (dead.length > 0) {
      await prisma.pushDevice.deleteMany({ where: { token: { in: dead } } });
    }
  } catch {
    // Offline, or Expo is down. The in-app notification already exists.
  }
}

/** Writes the in-app row and pushes it, which is what every caller wants. */
export async function notify(payload: Payload & { kind: string }): Promise<void> {
  await prisma.notification.create({
    data: { userId: payload.userId, kind: payload.kind, title: payload.title, body: payload.body },
  });
  await sendPush(payload);
}
