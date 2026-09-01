/**
 * Wire-format decoding for the V1's Bluetooth characteristics.
 *
 * Kept apart from `ble.ts` because that module constructs a `BleManager` at
 * import time, which needs the native module — these are pure functions over
 * bytes, and pure functions should be testable without a device.
 */
/**
 * Standard Bluetooth SIG assigned numbers. V1 implements the adopted profiles
 * rather than a private protocol, so the same code reads any compliant strap
 * and there is nothing to reverse-engineer when firmware changes.
 */
export const HEART_RATE_SERVICE = "0000180d-0000-1000-8000-00805f9b34fb";
export const HEART_RATE_MEASUREMENT = "00002a37-0000-1000-8000-00805f9b34fb";
export const BATTERY_SERVICE = "0000180f-0000-1000-8000-00805f9b34fb";
export const BATTERY_LEVEL = "00002a19-0000-1000-8000-00805f9b34fb";
export const DEVICE_INFO_SERVICE = "0000180a-0000-1000-8000-00805f9b34fb";
export const FIRMWARE_REVISION = "00002a26-0000-1000-8000-00805f9b34fb";

function bytesFrom(base64: string): number[] {
  // Characteristic values arrive base64-encoded; atob is available in Hermes.
  const binary = globalThis.atob(base64);
  return Array.from(binary, (character) => character.charCodeAt(0));
}

/**
 * Decodes a Heart Rate Measurement.
 *
 * Bit 0 of the flags byte says whether the value is 8- or 16-bit, and getting
 * that wrong is how a resting rate of 60 reads as 15360.
 */
export function decodeHeartRate(base64: string): number | null {
  const bytes = bytesFrom(base64);
  if (bytes.length < 2) return null;
  const wide = (bytes[0] & 0x01) === 1;
  const value = wide ? bytes[1] | (bytes[2] << 8) : bytes[1];
  return value > 0 && value < 300 ? value : null;
}

export function decodeBattery(base64: string): number | null {
  const [level] = bytesFrom(base64);
  return level >= 0 && level <= 100 ? level : null;
}

export function decodeString(base64: string): string {
  return bytesFrom(base64)
    .map((code) => String.fromCharCode(code))
    .join("")
    .replace(/\0+$/, "")
    .trim();
}
