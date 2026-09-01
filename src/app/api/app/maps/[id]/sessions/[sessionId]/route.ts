import { NextResponse } from "next/server";
import { z } from "zod";
import { getRequestUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { blockForWeek, findMap } from "@/lib/maps/catalog";

export const runtime = "nodejs";

const setSchema = z.object({
  reps: z.number().int().min(0).max(1000).nullable(),
  weightKg: z.number().min(0).max(1000).nullable(),
  done: z.boolean(),
});

const schema = z.object({
  entries: z
    .array(z.object({ exercise: z.string().trim().min(1).max(120), sets: z.array(setSchema).max(30) }))
    .max(40),
  durationSeconds: z.number().int().min(0).max(86_400).optional(),
  notes: z.string().trim().max(1000).optional(),
});

/**
 * The session, plus what you did last time.
 *
 * The prescription is content and comes from the catalogue; the history comes
 * from the database. Showing both together is the whole point — "5×3 at 82%"
 * means nothing until you can see that last week you put 102.5 kg on the bar.
 */
export async function GET(request: Request, context: { params: Promise<{ id: string; sessionId: string }> }) {
  const user = await getRequestUser(request);
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const { id, sessionId } = await context.params;
  const map = findMap(id);
  const session = map?.sample.find((item) => item.id === sessionId);
  if (!map || !session) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const [enrollment, last] = await Promise.all([
    prisma.mapEnrollment.findUnique({ where: { userId_mapId: { userId: user.id, mapId: id } } }),
    prisma.sessionLog.findFirst({
      where: { userId: user.id, sessionId },
      orderBy: { completedAt: "desc" },
    }),
  ]);

  return NextResponse.json(
    {
      map: { id: map.id, name: map.name, accent: map.accent, sessionsPerWeek: map.sessionsPerWeek },
      session,
      week: enrollment?.week ?? 1,
      blockLabel: enrollment ? (blockForWeek(map, enrollment.week)?.label ?? null) : null,
      lastTime: last
        ? {
            completedAt: last.completedAt.toISOString(),
            week: last.week,
            entries: JSON.parse(last.entries) as unknown,
          }
        : null,
    },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}

/** Records a finished session and advances the Map. */
export async function POST(request: Request, context: { params: Promise<{ id: string; sessionId: string }> }) {
  const user = await getRequestUser(request);
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const { id, sessionId } = await context.params;
  const map = findMap(id);
  if (!map || !map.sample.some((item) => item.id === sessionId)) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "validation" }, { status: 422 });

  const enrollment = await prisma.mapEnrollment.findUnique({
    where: { userId_mapId: { userId: user.id, mapId: id } },
  });
  if (!enrollment) return NextResponse.json({ error: "not_enrolled" }, { status: 409 });

  await prisma.sessionLog.create({
    data: {
      userId: user.id,
      mapId: id,
      sessionId,
      week: enrollment.week,
      entries: JSON.stringify(parsed.data.entries),
      durationSeconds: parsed.data.durationSeconds ?? null,
      notes: parsed.data.notes ?? null,
    },
  });

  // A finished week rolls over; the last week finishing ends the Map rather
  // than starting one that does not exist.
  const done = enrollment.done + 1;
  const rollover = done >= map.sessionsPerWeek;
  const week = rollover ? enrollment.week + 1 : enrollment.week;
  const finished = week > map.weeks;

  const updated = await prisma.mapEnrollment.update({
    where: { userId_mapId: { userId: user.id, mapId: id } },
    data: {
      done: rollover ? 0 : done,
      week: finished ? map.weeks : week,
      completedAt: finished ? new Date() : null,
    },
  });

  return NextResponse.json({ week: updated.week, done: updated.done, completed: finished });
}
