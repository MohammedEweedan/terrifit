import { NextResponse } from "next/server";
import { z } from "zod";
import { getRequestUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

/**
 * Outdoor activities.
 *
 * The device does the filtering — GPS drift is removed before anything is sent
 * — so this route's job is to refuse anything implausible rather than to
 * recompute the track. A distance the server cannot verify is still bounded by
 * what a human body can do in the time claimed.
 */

const KINDS = ["run", "walk", "hike", "ride", "swim", "other"] as const;

/**
 * The fastest anybody travels under their own power, with headroom.
 *
 * A track sport cyclist peaks near 22 m/s. Anything faster than this arrived by
 * car, or by a bug, and either way it is not an activity worth recording.
 */
const MAX_SPEED_MS = 25;

const schema = z
  .object({
    kind: z.enum(KINDS),
    distanceM: z.number().int().min(0).max(1_000_000),
    durationS: z.number().int().min(0).max(86_400),
    ascentM: z.number().int().min(0).max(30_000),
    route: z
      .array(z.tuple([z.number().min(-90).max(90), z.number().min(-180).max(180)]))
      .max(20_000),
  })
  .refine((value) => value.durationS === 0 || value.distanceM / value.durationS <= MAX_SPEED_MS, {
    message: "That distance is not possible in that time.",
    path: ["distanceM"],
  });

export async function POST(request: Request) {
  const user = await getRequestUser(request);
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid", detail: parsed.error.issues[0]?.message }, { status: 400 });
  }

  const activity = await prisma.activity.create({
    data: {
      userId: user.id,
      kind: parsed.data.kind,
      distanceM: parsed.data.distanceM,
      durationS: parsed.data.durationS,
      ascentM: parsed.data.ascentM,
      route: JSON.stringify(parsed.data.route),
    },
    select: { id: true, kind: true, distanceM: true, durationS: true, ascentM: true, recordedAt: true },
  });

  return NextResponse.json({ ...activity, recordedAt: activity.recordedAt.toISOString() }, { status: 201 });
}

export async function GET(request: Request) {
  const user = await getRequestUser(request);
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const activities = await prisma.activity.findMany({
    where: { userId: user.id },
    orderBy: { recordedAt: "desc" },
    take: 50,
    // The route is deliberately not in the list payload: fifty polylines is
    // megabytes, and nothing on the list screen draws one.
    select: { id: true, kind: true, distanceM: true, durationS: true, ascentM: true, recordedAt: true },
  });

  return NextResponse.json(
    { activities: activities.map((item) => ({ ...item, recordedAt: item.recordedAt.toISOString() })) },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
