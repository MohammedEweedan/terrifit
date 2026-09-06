/**
 * Which announcement the reader has dismissed, as an external store.
 *
 * `useSyncExternalStore` rather than `useState` in an effect, which is the
 * project's rule and the right shape here for the same reason as
 * `accent-store.ts`: the value lives in `localStorage`, a browser system React
 * does not own, and reading it in an effect is a cascading render the linter
 * rejects.
 *
 * The bar deliberately renders *visible* on the server and on the hydrating
 * pass, then hides itself once the client snapshot is read. Starting hidden
 * would avoid a flash for returning readers at the cost of dropping the bar in
 * after hydration and shoving the page down on every first visit — a layout
 * shift for everyone to spare a blink for some.
 */

const STORAGE_KEY = "terrifit.announcement.dismissed";

const listeners = new Set<() => void>();

/** Cached so `getSnapshot` returns a stable value between writes. */
let current: string | null = null;
let read = false;

function fromStorage(): string | null {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    // Private window, or site data blocked. Showing the bar is the right
    // failure: a missed dismissal costs less than a missed launch.
    return null;
  }
}

export function subscribeDismissed(listener: () => void): () => void {
  listeners.add(listener);
  // Dismissing in one tab should dismiss in the others.
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) {
      read = false;
      listener();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function getDismissed(): string | null {
  if (!read) {
    current = fromStorage();
    read = true;
  }
  return current;
}

/** The server has no storage, so nothing is dismissed and the bar shows. */
export function getServerDismissed(): string | null {
  return null;
}

export function dismiss(id: string): void {
  current = id;
  read = true;
  try {
    window.localStorage.setItem(STORAGE_KEY, id);
  } catch {
    // Dismissal is a convenience; never fail over it.
  }
  for (const listener of listeners) listener();
}
