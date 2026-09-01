import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { AccountDashboard } from "@/components/account/AccountDashboard";
import { SiteShell } from "@/components/layout/SiteShell";
import { isLocale } from "@/i18n/config";
import { getPagesCopy } from "@/i18n/pages";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const { meta } = getPagesCopy(locale).account.dashboard;
  // Somebody's own account page has nothing to offer a search result.
  return { title: meta.title, description: meta.description, robots: { index: false, follow: false } };
}

export default async function AccountPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/signin`);

  const [profile, scans, imports, connections, metricCount] = await Promise.all([
    prisma.profile.findUnique({ where: { userId: user.id } }),
    prisma.bodyScan.findMany({ where: { userId: user.id }, orderBy: { takenAt: "desc" }, take: 12 }),
    prisma.healthImport.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 8 }),
    prisma.healthConnection.findMany({ where: { userId: user.id } }),
    prisma.healthMetric.count({ where: { userId: user.id } }),
  ]);

  // The form is a controlled component, so every field needs a string rather
  // than null — the API turns empty strings back into nulls on the way in.
  const text = (value: string | null | undefined) => value ?? "";
  const numeric = (value: number | null | undefined) => (value === null || value === undefined ? "" : String(value));

  return (
    <SiteShell locale={locale}>
      <AccountDashboard
        locale={locale}
        copy={getPagesCopy(locale).account.dashboard}
        email={user.email}
        metricCount={metricCount}
        initialProfile={{
          name: user.name,
          handle: text(user.handle),
          dateOfBirth: profile?.dateOfBirth ? profile.dateOfBirth.toISOString().slice(0, 10) : "",
          sex: text(profile?.sex),
          heightCm: numeric(profile?.heightCm),
          weightKg: numeric(profile?.weightKg),
          units: profile?.units ?? "metric",
          timezone: text(profile?.timezone),
          goal: text(profile?.goal),
          activityLevel: text(profile?.activityLevel),
          trainingDays: numeric(profile?.trainingDays),
          bio: text(profile?.bio),
          shareWithCreators: profile?.shareWithCreators ?? false,
        }}
        initialScans={scans.map((scan) => ({
          id: scan.id,
          takenAt: scan.takenAt.toISOString(),
          weightKg: scan.weightKg,
          bodyFatPercent: scan.bodyFatPercent,
          skeletalMuscleKg: scan.skeletalMuscleKg,
          score: scan.score,
        }))}
        initialImports={imports.map((run) => ({
          id: run.id,
          provider: run.provider,
          filename: run.filename,
          status: run.status,
          metricCount: run.metricCount,
          scanCount: run.scanCount,
          createdAt: run.createdAt.toISOString(),
        }))}
        initialConnections={connections.map((connection) => ({
          provider: connection.provider,
          status: connection.status,
        }))}
      />
    </SiteShell>
  );
}
