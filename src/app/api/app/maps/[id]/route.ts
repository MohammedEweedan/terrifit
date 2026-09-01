import { NextResponse } from "next/server";
import { getRequestUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { blockForWeek, findMap } from "@/lib/maps/catalog";

export const runtime = "nodejs";

/** One Map in full, with the member's place in it if they have started. */
export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getRequestUser(request);
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const { id } = await context.params;
  const map = findMap(id);
  if (!map) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const enrollment = await prisma.mapEnrollment.findUnique({
    where: { userId_mapId: { userId: user.id, mapId: id } },
  });

  // The coach is a real account, so "message them" reaches somebody.
  const coach = await prisma.user.findFirst({
    where: { handle: map.coach.handle },
    select: { id: true, name: true, handle: true },
  });

  return NextResponse.json(
    {
      map,
      coach: coach ?? null,
      enrollment: enrollment
        ? {
            week: enrollment.week,
            done: enrollment.done,
            blockLabel: blockForWeek(map, enrollment.week)?.label ?? null,
            startedAt: enrollment.startedAt.toISOString(),
          }
        : null,
    },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}

/** Start a Map, or record a finished session against one already running. */
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getRequestUser(request);
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const { id } = await context.params;
  const map = findMap(id);
  if (!map) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const body = (await request.json().catch(() => ({}))) as { action?: string };

  if (body.action === "complete-session") {
    const current = await prisma.mapEnrollment.findUnique({
      where: { userId_mapId: { userId: user.id, mapId: id } },
    });
    if (!current) return NextResponse.json({ error: "not_enrolled" }, { status: 409 });

    // A finished week rolls over rather than counting past the plan; the last
    // week finishing ends the Map instead of starting a thirteenth.
    const done = current.done + 1;
    const rollover = done >= map.sessionsPerWeek;
    const week = rollover ? current.week + 1 : current.week;
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

  const enrollment = await prisma.mapEnrollment.upsert({
    where: { userId_mapId: { userId: user.id, mapId: id } },
    update: {},
    create: { userId: user.id, mapId: id },
  });

  await prisma.notification.create({
    data: {
      userId: user.id,
      kind: "system",
      title: `${map.name} started`,
      body: `Week 1 of ${map.weeks}. First session is ${map.sample[0]?.name ?? "ready"}.`,
    },
  });

  return NextResponse.json({ week: enrollment.week, done: enrollment.done }, { status: 201 });
}

/** Leave a Map. The row is deleted, so restarting begins at week one. */
export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getRequestUser(request);
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const { id } = await context.params;
  await prisma.mapEnrollment
    .delete({ where: { userId_mapId: { userId: user.id, mapId: id } } })
    .catch(() => null);

  return NextResponse.json({ ok: true });
}
