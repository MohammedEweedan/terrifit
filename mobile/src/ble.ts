import { PermissionsAndroid, Platform } from "react-native";
import { BleManager, type Device } from "react-native-ble-plx";

/** One manager for the lifetime of the app, so a paired V1 is not disconnected when the pairing screen closes. */
export const bleManager = new BleManager();
// Firmware advertises the printed device serial as the local name. Keep the
// format deliberately forward-compatible: every V1 serial starts with TF1,
// while the suffix length/ separators can change between manufacturing runs.
export const V1_SERIAL = /^TF1[A-Z0-9-]{3,}$/;

/** V1 advertises its printed serial as its BLE local name. */
export function v1SerialFor(device: Device): string | null {
  const advertised = (device.localName ?? device.name ?? "").trim().toUpperCase();
  return V1_SERIAL.test(advertised) ? advertised : null;
}

export async function requestBluetoothPermission(): Promise<boolean> {
  if (Platform.OS !== "android") return true;
  const api = typeof Platform.Version === "number" ? Platform.Version : Number(Platform.Version);
  if (api >= 31) {
    const result = await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
    ]);
    return result[PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN] === PermissionsAndroid.RESULTS.GRANTED
      && result[PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT] === PermissionsAndroid.RESULTS.GRANTED;
  }
  return (await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION)) === PermissionsAndroid.RESULTS.GRANTED;
}

/* -------------------------------------------------------------------------- */
/* Reading from a connected V1                                                */

import {
  BATTERY_LEVEL, BATTERY_SERVICE, DEVICE_INFO_SERVICE, FIRMWARE_REVISION,
  HEART_RATE_MEASUREMENT, HEART_RATE_SERVICE, decodeBattery, decodeHeartRate, decodeString,
} from "./ble-decode";

export * from "./ble-decode";

export type BandReadout = { batteryPercent: number | null; firmware: string | null };

/** Battery and firmware, read once at pairing so the V1 tab shows real values. */
export async function readBandState(device: Device): Promise<BandReadout> {
  const [battery, firmware] = await Promise.all([
    device
      .readCharacteristicForService(BATTERY_SERVICE, BATTERY_LEVEL)
      .then((characteristic) => (characteristic.value ? decodeBattery(characteristic.value) : null))
      .catch(() => null),
    device
      .readCharacteristicForService(DEVICE_INFO_SERVICE, FIRMWARE_REVISION)
      .then((characteristic) => (characteristic.value ? decodeString(characteristic.value) : null))
      .catch(() => null),
  ]);
  return { batteryPercent: battery, firmware };
}

/**
 * Subscribes to live heart rate. Returns an unsubscribe.
 *
 * Notifications arrive about once a second while the strap is worn, which is
 * far too often to render — callers throttle. Errors end the subscription
 * rather than looping, because a disconnected band will not recover on its own.
 */
export function watchHeartRate(
  device: Device,
  onValue: (bpm: number) => void,
  onError?: (message: string) => void,
): () => void {
  const subscription = device.monitorCharacteristicForService(
    HEART_RATE_SERVICE,
    HEART_RATE_MEASUREMENT,
    (error, characteristic) => {
      if (error) {
        onError?.(error.message);
        return;
      }
      const value = characteristic?.value ? decodeHeartRate(characteristic.value) : null;
      if (value != null) onValue(value);
    },
  );
  return () => subscription.remove();
}
