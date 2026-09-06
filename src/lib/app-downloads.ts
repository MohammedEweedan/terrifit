/** Only real, configured store listings become download links. */
function storeLink(raw: string | undefined, host: string): string | null {
  if (!raw) return null;
  try { const url = new URL(raw); return url.protocol === "https:" && url.hostname === host ? url.toString() : null; } catch { return null; }
}
export function getAppDownloads() {
  return { ios: storeLink(process.env.APP_STORE_URL, "apps.apple.com"), android: storeLink(process.env.PLAY_STORE_URL, "play.google.com") };
}
export type AppDownloads = ReturnType<typeof getAppDownloads>;
