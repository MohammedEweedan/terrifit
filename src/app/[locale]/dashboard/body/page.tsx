import { notFound, redirect } from "next/navigation";
import { isLocale, localeMeta } from "@/i18n/config";
import { getPagesCopy } from "@/i18n/pages";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function BodyPage({ params }: PageProps<"/[locale]/app/body">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/signin`);

  const copy = getPagesCopy(locale).app;
  const scans = await prisma.bodyScan.findMany({
    where: { userId: user.id },
    orderBy: { takenAt: "desc" },
    take: 40,
  });

  const date = (value: Date) =>
    new Intl.DateTimeFormat(localeMeta[locale].htmlLang, { dateStyle: "medium" }).format(value);

  const first = scans.at(-1);
  const latest = scans[0];
  const delta = (key: "weightKg" | "bodyFatPercent" | "skeletalMuscleKg") => {
    if (!first || !latest || first === latest) return null;
    const a = first[key];
    const b = latest[key];
    if (a === null || b === null) return null;
    return b - a;
  };

  return (
    <>
      <header className="ap-head">
        <h1>{copy.body.title}</h1>
        <p className="ap-lede">{copy.body.body}</p>
      </header>

      {scans.length === 0 ? (
        <p className="ap-nodata ap-panel">{copy.body.empty}</p>
      ) : (
        <>
          <div className="ap-deltas">
            {([
              ["weightKg", copy.body.columns[1], "kg"],
              ["bodyFatPercent", copy.body.columns[2], "%"],
              ["skeletalMuscleKg", copy.body.columns[3], "kg"],
            ] as const).map(([key, label, unit]) => {
              const change = delta(key);
              const current = latest?.[key];
              return (
                <div key={key}>
                  <span>{label}</span>
                  <strong className="numeric">
                    {current === null || current === undefined ? "—" : `${current.toFixed(1)}${unit}`}
                  </strong>
                  {change === null ? null : (
                    <em className={change < 0 ? "is-down" : "is-up"}>
                      {change > 0 ? "+" : ""}
                      {change.toFixed(1)}
                      {unit} · {copy.body.change.toLowerCase()}
                    </em>
                  )}
                </div>
              );
            })}
          </div>

          <div className="ap-panel ap-scroller">
            <table className="ap-table">
              <thead>
                <tr>
                  {copy.body.columns.map((column, index) => (
                    <th key={column} scope="col" className={index > 0 ? "num" : undefined}>
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {scans.map((scan) => (
                  <tr key={scan.id}>
                    <th scope="row">{date(scan.takenAt)}</th>
                    <td className="num">{scan.weightKg?.toFixed(1) ?? "—"}</td>
                    <td className="num">{scan.bodyFatPercent?.toFixed(1) ?? "—"}</td>
                    <td className="num">{scan.skeletalMuscleKg?.toFixed(1) ?? "—"}</td>
                    <td className="num">{scan.bodyWaterL?.toFixed(1) ?? "—"}</td>
                    <td className="num">{scan.score ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  );
}
