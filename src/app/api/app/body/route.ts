import { NextResponse } from "next/server";
import { getRequestUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

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
