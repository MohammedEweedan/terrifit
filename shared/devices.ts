/** Terrifit domain types. Manufacturer SDK objects must not reach app screens. */
export type DeviceKind = "band" | "scale";
export type DeviceCapability = "weight" | "body_fat" | "muscle_mass" | "skeletal_muscle" | "body_water" | "bmi" | "bmr" | "visceral_fat" | "heart_rate" | "hrv" | "sleep" | "activity";
export type ScaleConnection = {
  id: string; model: string; colourway: string; firmware: string | null;
  batteryPercent: number | null; lastSyncAt: string | null; pairedAt: string;
  capabilities: DeviceCapability[];
};
export type ScaleState = {
  scale: ScaleConnection | null;
  integration: { status: "upcoming" | "available"; providers: string[] };
};
export type ScaleMeasurement = {
  measurementId: string; takenAt: string; weightKg: number;
  bodyFatPercent?: number; fatMassKg?: number; muscleMassKg?: number;
  skeletalMuscleKg?: number; bodyWaterPercent?: number; bodyWaterL?: number;
  bmi?: number; basalMetabolicRate?: number; visceralFatLevel?: number;
};

/** Implement this against the selected SDK in a native build. Discovery and
 * measurement consent happen on the phone; account registration is server-verified. */
export interface ScaleAdapter {
  readonly provider: string;
  readonly capabilities: readonly DeviceCapability[];
  discover(signal: AbortSignal): AsyncIterable<{ externalId: string; label: string }>;
  connect(externalId: string, signal: AbortSignal): Promise<{ proof: string; model: string; firmware: string | null }>;
  measurements(externalId: string, signal: AbortSignal): AsyncIterable<ScaleMeasurement>;
  disconnect(externalId: string): Promise<void>;
}
