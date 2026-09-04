import { createHash } from "node:crypto";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { loadDashboard } from "@/lib/health/dashboard";
import { buildReport, REPORT_SECTIONS, type ReportSection } from "@/lib/health/report";
import { PrintButton } from "@/components/report/PrintButton";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Your Terrifit report",
  // A single-use link to somebody's health data has no business in an index.
  robots: { index: false, follow: false },
};

const hash = (token: string) => createHash("sha256").update(token).digest("hex");

export default async function ReportPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const link = await prisma.reportLink.findUnique({
    where: { tokenHash: hash(token) },
    select: { id: true, userId: true, sections: true, days: true, expiresAt: true, usedAt: true },
  });

  // Expired or never real — the same answer either way, so the page gives away
  // nothing about which.
  if (!link || link.expiresAt < new Date()) notFound();

  // Valid until it expires rather than on first open. A link that dies on a
  // refresh is hostile to the one thing people do with these — reprint after a
  // printer jam — and the token is 32 random bytes with a 15-minute life, so
  // re-opening buys an attacker nothing. `usedAt` records the first open so a
  // link that was opened somewhere unexpected is visible afterwards.
  if (!link.usedAt) {
    await prisma.reportLink.update({ where: { id: link.id }, data: { usedAt: new Date() } });
  }

  const [user, profile, account] = await Promise.all([
    prisma.user.findUnique({ where: { id: link.userId }, select: { name: true } }),
    prisma.profile.findUnique({
      where: { userId: link.userId },
      select: { activityLevel: true, units: true, dateOfBirth: true, sex: true, heightCm: true },
    }),
    prisma.user.findUnique({ where: { id: link.userId }, select: { plan: true, trialEndsAt: true } }),
  ]);
  if (!user) notFound();

  const dashboard = await loadDashboard(link.userId, profile?.activityLevel, {
    plan: account?.plan,
    trialEndsAt: account?.trialEndsAt,
    dateOfBirth: profile?.dateOfBirth,
    sex: profile?.sex,
    heightCm: profile?.heightCm,
  });

  const parsed: unknown = JSON.parse(link.sections);
  const sections = (Array.isArray(parsed) ? parsed : REPORT_SECTIONS).filter(
    (section): section is ReportSection => REPORT_SECTIONS.includes(section as ReportSection),
  );

  const report = buildReport(dashboard, {
    sections: sections.length > 0 ? sections : REPORT_SECTIONS,
    days: link.days,
    name: user.name,
    units: profile?.units === "imperial" ? "imperial" : "metric",
  });

  return (
    <main className="rp">
      <header className="rp-head">
        <div>
          <p className="rp-brand">TERRIFIT</p>
          <h1>{report.name}</h1>
          <p className="rp-period">{report.period}</p>
        </div>
        <PrintButton />
      </header>

      {report.blocks.map((block) => (
        <section key={block.id} className="rp-block">
          <h2>{block.title}</h2>
          <dl>
            {block.rows.map(([label, value]) => (
              <div key={label} className="rp-row">
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
          {block.note ? <p className="rp-note">{block.note}</p> : null}
        </section>
      ))}

      <footer className="rp-foot">
        <p>
          Generated {new Date(report.generatedAt).toLocaleString("en-GB")} from your own recorded data.
        </p>
        <p>
          These are estimates from consumer sensors, not clinical measurements. Terrifit is not a medical
          device and nothing here is a diagnosis.
        </p>
      </footer>
    </main>
  );
}
