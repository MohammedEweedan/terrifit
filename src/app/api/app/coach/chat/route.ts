import { NextResponse } from "next/server";
import { z } from "zod";
import { getRequestUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { findMap } from "@/lib/maps/catalog";
import { askCoach, MAX_MESSAGE_CHARS, MAX_TURNS, type CoachContext } from "@/lib/coaching/chat";
import { rateLimit } from "@/lib/rate-limit";
import { recoveryScore } from "@/lib/health/scores";

export const runtime = "nodejs";

const schema = z.object({
  message: z.string().trim().min(1).max(MAX_MESSAGE_CHARS),
  history: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().max(MAX_MESSAGE_CHARS) }))
    .max(MAX_TURNS)
    .default([]),
});

/**
 * One turn of conversation with the Coach.
 *
 * The context is assembled here rather than trusted from the client: a browser
 * that can claim "my recovery is 98" can talk the coach into anything, and the
 * numbers are in the database anyway.
 */
export async function POST(request: Request) {
  const user = await getRequestUser(request);
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  // A model call costs money and the endpoint is authenticated but not free.
  const allowed = await rateLimit(`coach-chat:${user.id}`, 30, 60 * 60_000);
  if (!allowed) {
    return NextResponse.json(
      { error: "rate_limited", message: "That is a lot of questions for one hour. Try again shortly." },
      { status: 429 },
    );
  }

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });

  const [account, enrollment, sessions, metrics] = await Promise.all([
    prisma.user.findUnique({ where: { id: user.id }, select: { name: true } }),
    prisma.mapEnrollment.findFirst({
      where: { userId: user.id, completedAt: null },
      orderBy: { startedAt: "desc" },
    }),
    prisma.sessionLog.count({
      where: { userId: user.id, completedAt: { gte: new Date(Date.now() - 7 * 86_400_000) } },
    }),
    // Recovery is scored against the member's own recent normal rather than
    // stored, so the window comes back rather than a single row.
    prisma.healthMetric.findMany({
      where: { userId: user.id },
      orderBy: { date: "desc" },
      take: 30,
    }),
  ]);

  const map = enrollment ? findMap(enrollment.mapId) : null;
  const next = map && enrollment ? map.sample[enrollment.done % map.sample.length] : null;
  const today = metrics[0] ?? null;
  const recovery = today ? recoveryScore(today, metrics.slice(1)).value : null;

  const context: CoachContext = {
    firstName: account?.name?.trim().split(/\s+/)[0] ?? null,
    mapName: map?.name ?? null,
    week: enrollment?.week ?? null,
    nextSession: next?.name ?? null,
    sessionsThisWeek: sessions,
    restingHr: today?.restingHr ?? null,
    sleepHours: today?.sleepMinutes != null ? today.sleepMinutes / 60 : null,
    recovery,
  };

  const result = await askCoach(parsed.data.message, parsed.data.history, context, request.signal);
  return NextResponse.json(result, { headers: { "Cache-Control": "private, no-store" } });
}
