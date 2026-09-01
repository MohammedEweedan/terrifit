import { NextResponse } from "next/server";
import { getRequestUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { loadDashboard } from "@/lib/health/dashboard";

export const runtime = "nodejs";

/**
 * Everything the Today and Trends screens need, in one round trip.
 *
 * Scores are computed here rather than on the device so the web app and the
 * native app can never disagree about a number, and so improving a formula
 * ships to both without an App Store review.
 */
export async function GET(request: Request) {
  const user = await getRequestUser(request);
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

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

  return NextResponse.json(
    {
      user: { name: user.name, email: user.email },
      units: profile?.units ?? "metric",
      ...dashboard,
    },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
