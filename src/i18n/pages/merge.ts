import type { PagesCopy } from "./en";

/**
 * A translation of any depth.
 *
 * The launch dictionaries are all-or-nothing: a locale either has a complete
 * copy deck or falls back to English wholesale. That works when a deck is
 * translated in one go, and badly when it isn't — a market that has had its
 * checkout and its metadata translated should get those in its own language
 * even while the long-form marketing prose is still English.
 *
 * So a page translation is a deep partial, merged over English at read time.
 * A missing key is English; a present key is the translation. Nothing can be
 * blank, and nothing has to wait for the whole file.
 */
export type PagesTranslation = DeepPartial<PagesCopy>;

type DeepPartial<T> = T extends readonly (infer Item)[]
  ? ReadonlyArray<DeepPartial<Item>>
  : T extends object
    ? { [K in keyof T]?: DeepPartial<T[K]> }
    : T;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Objects merge key by key; arrays merge by index, so a locale can translate
 * the first three items of a list and leave the rest in English rather than
 * having to restate the whole array to change one label.
 */
function mergeValue(base: unknown, override: unknown): unknown {
  if (override === undefined) return base;

  if (Array.isArray(base) && Array.isArray(override)) {
    return base.map((item, index) =>
      index < override.length ? mergeValue(item, override[index]) : item,
    );
  }

  if (isPlainObject(base) && isPlainObject(override)) {
    const merged: Record<string, unknown> = { ...base };
    for (const key of Object.keys(override)) {
      merged[key] = mergeValue(base[key], override[key]);
    }
    return merged;
  }

  return override;
}

export function mergeCopy(base: PagesCopy, override: PagesTranslation | undefined): PagesCopy {
  if (!override) return base;
  return mergeValue(base, override) as PagesCopy;
}
