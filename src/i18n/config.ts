export const LOCALE_COOKIE = "ryvn.locale";

export const locales = [
  "en",
  "es",
  "ar",
  "fr",
  "de",
  "nl",
  "pt",
  "it",
  "tr",
  "ru",
] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

export type LocaleMeta = {
  /** Name of the language, written in that language. */
  label: string;
  /** Name in English, for the switcher's secondary line. */
  englishLabel: string;
  dir: "ltr" | "rtl";
  /** BCP-47 tag used for <html lang> and all Intl formatting. */
  htmlLang: string;
};

export const localeMeta: Record<Locale, LocaleMeta> = {
  en: { label: "English", englishLabel: "English", dir: "ltr", htmlLang: "en" },
  es: { label: "Español", englishLabel: "Spanish", dir: "ltr", htmlLang: "es" },
  ar: { label: "العربية", englishLabel: "Arabic", dir: "rtl", htmlLang: "ar" },
  fr: { label: "Français", englishLabel: "French", dir: "ltr", htmlLang: "fr" },
  de: { label: "Deutsch", englishLabel: "German", dir: "ltr", htmlLang: "de" },
  nl: { label: "Nederlands", englishLabel: "Dutch", dir: "ltr", htmlLang: "nl" },
  pt: { label: "Português", englishLabel: "Portuguese", dir: "ltr", htmlLang: "pt" },
  it: { label: "Italiano", englishLabel: "Italian", dir: "ltr", htmlLang: "it" },
  tr: { label: "Türkçe", englishLabel: "Turkish", dir: "ltr", htmlLang: "tr" },
  ru: { label: "Русский", englishLabel: "Russian", dir: "ltr", htmlLang: "ru" },
};

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

/**
 * Picks the best supported locale from an Accept-Language header.
 * Falls back to the default rather than guessing from IP.
 */
export function resolveLocale(acceptLanguage: string | null): Locale {
  if (!acceptLanguage) return defaultLocale;

  const ranked = acceptLanguage
    .split(",")
    .map((part) => {
      const [tag, ...params] = part.trim().split(";");
      const q = params.find((p) => p.trim().startsWith("q="));
      return {
        base: tag.trim().toLowerCase().split("-")[0],
        quality: q ? Number.parseFloat(q.split("=")[1]) || 0 : 1,
      };
    })
    .sort((a, b) => b.quality - a.quality);

  for (const { base } of ranked) {
    if (isLocale(base)) return base;
  }
  return defaultLocale;
}

/**
 * Persona sites live on their own subdomains. The proxy maps the host to one
 * of these keys and rewrites to the matching route, so `coach.ryvn.app` and
 * `ryvn.app/coach` render the same page without duplicating routes.
 */
export const personas = ["creator", "coach", "nutritionist", "brand"] as const;
export type Persona = (typeof personas)[number];

export const personaSubdomains: Record<string, Persona> = {
  creator: "creator",
  coach: "coach",
  nutri: "nutritionist",
  sup: "brand",
};

/** Reverse lookup: which subdomain fronts a given persona. */
export const personaHosts: Record<Persona, string> = {
  creator: "creator",
  coach: "coach",
  nutritionist: "nutri",
  brand: "sup",
};

export function isPersona(value: string): value is Persona {
  return (personas as readonly string[]).includes(value);
}
