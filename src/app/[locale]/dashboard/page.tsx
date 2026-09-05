import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ScoreCard } from "@/components/app/ScoreCard";
import { isLocale, localeMeta } from "@/i18n/config";
import { getPagesCopy } from "@/i18n/pages";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { loadDashboard } from "@/lib/health/dashboard";
import { STRAIN_MAX } from "@/lib/health/scores";

export const dynamic = "force-dynamic";

export default async function TodayPage({ params }: PageProps<"/[locale]/dashboard">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/signin`);

  const copy = getPagesCopy(locale).app;
  const profile = await prisma.profile.findUnique({
    where: { userId: user.id },
    select: { activityLevel: true },
  });
  const data = await loadDashboard(user.id, profile?.activityLevel);

  if (!data.latest) {
    return (
      <div className="ap-empty">
        <h1>{copy.empty.title}</h1>
        <p>{copy.empty.body}</p>
        <div className="ap-empty-actions">
          <Link className="ap-button" href={`/${locale}/account`}>
            {copy.empty.cta}
          </Link>
          <Link className="ap-text-link" href={`/${locale}/band`}>
            {copy.empty.secondary} <span aria-hidden>→</span>
          </Link>
        </div>
      </div>
    );
  }

  const readingDate = new Intl.DateTimeFormat(localeMeta[locale].htmlLang, {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(data.latest.date));

  return (
    <>
      <header className="ap-head">
        <p className="ap-eyebrow">
          {copy.dataFrom} {readingDate}
        </p>
        {/* Data more than two days old would make every score a lie about
            today, so the app says so instead of quietly rendering it. */}
        {data.staleDays > 2 ? (
          <div className="ap-stale" role="status">
            <strong>{copy.staleTitle}</strong>
            <p>
              {copy.staleBody} {data.staleDays} {copy.staleDays}
            </p>
            <Link href={`/${locale}/account`}>{copy.staleCta} →</Link>
          </div>
        ) : null}
      </header>

      <div className="ap-grid">
        <ScoreCard
          copy={copy}
          hero
          label={copy.scores.recovery.label}
          blurb={copy.scores.recovery.blurb}
          unit={copy.scores.recovery.unit}
          score={data.latest.recovery}
        />
        <ScoreCard
          copy={copy}
          label={copy.scores.strain.label}
          blurb={copy.scores.strain.blurb}
          unit={copy.scores.strain.unit}
          max={STRAIN_MAX}
          score={data.latest.strain}
        />
        <ScoreCard
          copy={copy}
          label={copy.scores.sleep.label}
          blurb={copy.scores.sleep.blurb}
          unit={copy.scores.sleep.unit}
          score={data.latest.sleep}
        />
        <ScoreCard
          copy={copy}
          label={copy.scores.movement.label}
          blurb={copy.scores.movement.blurb}
          unit={copy.scores.movement.unit}
          score={data.latest.movement}
        />
      </div>
    </>
  );
}
