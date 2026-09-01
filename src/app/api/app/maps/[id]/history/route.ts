import { NextResponse } from "next/server";
import { getRequestUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { findMap } from "@/lib/maps/catalog";

export const runtime = "nodejs";

type LoggedSet = { reps: number | null; weightKg: number | null; done: boolean };
type LoggedEntry = { exercise: string; sets: LoggedSet[] };

/** Everything you have done on this Map, newest first. */
export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getRequestUser(request);
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const { id } = await context.params;
  const map = findMap(id);
  if (!map) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const logs = await prisma.sessionLog.findMany({
    where: { userId: user.id, mapId: id },
    orderBy: { completedAt: "desc" },
    take: 60,
  });

  const sessions = logs.map((log) => {
    const entries = JSON.parse(log.entries) as LoggedEntry[];
    // Tonnage is the one number that compares two sessions of the same work.
    const volume = entries.reduce(
      (total, entry) =>
        total +
        entry.sets.reduce(
          (inner, set) => inner + (set.done && set.reps && set.weightKg ? set.reps * set.weightKg : 0),
          0,
        ),
      0,
    );
    const sets = entries.reduce((total, entry) => total + entry.sets.filter((set) => set.done).length, 0);
    return {
      id: log.id,
      sessionId: log.sessionId,
      name: map.sample.find((item) => item.id === log.sessionId)?.name ?? log.sessionId,
      week: log.week,
      completedAt: log.completedAt.toISOString(),
      durationSeconds: log.durationSeconds,
      volumeKg: Math.round(volume),
      sets,
      entries,
    };
  });

  const totalVolume = sessions.reduce((total, session) => total + session.volumeKg, 0);

  return NextResponse.json(
    {
      sessions,
      summary: {
        count: sessions.length,
        totalVolumeKg: totalVolume,
        // Best is the heaviest single session, which is what people look for.
        bestVolumeKg: sessions.reduce((best, session) => Math.max(best, session.volumeKg), 0),
      },
    },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
