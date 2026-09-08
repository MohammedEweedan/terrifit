/**
 * Validates a `?next=` destination before redirecting to it.
 *
 * A sign-in form that forwards to whatever the query string says is an open
 * redirect: `/signin?next=https://evil.example` sends someone who trusted the
 * link straight off the site, still believing they are on it. Only same-site
 * absolute paths are allowed through, and everything else falls back to the
 * caller's default.
 *
 * `//host` is rejected explicitly — it looks relative but browsers treat it as
 * protocol-relative and resolve it to another origin.
 */
export function safeNext(value: string | null | undefined, fallback: string): string {
  if (!value) return fallback;
  const next = value.trim();
  if (!next.startsWith("/")) return fallback;
  if (next.startsWith("//") || next.startsWith("/\\")) return fallback;
  // A scheme anywhere before the first slash-segment means it is not a path.
  if (/^[a-z][a-z0-9+.-]*:/i.test(next)) return fallback;
  if (next.includes("\n") || next.includes("\r")) return fallback;
  return next;
}
