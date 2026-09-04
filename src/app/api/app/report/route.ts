import { NextResponse } from "next/server";
import { getRequestUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { loadDashboard } from "@/lib/health/dashboard";
import { buildReport, reportCsv, REPORT_SECTIONS, type ReportSection } from "@/lib/health/report";

export const runtime = "nodejs";

/**
 * A report of somebody's own data, to read, print or keep.
 *
 * Built from `loadDashboard`, the same function the app draws from, so an
 * exported report and the screen it came from can never quote different
 * numbers. `?format=csv` returns the daily rows instead of the summary, for
 * anyone who would rather have the data than the prose.
 */
export async function GET(request: Request) {
  const user = await getRequestUser(request);
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const url = new URL(request.url);
  const format = url.searchParams.get("format") ?? "json";
  const days = Math.max(7, Math.min(365, Number(url.searchParams.get("days") ?? 90) || 90));

  const requested = (url.searchParams.get("sections") ?? "")
    .split(",")
    .map((section) => section.trim())
    .filter((section): section is ReportSection => REPORT_SECTIONS.includes(section as ReportSection));
  const sections = requested.length > 0 ? requested : REPORT_SECTIONS;

  const [profile, account] = await Promise.all([
    prisma.profile.findUnique({
      where: { userId: user.id },
      select: { activityLevel: true, units: true, dateOfBirth: true, sex: true, heightCm: true },
    }),
    prisma.user.findUnique({ where: { id: user.id }, select: { plan: true, trialEndsAt: true } }),
  ]);

  const dashboard = await loadDashboard(user.id, profile?.activityLevel, {
    plan: account?.plan,
    trialEndsAt: account?.trialEndsAt,
    dateOfBirth: profile?.dateOfBirth,
    sex: profile?.sex,
    heightCm: profile?.heightCm,
  });

  if (format === "csv") {
    return new NextResponse(reportCsv(dashboard, days), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="terrifit-${days}-days.csv"`,
        "Cache-Control": "private, no-store",
      },
    });
  }

  const report = buildReport(dashboard, {
    sections,
    days,
    name: user.name,
    units: profile?.units === "imperial" ? "imperial" : "metric",
  });

  return NextResponse.json(report, { headers: { "Cache-Control": "private, no-store" } });
}
