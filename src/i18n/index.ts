import { en } from "./dictionaries/en";
import type { Dictionary } from "./dictionaries/en";
import type { Locale } from "./config";

import ar from "./dictionaries/ar.json";
import es from "./dictionaries/es.json";
import fr from "./dictionaries/fr.json";
import de from "./dictionaries/de.json";
import nl from "./dictionaries/nl.json";
import pt from "./dictionaries/pt.json";
import it from "./dictionaries/it.json";
import tr from "./dictionaries/tr.json";
import ru from "./dictionaries/ru.json";

export type { Dictionary } from "./dictionaries/en";
export * from "./config";

/**
 * English is the source of truth: it is TypeScript, and its shape *is* the
 * Dictionary type. Every other locale is JSON data annotated as Dictionary,
 * so a missing or renamed key fails the build rather than shipping blank.
 *
 * The map is partial on purpose — a locale with no dictionary yet falls back
 * to English, so translations can land one at a time without a code change.
 */
const dictionaries: Partial<Record<Locale, Dictionary>> = {
  en,
  ar,
  es,
  fr,
  de,
  nl,
  pt,
  it,
  tr,
  ru,
};

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale] ?? en;
}

/** Whether a locale has its own copy, rather than falling back to English. */
export function isTranslated(locale: Locale): boolean {
  return Boolean(dictionaries[locale]);
}
