import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as Location from "expo-location";
import { buildTrack, emptyTrack, type Fix, type Track } from "@/health-utils/geo";

/**
 * Recording an outdoor activity.
 *
 * Fixes accumulate in a ref and the derived track is recomputed on a timer,
 * because position updates arrive faster than anybody can read and rebuilding
 * the whole track on every one of them would burn battery on a screen that is
 * already holding the GPS open.
 *
 * Paused time is excluded from duration. A run with a ten-minute coffee stop
 * is not a slower run.
 */

export type TrackerStatus = "idle" | "requesting" | "denied" | "recording" | "paused" | "finished";

export type Tracker = {
  status: TrackerStatus;
  track: Track;
  /** Seconds actually moving, pauses removed. */
  elapsedS: number;
  message: string | null;
  start: () => void;
  pause: () => void;
  resume: () => void;
  finish: () => void;
  reset: () => void;
};

/** How often the derived track is rebuilt for display. */
const RECOMPUTE_MS = 1000;

export function useActivityTracker(): Tracker {
  const [status, setStatus] = useState<TrackerStatus>("idle");
  const [track, setTrack] = useState<Track>(emptyTrack);
  const [elapsedS, setElapsedS] = useState(0);
  const [message, setMessage] = useState<string | null>(null);

  const fixes = useRef<Fix[]>([]);
  const watcher = useRef<Location.LocationSubscription | null>(null);
  // Wall-clock accounting, so a pause genuinely stops the timer.
  const movingSince = useRef<number | null>(null);
  const bankedMs = useRef(0);

  const stopWatching = useCallback(() => {
    watcher.current?.remove();
    watcher.current = null;
  }, []);

  const beginWatching = useCallback(async () => {
    const { status: permission } = await Location.requestForegroundPermissionsAsync();
    if (permission !== "granted") {
      setStatus("denied");
      setMessage("Location access is needed to record a route.");
      return false;
    }
    watcher.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.BestForNavigation,
        // A fix a second, or every five metres, whichever comes first. Denser
        // than this buys noise rather than detail.
        timeInterval: 1000,
        distanceInterval: 5,
      },
      (position) => {
        fixes.current.push({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy ?? null,
          speed: position.coords.speed ?? null,
          altitude: position.coords.altitude ?? null,
          timestamp: position.timestamp,
        });
      },
    );
    return true;
  }, []);

  const start = useCallback(() => {
    setStatus("requesting");
    setMessage(null);
    fixes.current = [];
    bankedMs.current = 0;
    void beginWatching().then((ok) => {
      if (!ok) return;
      movingSince.current = Date.now();
      setStatus("recording");
    });
  }, [beginWatching]);

  const pause = useCallback(() => {
    if (movingSince.current != null) {
      bankedMs.current += Date.now() - movingSince.current;
      movingSince.current = null;
    }
    stopWatching();
    setStatus("paused");
  }, [stopWatching]);

  const resume = useCallback(() => {
    void beginWatching().then((ok) => {
      if (!ok) return;
      movingSince.current = Date.now();
      setStatus("recording");
    });
  }, [beginWatching]);

  const finish = useCallback(() => {
    if (movingSince.current != null) {
      bankedMs.current += Date.now() - movingSince.current;
      movingSince.current = null;
    }
    stopWatching();
    setTrack(buildTrack(fixes.current));
    setElapsedS(Math.round(bankedMs.current / 1000));
    setStatus("finished");
  }, [stopWatching]);

  const reset = useCallback(() => {
    stopWatching();
    fixes.current = [];
    bankedMs.current = 0;
    movingSince.current = null;
    setTrack(emptyTrack);
    setElapsedS(0);
    setMessage(null);
    setStatus("idle");
  }, [stopWatching]);

  useEffect(() => {
    if (status !== "recording") return;
    const timer = setInterval(() => {
      setTrack(buildTrack(fixes.current));
      const live = movingSince.current == null ? 0 : Date.now() - movingSince.current;
      setElapsedS(Math.round((bankedMs.current + live) / 1000));
    }, RECOMPUTE_MS);
    return () => clearInterval(timer);
  }, [status]);

  // The GPS must not be left running because somebody swiped away.
  useEffect(() => stopWatching, [stopWatching]);

  return useMemo(
    () => ({ status, track, elapsedS, message, start, pause, resume, finish, reset }),
    [status, track, elapsedS, message, start, pause, resume, finish, reset],
  );
}
