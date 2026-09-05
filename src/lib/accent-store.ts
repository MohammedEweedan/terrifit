import { ACCENTS, ACCENT_KEY, type AccentKey } from "./accents";

/**
 * The chosen app colour, as an external store.
 *
 * `useSyncExternalStore` rather than `useState` in an effect, which is the
 * project's rule and the right one here: the value lives in `localStorage`,
 * which is a browser system React does not own. Reading it in an effect and
 * calling `setState` would render once with the default, once with the stored
 * value, and flash the wrong screenshot in between.
 *
 * This preference only ever picks which app capture is displayed. It never
 * touches the site's own accent — see `accents.ts`.
 */

const listeners = new Set<() => void>();

/** Cached so `getSnapshot` returns a stable value between writes. */
let current: AccentKey | null = null;

function read(): AccentKey {
  try {
    const stored = window.localStorage.getItem(ACCENT_KEY);
    if (stored && ACCENTS.some((accent) => accent.key === stored)) return stored as AccentKey;
  } catch {
    // Private window, or site data blocked.
  }
  return "terrifit";
}

export function subscribeAccent(listener: () => void): () => void {
  listeners.add(listener);
  // Another tab changing it should change this one too.
  const onStorage = (event: StorageEvent) => {
    if (event.key === ACCENT_KEY) {
      current = null;
      listener();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function getAccent(): AccentKey {
  if (current === null) current = read();
  return current;
}

/** The server has no storage, so it renders the brand default. */
export function getServerAccent(): AccentKey {
  return "terrifit";
}

export function setAccent(next: AccentKey): void {
  current = next;
  try {
    window.localStorage.setItem(ACCENT_KEY, next);
  } catch {
    // The choice still applies for this visit; only the memory is lost.
  }
  for (const listener of listeners) listener();
}
