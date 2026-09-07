import { z } from "zod";
import { prisma } from "@/lib/db";
import type { DeviceCapability, ScaleState } from "../../../shared/devices";

const optionalNumber = (min: number, max: number) => z.number().finite().min(min).max(max).optional();
export const scaleMeasurementSchema = z.object({
  measurementId: z.string().trim().min(1).max(160),
  takenAt: z.iso.datetime({ offset: true }).refine(value => Date.parse(value) <= Date.now() + 60_000, "Measurement is in the future"),
  weightKg: z.number().finite().min(10).max(500),
  bodyFatPercent: optionalNumber(1, 80), fatMassKg: optionalNumber(0, 400),
  muscleMassKg: optionalNumber(0, 250), skeletalMuscleKg: optionalNumber(0, 200),
  bodyWaterPercent: optionalNumber(1, 90), bodyWaterL: optionalNumber(1, 250),
  bmi: optionalNumber(5, 150), basalMetabolicRate: z.number().int().min(300).max(6000).optional(),
  visceralFatLevel: optionalNumber(0, 100),
}).strict().superRefine((data, ctx) => {
  for (const key of ["fatMassKg", "muscleMassKg", "skeletalMuscleKg"] as const) {
    if (data[key] != null && data[key] > data.weightKg) ctx.addIssue({ code: "custom", path: [key], message: "Component mass cannot exceed total weight" });
  }
});

export type VerifiedScale = { externalId: string; model: string; firmware: string | null; capabilities: DeviceCapability[] };
export interface ScaleProvider {
  readonly id: string;
  verifyPairing(proof: string, userId: string): Promise<VerifiedScale>;
}

/** Intentionally empty until a manufacturer SDK and ownership proof are validated. */
const providers: ReadonlyMap<string, ScaleProvider> = new Map();
export const scaleProvider = (id: string) => providers.get(id);
export const scaleIntegration = (): ScaleState["integration"] => ({ status: providers.size ? "available" : "upcoming", providers: [...providers.keys()] });

/** Called only by a verified provider pipeline, never by an unauthenticated vendor payload. */
export async function ingestScaleMeasurement(userId: string, deviceId: string, raw: unknown) {
  const { measurementId, takenAt, ...values } = scaleMeasurementSchema.parse(raw);
  return prisma.$transaction(async tx => {
    const device = await tx.scaleDevice.findFirst({ where: { id: deviceId, userId, disconnectedAt: null } });
    if (!device) throw new Error("Scale is not connected to this account");
    const scan = await tx.bodyScan.upsert({
      where: { userId_deviceId_providerMeasurementId: { userId, deviceId, providerMeasurementId: measurementId } },
      create: { userId, deviceId, providerMeasurementId: measurementId, source: "terrifit_scale", takenAt: new Date(takenAt), ...values },
      update: {},
    });
    // Old buffered readings must not move the device's latest sync backwards.
    await tx.scaleDevice.update({ where: { id: device.id }, data: { lastSyncAt: new Date() } });
    return scan;
  });
}
