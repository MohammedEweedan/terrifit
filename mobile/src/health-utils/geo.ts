/**
 * Turning a stream of GPS fixes into a route somebody would recognise.
 *
 * The naive version — add up the distance between every consecutive fix — is
 * always wrong, and always wrong in the same direction. A phone standing still
 * reports a position that wanders by several metres a second, so a 40-minute
 * run with two traffic-light stops accumulates hundreds of metres of drift
 * that the runner did not cover. Every rule here exists to throw away fixes
 * that are noise rather than movement.
 */

export type Fix = {
  latitude: number;
  longitude: number;
  /** Metres. The radius the device believes the true position lies within. */
  accuracy: number | null;
  /** Metres per second, when the device reports it. */
  speed: number | null;
  altitude: number | null;
  timestamp: number;
};

/** A fix less certain than this is not evidence of anything. */
export const MAX_ACCURACY_M = 25;

/**
 * Movement smaller than this is drift, not distance.
 *
 * Set against the accuracy of the fix rather than as a flat number: a 5 m
 * accurate fix that moved 4 m has probably moved, and a 20 m accurate fix that
 * moved 4 m has probably not.
 */
function movedEnough(metres: number, accuracy: number | null): boolean {
  const floor = Math.max(3, Math.min(20, (accuracy ?? MAX_ACCURACY_M) * 0.5));
  return metres >= floor;
}

const EARTH_RADIUS_M = 6_371_000;

/** Great-circle distance in metres. */
export function distanceBetween(a: Fix, b: Fix): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Drops fixes too uncertain to use. Order is preserved. */
export function usableFixes(fixes: Fix[]): Fix[] {
  return fixes.filter((fix) => fix.accuracy == null || fix.accuracy <= MAX_ACCURACY_M);
}

export type Track = {
  /** Metres actually covered, drift excluded. */
  distanceM: number;
  /** Seconds between the first and last kept fix. */
  durationS: number;
  /** Metres per second over the whole track. */
  averageSpeedMs: number;
  /** Metres per second right now, smoothed. Null before there is enough. */
  currentSpeedMs: number | null;
  /** Metres gained, summing only sustained climbs. */
  ascentM: number;
  /** The fixes that survived filtering, for drawing. */
  points: Fix[];
};

export const emptyTrack: Track = {
  distanceM: 0, durationS: 0, averageSpeedMs: 0, currentSpeedMs: null, ascentM: 0, points: [],
};

/** How many recent seconds current speed is averaged over. */
const CURRENT_SPEED_WINDOW_S = 20;

/**
 * Altitude noise is larger than altitude change on flat ground.
 *
 * GPS elevation is accurate to roughly ±10 m, so a walk on the level would
 * otherwise report hundreds of metres of climb. Only a sustained gain counts.
 */
const ASCENT_THRESHOLD_M = 5;

export function buildTrack(raw: Fix[]): Track {
  const fixes = usableFixes(raw);
  if (fixes.length < 2) {
    return { ...emptyTrack, points: fixes, durationS: 0 };
  }

  const points: Fix[] = [fixes[0]];
  let distanceM = 0;

  for (let i = 1; i < fixes.length; i += 1) {
    const step = distanceBetween(points[points.length - 1], fixes[i]);
    if (!movedEnough(step, fixes[i].accuracy)) continue;
    distanceM += step;
    points.push(fixes[i]);
  }

  const durationS = Math.max(0, (fixes[fixes.length - 1].timestamp - fixes[0].timestamp) / 1000);

  // Ascent walks the kept points, banking a climb only once it clears the
  // noise floor, so a jittering altimeter on the flat contributes nothing.
  let ascentM = 0;
  let reference = points[0]?.altitude ?? null;
  for (const point of points) {
    if (point.altitude == null) continue;
    if (reference == null) { reference = point.altitude; continue; }
    const gain = point.altitude - reference;
    if (gain >= ASCENT_THRESHOLD_M) { ascentM += gain; reference = point.altitude; }
    else if (gain <= -ASCENT_THRESHOLD_M) { reference = point.altitude; }
  }

  return {
    distanceM,
    durationS,
    averageSpeedMs: durationS > 0 ? distanceM / durationS : 0,
    currentSpeedMs: currentSpeed(points),
    ascentM,
    points,
  };
}

/**
 * Speed over the last few seconds.
 *
 * Derived from position rather than taken from the device's own speed field,
 * which on some hardware is an instantaneous Doppler reading that swings by
 * several km/h between fixes and makes the number on screen unreadable.
 */
export function currentSpeed(points: Fix[]): number | null {
  if (points.length < 2) return null;
  const latest = points[points.length - 1];
  const cutoff = latest.timestamp - CURRENT_SPEED_WINDOW_S * 1000;
  const window = points.filter((point) => point.timestamp >= cutoff);
  if (window.length < 2) return null;

  const seconds = (latest.timestamp - window[0].timestamp) / 1000;
  if (seconds <= 0) return null;

  let metres = 0;
  for (let i = 1; i < window.length; i += 1) metres += distanceBetween(window[i - 1], window[i]);
  return metres / seconds;
}

/* -------------------------------------------------------------------------- */
/* Presentation                                                               */

/** "5.42 km" or "840 m" — whichever a person would say. */
export function formatDistance(metres: number, imperial = false): string {
  if (imperial) {
    const miles = metres / 1609.344;
    return miles < 0.1 ? `${Math.round(metres * 3.28084)} ft` : `${miles.toFixed(2)} mi`;
  }
  return metres < 1000 ? `${Math.round(metres)} m` : `${(metres / 1000).toFixed(2)} km`;
}

/** "5:12 /km". Pace, not speed, because that is how runners think. */
export function formatPace(metresPerSecond: number | null, imperial = false): string {
  if (!metresPerSecond || metresPerSecond < 0.28) return "—";
  const perUnit = imperial ? 1609.344 : 1000;
  const seconds = perUnit / metresPerSecond;
  if (seconds > 3600) return "—";
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(Math.round(seconds % 60)).padStart(2, "0")} /${imperial ? "mi" : "km"}`;
}

/** "12.4 km/h". For the activities where speed reads better than pace. */
export function formatSpeed(metresPerSecond: number | null, imperial = false): string {
  if (metresPerSecond == null) return "—";
  const value = metresPerSecond * (imperial ? 2.236936 : 3.6);
  return `${value.toFixed(1)} ${imperial ? "mph" : "km/h"}`;
}

/** "1:04:09" or "9:41". */
export function formatDuration(seconds: number): string {
  const total = Math.max(0, Math.round(seconds));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const sec = total % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  return `${m}:${String(sec).padStart(2, "0")}`;
}
