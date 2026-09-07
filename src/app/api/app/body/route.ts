import { NextResponse } from "next/server";
import { getRequestUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

/** Body-composition history for the Body screen. */
export async function GET(request: Request) {
  const user = await getRequestUser(request);
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const scans = await prisma.bodyScan.findMany({
    where: { userId: user.id },
    orderBy: { takenAt: "desc" },
    take: 60,
    select: {
      id: true,
      takenAt: true,
      source: true,
      deviceId: true,
      muscleMassKg: true,
      fatMassKg: true,
      bodyWaterPercent: true,
      bmi: true,
      weightKg: true,
      bodyFatPercent: true,
      skeletalMuscleKg: true,
      bodyWaterL: true,
      visceralFatLevel: true,
      basalMetabolicRate: true,
      score: true,
    },
  });

  return NextResponse.json({ scans }, { headers: { "Cache-Control": "private, no-store" } });
}

const manualSchema = z.object({
  requestId: z.string().regex(/^[a-zA-Z0-9-]{8,80}$/),
  weightKg: z.number().finite().min(10).max(500),
  bodyFatPercent: z.number().finite().min(1).max(80).optional(),
}).strict();

/** A baseline can be recorded before hardware ships, with explicit manual provenance. */
export async function POST(request: Request) {
  const user = await getRequestUser(request);
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  if (!(await rateLimit(`body-entry:${user.id}`, 30, 60 * 60_000))) return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  const parsed = manualSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "validation", message: parsed.error.issues[0]?.message }, { status: 422 });
  const { requestId, ...values } = parsed.data;
  const scan = await prisma.bodyScan.upsert({
    where: { userId_deviceId_providerMeasurementId: { userId: user.id, deviceId: "manual", providerMeasurementId: requestId } },
    create: { userId: user.id, deviceId: "manual", providerMeasurementId: requestId, source: "manual", takenAt: new Date(), ...values },
    update: {},
  });
  return NextResponse.json({ scan }, { status: 201, headers: { "Cache-Control": "private, no-store" } });
}
