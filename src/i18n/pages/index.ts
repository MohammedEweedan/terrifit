import type { Locale } from "../config";
import { en, type PagesCopy } from "./en";
import { mergeCopy, type PagesTranslation } from "./merge";
import { es } from "./es";
import { ar } from "./ar";
import { fr } from "./fr";
import { de } from "./de";
import { nl } from "./nl";
import { pt } from "./pt";
import { it } from "./it";
import { tr } from "./tr";
import { ru } from "./ru";

export type { PagesCopy } from "./en";
export type { PagesTranslation } from "./merge";

/**
 * Copy for the Band, Maps, Creators, Contact, Shop, search and account pages.
 *
 * Each locale supplies a deep partial that is merged over English, so a market
 * gets its own language for every key it has and English for the rest. See
 * `merge.ts` for why that beats the all-or-nothing fallback the launch
 * dictionaries use.
 */
const translations: Partial<Record<Locale, PagesTranslation>> = {
  es,
  ar,
  fr,
  de,
  nl,
  pt,
  it,
  tr,
  ru,
};

// Merging is pure and the inputs are module constants, so it is done once per
// locale rather than on every render.
const resolved = new Map<Locale, PagesCopy>();

export function getPagesCopy(locale: Locale): PagesCopy {
  const cached = resolved.get(locale);
  if (cached) return cached;
  const copy = mergeCopy(en, translations[locale]);
  resolved.set(locale, copy);
  return copy;
}

/** Roughly how much of a locale's page copy is its own rather than English. */
export function translationCoverage(locale: Locale): number {
  const override = translations[locale];
  if (!override) return 0;
  return countStrings(override) / countStrings(en);
}

function countStrings(value: unknown): number {
  if (typeof value === "string") return 1;
  if (Array.isArray(value)) return value.reduce<number>((total, item) => total + countStrings(item), 0);
  if (typeof value === "object" && value !== null) {
    return Object.values(value).reduce<number>((total, item) => total + countStrings(item), 0);
  }
  return 0;
}
