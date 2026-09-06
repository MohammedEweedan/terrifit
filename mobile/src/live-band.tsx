import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Device } from "react-native-ble-plx";
import { bleManager, requestBluetoothPermission, v1SerialFor, watchHeartRate } from "@/ble";
import { detect, effort, initialState, type DetectorState, type Reading } from "@/health-utils/set-detect";

/**
 * A live connection to the V1 while a session is running.
 *
 * Pairing connects once and lets go; this reconnects on demand, because the
 * only screen that needs a second-by-second stream is the one you are training
 * in front of. It scans for the paired serial rather than storing a device
 * handle: BLE identifiers are not stable across app launches on iOS, and the
 * serial is printed on the band.
 *
 * Everything here fails soft. A member without a band, without Bluetooth, or
 * who declines the permission gets the manual session, which is the whole
 * session — the band saves typing, it does not unlock the workout.
 */

export type BandLink = {
  status: "idle" | "searching" | "connected" | "unavailable";
  /** The most recent reading, for the live figure. */
  bpm: number | null;
  /** 0–1 against this session's own quiet and peak. A display value. */
  effort: number;
  /** Completed work bouts, oldest first. One per set, near enough. */
  completedSets: number;
  /** True while the member is inside a set. */
  working: boolean;
  message: string | null;
  start: () => void;
  stop: () => void;
};

/** How long to look for the band before giving up and saying so. */
const SCAN_TIMEOUT_MS = 15_000;

export function useBandLink(serial: string | null | undefined, enabled: boolean): BandLink {
  const [status, setStatus] = useState<BandLink["status"]>("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [bpm, setBpm] = useState<number | null>(null);
  const [state, setState] = useState<DetectorState>(initialState);

  // Readings accumulate in a ref: they arrive about once a second and
  // re-rendering the session screen at 1Hz for a number nobody is watching is
  // wasted work. The detector runs over the buffer instead.
  const readings = useRef<Reading[]>([]);
  const device = useRef<Device | null>(null);
  const stopHeartRate = useRef<(() => void) | null>(null);
  const peak = useRef<number | null>(null);

  const stop = useCallback(() => {
    stopHeartRate.current?.();
    stopHeartRate.current = null;
    bleManager.stopDeviceScan();
    const connected = device.current;
    device.current = null;
    if (connected) void connected.cancelConnection().catch(() => {});
    setStatus("idle");
  }, []);

  const start = useCallback(() => {
    if (!serial) {
      setStatus("unavailable");
      setMessage("No V1 paired to this account.");
      return;
    }

    let cancelled = false;
    setStatus("searching");
    setMessage(null);

    void (async () => {
      if (!(await requestBluetoothPermission())) {
        if (!cancelled) {
          setStatus("unavailable");
          setMessage("Bluetooth permission is needed to read the band.");
        }
        return;
      }

      const timeout = setTimeout(() => {
        bleManager.stopDeviceScan();
        if (cancelled) return;
        setStatus("unavailable");
        setMessage("Could not find your V1. Log the session by hand.");
      }, SCAN_TIMEOUT_MS);

      bleManager.startDeviceScan(null, { allowDuplicates: false }, (error, found) => {
        if (cancelled) return;
        if (error) {
          clearTimeout(timeout);
          bleManager.stopDeviceScan();
          setStatus("unavailable");
          setMessage(error.message);
          return;
        }
        if (!found || v1SerialFor(found) !== serial) return;

        clearTimeout(timeout);
        bleManager.stopDeviceScan();

        void found
          .connect({ timeout: 12_000 })
          .then((connected) => connected.discoverAllServicesAndCharacteristics())
          .then((connected) => {
            if (cancelled) {
              void connected.cancelConnection().catch(() => {});
              return;
            }
            device.current = connected;
            setStatus("connected");
            stopHeartRate.current = watchHeartRate(
              connected,
              (value) => {
                readings.current = [...readings.current, { bpm: value, at: Date.now() }].slice(-1800);
                peak.current = Math.max(peak.current ?? 0, value);
                setBpm(value);
              },
              (reason) => {
                setStatus("unavailable");
                setMessage(reason);
              },
            );
          })
          .catch((caught: unknown) => {
            if (cancelled) return;
            setStatus("unavailable");
            setMessage(caught instanceof Error ? caught.message : "The V1 would not connect.");
          });
      });
    })();

    return () => {
      cancelled = true;
    };
  }, [serial]);

  // The detector runs on a timer rather than on every reading, so a 1Hz stream
  // does not drive a re-render of the whole session sheet once a second.
  useEffect(() => {
    if (status !== "connected") return;
    const timer = setInterval(() => {
      setState((current) => detect(readings.current, current));
    }, 3000);
    return () => clearInterval(timer);
  }, [status]);

  useEffect(() => {
    if (!enabled) {
      stop();
      return;
    }
    const cancel = start();
    return () => {
      cancel?.();
      stop();
    };
  }, [enabled, start, stop]);

  return useMemo(
    () => ({
      status,
      bpm,
      effort: bpm == null ? 0 : effort(bpm, state.baselineBpm, peak.current),
      completedSets: state.bouts.length,
      working: state.openedAt != null,
      message,
      start: () => { start(); },
      stop,
    }),
    [status, bpm, state, message, start, stop],
  );
}
