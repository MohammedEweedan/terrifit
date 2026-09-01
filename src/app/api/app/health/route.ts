import { NextResponse } from "next/server";
import { z } from "zod";
import { getRequestUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { clientKey, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

/**
 * Daily metrics straight from the phone.
 *
 * The website importer parses files; this takes rows a device already
 * aggregated, which is the same shape after parsing. Both land in HealthMetric
 * and upsert on `(user, day, source)`, so syncing twice cannot double anything
 * and a later sync corrects an earlier one.
 */
const daySchema = z.object({
  date: z.string().datetime(),
  hrvMs: z.number().min(0).max(500).optional(),
  restingHr: z.number().int().min(20).max(220).optional(),
  averageHr: z.number().int().min(20).max(220).optional(),
  sleepMinutes: z.number().int().min(0).max(1440).optional(),
  steps: z.number().int().min(0).max(200_000).optional(),
  activeKcal: z.number().int().min(0).max(20_000).optional(),
  weightKg: z.number().min(25).max(400).optional(),
  respiratoryRate: z.number().min(4).max(60).optional(),
  spo2: z.number().min(50).max(100).optional(),
});

const schema = z.object({
  source: z.enum(["apple_health", "health_connect"]).default("apple_health"),
  days: z.array(daySchema).max(400),
});

export async function POST(request: Request) {
  const user = await getRequestUser(request);
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  if (!rateLimit(`healthsync:${user.id}:${clientKey(request)}`, 20, 60_000)) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "validation", fields: parsed.error.issues.slice(0, 5).map((issue) => issue.path.join(".")) },
      { status: 422 },
    );
  }

  const { source, days } = parsed.data;

  // A day with nothing in it is not worth a row; it would only dilute the
  // "days of data" count the app shows.
  const rows = days.filter((day) =>
    Object.entries(day).some(([key, value]) => key !== "date" && value != null),
  );

  let written = 0;
  for (const day of rows) {
    const date = new Date(day.date);
    const data = {
      hrvMs: day.hrvMs ?? null,
      restingHr: day.restingHr ?? null,
      averageHr: day.averageHr ?? null,
      sleepMinutes: day.sleepMinutes ?? null,
      steps: day.steps ?? null,
      activeKcal: day.activeKcal ?? null,
      weightKg: day.weightKg ?? null,
      respiratoryRate: day.respiratoryRate ?? null,
      spo2: day.spo2 ?? null,
    };
    await prisma.healthMetric.upsert({
      where: { userId_date_source: { userId: user.id, date, source } },
      update: data,
      create: { userId: user.id, date, source, ...data },
    });
    written += 1;
  }

  await prisma.healthConnection.upsert({
    where: { userId_provider: { userId: user.id, provider: source } },
    update: { status: "connected", lastSyncAt: new Date(), revokedAt: null },
    create: {
      userId: user.id,
      provider: source,
      status: "connected",
      connectedAt: new Date(),
      lastSyncAt: new Date(),
    },
  });

  const total = await prisma.healthMetric.count({ where: { userId: user.id } });
  return NextResponse.json({ written, skipped: days.length - rows.length, totalDays: total });
}
