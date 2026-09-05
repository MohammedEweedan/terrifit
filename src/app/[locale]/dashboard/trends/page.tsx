import { notFound, redirect } from "next/navigation";
import { TrendChart } from "@/components/app/TrendChart";
import { isLocale } from "@/i18n/config";
import { getPagesCopy } from "@/i18n/pages";
import { getCurrentUser } from "@/lib/auth";
import { loadDashboard } from "@/lib/health/dashboard";

export const dynamic = "force-dynamic";

export default async function TrendsPage({ params }: PageProps<"/[locale]/dashboard/trends">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/signin`);

  const copy = getPagesCopy(locale).app;
  const data = await loadDashboard(user.id);
  const series = [...data.history].reverse();

  // Units are descriptors, not formatter functions: these props cross the
  // server/client boundary and have to be serialisable.
  const charts = [
    { key: "recovery" as const, label: copy.trends.recovery, unit: "percent" as const },
    { key: "hrvMs" as const, label: copy.trends.hrv, unit: "ms" as const },
    { key: "restingHr" as const, label: copy.trends.restingHr, unit: "bpm" as const },
    { key: "sleepMinutes" as const, label: copy.trends.sleep, unit: "duration" as const },
    { key: "steps" as const, label: copy.trends.steps, unit: "count" as const },
    { key: "weightKg" as const, label: copy.trends.weight, unit: "kg" as const },
  ];

  return (
    <>
      <header className="ap-head">
        <h1>{copy.trends.title}</h1>
        <p className="ap-lede">{copy.trends.body}</p>
        <p className="ap-eyebrow numeric">
          {data.dayCount} {copy.trends.days}
        </p>
      </header>

      <div className="ap-trends">
        {charts.map((chart) => (
          <TrendChart
            key={chart.key}
            label={chart.label}
            averageLabel={copy.trends.average}
            emptyLabel={copy.trends.noData}
            points={series.map((day) => ({ date: day.date, value: day[chart.key] }))}
            unit={chart.unit}
          />
        ))}
      </div>
    </>
  );
}
