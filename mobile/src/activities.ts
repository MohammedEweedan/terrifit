import { theme } from "./theme";

/**
 * The outdoor activities the app can record.
 *
 * Each one differs in the only ways that matter on screen: whether the headline
 * figure is pace or speed, whether climbing is worth showing, and whether GPS
 * is honestly capable of measuring it at all.
 */

export type ActivityKind = "run" | "walk" | "hike" | "ride" | "swim" | "other";

export type ActivityDefinition = {
  kind: ActivityKind;
  label: string;
  /** One line under the name in the picker. */
  note: string;
  /** Pace suits anything on foot; speed suits anything with wheels. */
  headline: "pace" | "speed";
  /** Whether to show ascent. Pointless on a flat road ride, central on a hike. */
  showAscent: boolean;
  colour: string;
  /**
   * Said plainly before the activity starts, where GPS cannot do what somebody
   * would reasonably assume. Silence here would be a claim.
   */
  caveat?: string;
};

export const ACTIVITIES: ActivityDefinition[] = [
  {
    kind: "run", label: "Run", note: "Pace, distance and the route you took.",
    headline: "pace", showAscent: true, colour: theme.accent,
  },
  {
    kind: "walk", label: "Walk", note: "The same, at walking pace.",
    headline: "pace", showAscent: false, colour: theme.good,
  },
  {
    kind: "hike", label: "Hike", note: "Distance and climb, on and off trail.",
    headline: "pace", showAscent: true, colour: theme.fair,
  },
  {
    kind: "ride", label: "Ride", note: "Speed, distance and elevation.",
    headline: "speed", showAscent: true, colour: theme.sleep,
  },
  {
    kind: "swim", label: "Open water swim", note: "Distance and pace in open water.",
    headline: "pace", showAscent: false, colour: theme.sleep,
    // Being straight about this costs one line and saves a one-star review.
    caveat: "GPS does not work underwater or in a pool. This is for open water, and the line is drawn from fixes taken when your wrist breaks the surface.",
  },
  {
    kind: "other", label: "Something else", note: "Anything outdoors with a route.",
    headline: "speed", showAscent: true, colour: theme.ink2,
  },
];

export function findActivity(kind: string | undefined): ActivityDefinition {
  return ACTIVITIES.find((item) => item.kind === kind) ?? ACTIVITIES[0];
}
