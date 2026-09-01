import { decodeBattery, decodeHeartRate, decodeString } from "../src/ble-decode";

/** Base64 of a raw byte sequence, the way a characteristic value arrives. */
function encode(bytes: number[]): string {
  return globalThis.btoa(String.fromCharCode(...bytes));
}

describe("decodeHeartRate", () => {
  it("reads an 8-bit measurement", () => {
    // flags 0x00 → 8-bit value; 60 bpm.
    expect(decodeHeartRate(encode([0x00, 60]))).toBe(60);
  });

  it("reads a 16-bit measurement little-endian", () => {
    // flags 0x01 → 16-bit; 300 would be 0x012c, so use 280 (0x0118).
    expect(decodeHeartRate(encode([0x01, 0x18, 0x01]))).toBe(280);
  });

  it("does not read a 16-bit value as 8-bit", () => {
    // The bug this guards: ignoring the flag turns 60 bpm into 15360.
    expect(decodeHeartRate(encode([0x01, 60, 0]))).toBe(60);
  });

  it("rejects impossible rates", () => {
    expect(decodeHeartRate(encode([0x00, 0]))).toBeNull();
    expect(decodeHeartRate(encode([0x01, 0xff, 0xff]))).toBeNull();
  });

  it("rejects a truncated packet", () => {
    expect(decodeHeartRate(encode([0x00]))).toBeNull();
  });
});

describe("decodeBattery", () => {
  it("reads a percentage", () => {
    expect(decodeBattery(encode([86]))).toBe(86);
  });

  it("rejects a value above 100", () => {
    expect(decodeBattery(encode([200]))).toBeNull();
  });
});

describe("decodeString", () => {
  it("trims the null padding firmware strings carry", () => {
    expect(decodeString(encode([49, 46, 50, 46, 48, 0, 0]))).toBe("1.2.0");
  });
});
