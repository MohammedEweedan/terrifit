import { useSyncExternalStore } from "react";

/** A store that never changes: the value is read once per render, not pushed. */
const subscribeNever = () => () => {};

/**
 * Reads a browser-only value during render instead of copying it into state
 * inside an effect.
 *
 * `window.location`, `matchMedia`, feature detection and the like are external
 * state. Mirroring them with `useState` + `useEffect` is a cascading render and
 * React's lint rules reject it; `useSyncExternalStore` is the sanctioned way to
 * read something the server cannot see, and it handles hydration itself.
 *
 * `read` must return a primitive, or a value that is referentially stable
 * between calls — React compares snapshots by identity.
 */
export function useClientValue<T>(read: () => T, serverValue: T): T {
  return useSyncExternalStore(subscribeNever, read, () => serverValue);
}

/** True once the browser has taken over from the server-rendered markup. */
export function useHydrated(): boolean {
  return useClientValue(() => true, false);
}
