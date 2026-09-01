/**
 * Routes still served by the generic `[destination]` page.
 *
 * Band, Maps, Creators, Shop, Contact and the account pages have their own
 * route folders now, and
 * a static segment wins over `[destination]`, so leaving them in this list would
 * only make `generateStaticParams` pre-render pages that never get served.
 */
export const destinations = [
  "platform",
  "about", "careers", "press", "support",
] as const;

/**
 * The legal slugs used to be served here as marketing pages — /privacy said
 * "Your data. Private by default." and contained no policy. App Store review
 * and UK GDPR both want one canonical policy URL, and two pages both calling
 * themselves Privacy is worse than either alone, so these now redirect to the
 * real documents under /legal.
 */
export const legalRedirects = ["privacy", "terms", "health", "affiliate"] as const;

export type Destination = (typeof destinations)[number];

export function isDestination(value: string): value is Destination {
  return (destinations as readonly string[]).includes(value);
}
