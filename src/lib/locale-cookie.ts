import { LOCALE_COOKIE } from "@/i18n/config";

const ONE_YEAR = 60 * 60 * 24 * 365;

/**
 * Remembers an explicit language choice for a year.
 *
 * Lives outside the component because writing to `document.cookie` is a
 * mutation of something React does not own, which the compiler's immutability
 * rule rejects inside a component body — and because the proxy, not the client,
 * is what reads it back.
 */
export function rememberLocale(locale: string): void {
  try {
    document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=${ONE_YEAR}; samesite=lax`;
  } catch {
    // Cookies blocked. The navigation still works; the choice just is not kept.
  }
}
