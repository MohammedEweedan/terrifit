/**
 * The URL fragment as an external store.
 *
 * Reading `location.hash` inside an effect and calling setState is the obvious
 * way to open a modal from `/#waitlist`, and it is the wrong one: it is a
 * cascading render, and React's lint rules reject it. The fragment is external
 * state, so it is modelled as external state and read with
 * `useSyncExternalStore`, which handles the initial load, later navigations and
 * server rendering without a single setState in an effect.
 */
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

export function subscribeHash(onChange: () => void): () => void {
  listeners.add(onChange);
  // One window listener however many components subscribe.
  if (listeners.size === 1) window.addEventListener("hashchange", emit);
  return () => {
    listeners.delete(onChange);
    if (listeners.size === 0) window.removeEventListener("hashchange", emit);
  };
}

export function getHash(): string {
  return window.location.hash;
}

/** The server has no fragment; it is only ever sent to the browser. */
export function getServerHash(): string {
  return "";
}

/**
 * Drops the fragment without adding a history entry, and tells subscribers —
 * `replaceState` deliberately does not fire `hashchange`.
 */
export function clearHash(): void {
  window.history.replaceState(null, "", window.location.pathname + window.location.search);
  emit();
}
