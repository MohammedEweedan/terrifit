import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { HEALTH_PROVIDERS, type HealthProvider } from "@/lib/validation";
import { parseHealthFile } from "@/lib/health/import";

export const runtime = "nodejs";

// Apple's export is the big one. 25 MB covers a few years of it; past that the
// browser should be told to split the file rather than the server quietly
// falling over on a 400 MB upload.
const MAX_BYTES = 25 * 1024 * 1024;

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const [imports, scans, metricCount] = await Promise.all([
    prisma.healthImport.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 10 }),
    prisma.bodyScan.findMany({ where: { userId: user.id }, orderBy: { takenAt: "desc" }, take: 12 }),
    prisma.healthMetric.count({ where: { userId: user.id } }),
  ]);

  return NextResponse.json({ imports, scans, metricCount });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  if (!(await rateLimit(`import:${clientKey(request)}`, 6, 60_000))) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  const providerRaw = String(form?.get("provider") ?? "apple_health");
  const provider = (HEALTH_PROVIDERS as readonly string[]).includes(providerRaw)
    ? (providerRaw as HealthProvider)
    : "apple_health";

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "no_file" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "too_large", maxBytes: MAX_BYTES }, { status: 413 });
  }

  // The run is recorded before parsing, so a file that blows up still leaves a
  // trace the member can see instead of vanishing.
  const run = await prisma.healthImport.create({
    data: { userId: user.id, provider, kind: "file", filename: file.name.slice(0, 200) },
  });

  try {
    const text = await file.text();
    const { metrics, scans } = parseHealthFile(file.name, text, provider);

    if (metrics.length === 0 && scans.length === 0) {
      await prisma.healthImport.update({
        where: { id: run.id },
        data: { status: "failed", error: "nothing_recognised", finishedAt: new Date() },
      });
      return NextResponse.json({ error: "nothing_recognised", importId: run.id }, { status: 422 });
    }

    // Re-importing the same export must not double a day's numbers, so each day
    // is upserted on (user, day, source).
    for (const metric of metrics.slice(0, 5000)) {
      const { date, ...values } = metric;
      await prisma.healthMetric.upsert({
        where: { userId_date_source: { userId: user.id, date, source: provider } },
        update: values,
        create: { userId: user.id, date, source: provider, ...values },
      });
    }

    if (scans.length > 0) {
      await prisma.bodyScan.createMany({
        data: scans.slice(0, 500).map((scan) => ({ userId: user.id, ...scan })),
      });
    }

    const finished = await prisma.healthImport.update({
      where: { id: run.id },
      data: {
        status: "complete",
        metricCount: Math.min(metrics.length, 5000),
        scanCount: Math.min(scans.length, 500),
        finishedAt: new Date(),
      },
    });

    // An import proves the app is connected, whatever the OAuth state.
    await prisma.healthConnection.upsert({
      where: { userId_provider: { userId: user.id, provider } },
      update: { status: "connected", connectedAt: new Date(), lastSyncAt: new Date(), revokedAt: null },
      create: { userId: user.id, provider, status: "connected", connectedAt: new Date(), lastSyncAt: new Date() },
    });

    return NextResponse.json({ import: finished }, { status: 201 });
  } catch {
    await prisma.healthImport.update({
      where: { id: run.id },
      data: { status: "failed", error: "parse_error", finishedAt: new Date() },
    }).catch(() => {});
    return NextResponse.json({ error: "parse_error", importId: run.id }, { status: 500 });
  }
}
