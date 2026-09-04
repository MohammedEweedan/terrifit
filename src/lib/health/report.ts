import type { Dashboard } from "./dashboard";

export type ReportSection =
  | "summary" | "recovery" | "sleep" | "activity" | "body" | "fitnessAge" | "insights";

export const REPORT_SECTIONS: ReportSection[] = [
  "summary", "fitnessAge", "recovery", "sleep", "activity", "body", "insights",
];

export const SECTION_TITLES: Record<ReportSection, string> = {
  summary: "Summary",
  fitnessAge: "Fitness age",
  recovery: "Recovery",
  sleep: "Sleep",
  activity: "Activity",
  body: "Body",
  insights: "Insights",
};

type Row = Dashboard["history"][number];

const mean = (values: number[]) =>
  values.length === 0 ? null : values.reduce((sum, value) => sum + value, 0) / values.length;

const pick = (rows: Row[], read: (row: Row) => number | null) =>
  rows.map(read).filter((value): value is number => value != null);

function stat(rows: Row[], read: (row: Row) => number | null, format: (value: number) => string) {
  const values = pick(rows, read);
  if (values.length === 0) return { average: "—", best: "—", worst: "—", days: 0 };
  const average = mean(values);
  return {
    average: average == null ? "—" : format(average),
    best: format(Math.max(...values)),
    worst: format(Math.min(...values)),
    days: values.length,
  };
}

const hhmm = (minutes: number) =>
  `${Math.floor(minutes / 60)}h ${String(Math.round(minutes % 60)).padStart(2, "0")}m`;

/**
 * A report, built from the same dashboard payload the app draws.
 *
 * Derived here rather than in the client so a printed report and the screen it
 * came from can never disagree — and so the figures carry the same caveats.
 * Every section states how many days it is averaging over, because an average
 * of three days and an average of ninety are not the same claim.
 */
export function buildReport(
  data: Dashboard,
  options: { sections: ReportSection[]; days: number; name: string; units: "metric" | "imperial" },
) {
  const rows = data.history.slice(0, options.days);
  const weight = (kg: number) =>
    options.units === "imperial" ? `${(kg * 2.2046226218).toFixed(1)} lb` : `${kg.toFixed(1)} kg`;

  const blocks: Array<{ id: ReportSection; title: string; rows: Array<[string, string]>; note?: string }> = [];

  const want = (id: ReportSection) => options.sections.includes(id);

  if (want("summary")) {
    blocks.push({
      id: "summary",
      title: SECTION_TITLES.summary,
      rows: [
        ["Days of data", String(data.dayCount)],
        ["Covered by this report", `${rows.length} days`],
        ["Sources", data.sources.length ? data.sources.join(", ") : "None connected"],
        ["Plan", data.plan.plan],
      ],
    });
  }

  if (want("fitnessAge") && data.advanced.fitnessAge?.years != null) {
    const age = data.advanced.fitnessAge;
    blocks.push({
      id: "fitnessAge",
      title: SECTION_TITLES.fitnessAge,
      rows: [
        ["Estimate", `${age.years} years`],
        ["Your age", age.chronological == null ? "—" : `${age.chronological} years`],
        ["Difference", age.delta == null ? "—" : `${age.delta > 0 ? "+" : ""}${age.delta} years`],
        ["VO₂max", age.vo2max == null ? "—" : `${age.vo2max} ml/kg/min`],
      ],
      note: age.caveat,
    });
  }

  if (want("recovery")) {
    const recovery = stat(rows, (row) => row.recovery, (v) => `${Math.round(v)}%`);
    const hrv = stat(rows, (row) => row.hrvMs, (v) => `${Math.round(v)} ms`);
    const resting = stat(rows, (row) => row.restingHr, (v) => `${Math.round(v)} bpm`);
    blocks.push({
      id: "recovery",
      title: SECTION_TITLES.recovery,
      rows: [
        ["Recovery, average", recovery.average],
        ["Recovery, best", recovery.best],
        ["Recovery, worst", recovery.worst],
        ["HRV, average", hrv.average],
        ["Resting heart rate, average", resting.average],
      ],
      note: `Averaged over ${recovery.days} days with a reading.`,
    });
  }

  if (want("sleep")) {
    const sleep = stat(rows, (row) => row.sleepMinutes, hhmm);
    blocks.push({
      id: "sleep",
      title: SECTION_TITLES.sleep,
      rows: [
        ["Average night", sleep.average],
        ["Longest", sleep.best],
        ["Shortest", sleep.worst],
        ["Nights recorded", String(sleep.days)],
      ],
    });
  }

  if (want("activity")) {
    const steps = stat(rows, (row) => row.steps, (v) => Math.round(v).toLocaleString());
    const kcal = stat(rows, (row) => row.activeKcal, (v) => `${Math.round(v)} kcal`);
    const tScore = stat(rows, (row) => row.tScore, (v) => String(Math.round(v)));
    blocks.push({
      id: "activity",
      title: SECTION_TITLES.activity,
      rows: [
        ["Steps, daily average", steps.average],
        ["Steps, best day", steps.best],
        ["Active energy, daily average", kcal.average],
        ["T Score, average", tScore.average],
      ],
    });
  }

  if (want("body")) {
    const values = pick(rows, (row) => row.weightKg);
    const first = values.at(-1);
    const last = values[0];
    blocks.push({
      id: "body",
      title: SECTION_TITLES.body,
      rows: [
        ["Latest weight", last == null ? "—" : weight(last)],
        ["At the start of this period", first == null ? "—" : weight(first)],
        [
          "Change",
          first == null || last == null ? "—" : `${last - first > 0 ? "+" : ""}${weight(Math.abs(last - first)).replace(/^/, last - first < 0 ? "−" : "")}`,
        ],
        ["Weigh-ins recorded", String(values.length)],
      ],
    });
  }

  if (want("insights") && data.advanced.insights.length > 0) {
    blocks.push({
      id: "insights",
      title: SECTION_TITLES.insights,
      rows: data.advanced.insights.map((insight) => [insight.title, insight.action] as [string, string]),
      note: "Findings from your own history. Each one names the numbers behind it in the app.",
    });
  }

  return {
    name: options.name,
    generatedAt: new Date().toISOString(),
    period: `${rows.length} days to ${rows[0]?.date?.slice(0, 10) ?? "today"}`,
    blocks,
  };
}

/** The daily rows, for anyone who wants the numbers rather than the summary. */
export function reportCsv(data: Dashboard, days: number): string {
  const header = [
    "date", "recovery", "tScore", "hrvMs", "restingHr", "averageHr",
    "sleepMinutes", "steps", "activeKcal", "weightKg", "fitnessAge",
  ];
  const lines = data.history.slice(0, days).map((row) =>
    [
      row.date.slice(0, 10),
      row.recovery, row.tScore, row.hrvMs, row.restingHr, row.averageHr,
      row.sleepMinutes, row.steps, row.activeKcal, row.weightKg, row.fitnessAge,
    ]
      // Empty rather than "null": a spreadsheet treats a blank as missing and
      // the word "null" as text, which then poisons every formula in the column.
      .map((value) => (value == null ? "" : String(value)))
      .join(","),
  );
  return [header.join(","), ...lines].join("\n");
}
