import { NextResponse } from "next/server";
import { getRequestUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { MAPS, blockForWeek, findMap, recommendMaps } from "@/lib/maps/catalog";

export const runtime = "nodejs";

/** Every Map, ordered by fit, plus whatever the member is already part-way through. */
export async function GET(request: Request) {
  const user = await getRequestUser(request);
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const profile = await prisma.profile.findUnique({
    where: { userId: user.id },
    select: { goal: true, experience: true },
  });

  const enrollments = await prisma.mapEnrollment.findMany({
    where: { userId: user.id, completedAt: null },
    orderBy: { startedAt: "desc" },
  });

  const active = enrollments
    .map((row) => {
      const map = findMap(row.mapId);
      if (!map) return null;
      const block = blockForWeek(map, row.week);
      return {
        mapId: row.mapId,
        name: map.name,
        week: row.week,
        weeks: map.weeks,
        done: row.done,
        sessionsPerWeek: map.sessionsPerWeek,
        blockLabel: block?.label ?? null,
        percent: Math.round(((row.week - 1) / map.weeks) * 100),
        accent: map.accent,
      };
    })
    .filter((row): row is NonNullable<typeof row> => row !== null);

  return NextResponse.json(
    {
      active,
      maps: recommendMaps(profile?.goal, profile?.experience).map((map) => ({
        id: map.id,
        name: map.name,
        tagline: map.tagline,
        coach: map.coach,
        goal: map.goal,
        weeks: map.weeks,
        sessionsPerWeek: map.sessionsPerWeek,
        level: map.level,
        equipment: map.equipment,
        summary: map.summary,
        accent: map.accent,
        blocks: map.blocks,
        enrolled: enrollments.some((row) => row.mapId === map.id),
      })),
      total: MAPS.length,
    },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
