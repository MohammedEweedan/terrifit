/**
 * Routes still served by the generic `[destination]` page.
 *
 * Band, Maps, Creators, Shop, Contact and the account pages have their own
 * route folders now, and
 * a static segment wins over `[destination]`, so leaving them in this list would
 * only make `generateStaticParams` pre-render pages that never get served.
 */
export const destinations = [
  "about", "careers", "press", "support",
] as const;

/**
 * Moved rather than removed. "Platform" was renamed "App" in the navigation,
 * and a URL that disagrees with the link that reached it is a small dishonesty
 * worth one redirect to avoid. The signed-in web app moved to /dashboard to
 * free the path.
 */
export const movedDestinations: Record<string, string> = { platform: "app" };

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
