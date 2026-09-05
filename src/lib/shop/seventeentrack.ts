/**
 * 17TRACK, as the universal fallback for a parcel nobody else can find.
 *
 * `carriers.ts` holds seventeen carriers with good tracking pages, and those
 * stay the first choice — a Royal Mail number belongs on Royal Mail's own site,
 * not inside an aggregator. But V1 units ship from Shenzhen, and a China-origin
 * parcel routinely moves through carriers that list does not contain: China
 * Post, Yanwen, 4PX, YunExpress, a local last-mile handler nobody has heard of.
 * Without a fallback, those orders show a tracking number and nowhere to put it,
 * which is the single most common "where is my order" support ticket.
 *
 * 17TRACK covers 2,500+ carriers and detects the carrier from the number
 * itself, so it needs no configuration to be useful. The API is optional: with
 * no key the tracking *link* still works, which is most of the value.
 */

/** Their public tracking page. Detects the carrier from the number. */
const PUBLIC_TRACKING = "https://t.17track.net/en#nums=";

const API_ROOT = "https://api.17track.net/track/v2.2";

/**
 * A link to 17TRACK for any tracking number.
 *
 * Always available, no key required. This is what makes the fallback worth
 * having at all — the expensive part of tracking is the API, and the part
 * customers actually use is a working link.
 */
export function universalTrackingUrl(number: string | null | undefined): string | null {
  const trimmed = number?.trim();
  if (!trimmed) return null;
  return `${PUBLIC_TRACKING}${encodeURIComponent(trimmed)}`;
}

export function apiConfigured(): boolean {
  return Boolean(process.env.SEVENTEENTRACK_API_KEY?.trim());
}

/** 17TRACK's numeric status codes, reduced to the states the app renders. */
export type TrackStage =
  | "not_found"
  | "in_transit"
  | "out_for_delivery"
  | "delivered"
  | "exception"
  | "expired";

export type TrackEvent = {
  at: string;
  description: string;
  location: string | null;
};

export type TrackInfo = {
  stage: TrackStage;
  /** The carrier 17TRACK identified, which we may not have known. */
  carrier: string | null;
  events: TrackEvent[];
  /** Their estimate, when the carrier provides one. Often absent. */
  estimatedDelivery: string | null;
};

/**
 * Their `latest_status.status` strings, mapped to our stages.
 *
 * Anything unrecognised becomes `in_transit` rather than throwing: a parcel
 * with an unfamiliar status is still a parcel that is moving, and a tracking
 * page that errors is worse than one that is vague.
 */
function stageFor(status: string | undefined): TrackStage {
  switch ((status ?? "").toLowerCase()) {
    case "notfound":
      return "not_found";
    case "delivered":
      return "delivered";
    case "outfordelivery":
      return "out_for_delivery";
    case "exception":
    case "undelivered":
      return "exception";
    case "expired":
      return "expired";
    default:
      return "in_transit";
  }
}

/**
 * Register a number so 17TRACK starts polling the carrier for it.
 *
 * Their API returns nothing useful until a number is registered, and
 * registering twice is harmless — an already-registered number comes back as a
 * rejected entry, which is not an error worth surfacing.
 */
export async function registerTracking(number: string, carrierCode?: number): Promise<boolean> {
  const key = process.env.SEVENTEENTRACK_API_KEY?.trim();
  if (!key || !number.trim()) return false;

  try {
    const response = await fetch(`${API_ROOT}/register`, {
      method: "POST",
      headers: { "17token": key, "Content-Type": "application/json" },
      body: JSON.stringify([{ number: number.trim(), ...(carrierCode ? { carrier: carrierCode } : {}) }]),
    });
    return response.ok;
  } catch {
    // Registration is best-effort. A failure here costs a slower first
    // status, not a broken order.
    return false;
  }
}

/**
 * Current status for one number, or null when it cannot be determined.
 *
 * Null on every failure path — no key, network error, malformed response — so
 * the caller renders the timeline it already has from our own fulfilment
 * fields. 17TRACK enriches the tracking page; it is never load-bearing.
 */
export async function trackingInfo(number: string): Promise<TrackInfo | null> {
  const key = process.env.SEVENTEENTRACK_API_KEY?.trim();
  if (!key || !number.trim()) return null;

  try {
    const response = await fetch(`${API_ROOT}/gettrackinfo`, {
      method: "POST",
      headers: { "17token": key, "Content-Type": "application/json" },
      body: JSON.stringify([{ number: number.trim() }]),
      // Their status changes a few times a day at most.
      next: { revalidate: 900 },
    });
    if (!response.ok) return null;

    const payload = (await response.json()) as {
      data?: { accepted?: Array<{ track_info?: TrackInfoPayload; carrier?: number }> };
    };

    const accepted = payload.data?.accepted?.[0];
    const info = accepted?.track_info;
    if (!info) return null;

    const events: TrackEvent[] = (info.tracking?.providers?.[0]?.events ?? [])
      .map((event) => ({
        at: event.time_iso ?? event.time_utc ?? "",
        description: event.description ?? "",
        location: event.location ?? null,
      }))
      .filter((event) => event.at && event.description);

    return {
      stage: stageFor(info.latest_status?.status),
      carrier: info.tracking?.providers?.[0]?.provider?.name ?? null,
      events,
      estimatedDelivery: info.time_metrics?.estimated_delivery_date?.from ?? null,
    };
  } catch {
    return null;
  }
}

/** The slice of their response we read. Their payload is much larger. */
type TrackInfoPayload = {
  latest_status?: { status?: string };
  time_metrics?: { estimated_delivery_date?: { from?: string } };
  tracking?: {
    providers?: Array<{
      provider?: { name?: string };
      events?: Array<{
        time_iso?: string;
        time_utc?: string;
        description?: string;
        location?: string;
      }>;
    }>;
  };
};
