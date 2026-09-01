/**
 * Reading a health export.
 *
 * People arrive with whatever their last app gave them: an Apple Health XML
 * dump, a Google Takeout JSON file, an InBody result sheet as CSV, or a
 * spreadsheet they keep by hand. Rather than demand one format, this sniffs the
 * file and maps the columns it recognises, ignoring everything else.
 *
 * Everything is normalised to SI and to a UTC day, because the whole point of
 * importing is that two sources become comparable.
 */

export type MetricRow = {
  date: Date;
  restingHr?: number;
  hrvMs?: number;
  sleepMinutes?: number;
  steps?: number;
  activeKcal?: number;
  weightKg?: number;
  respiratoryRate?: number;
  spo2?: number;
};

export type ScanRow = {
  takenAt: Date;
  source: string;
  weightKg?: number;
  bodyFatPercent?: number;
  skeletalMuscleKg?: number;
  leanMassKg?: number;
  bodyWaterL?: number;
  visceralFatLevel?: number;
  basalMetabolicRate?: number;
  score?: number;
  raw?: string;
};

export type ParsedImport = { metrics: MetricRow[]; scans: ScanRow[]; format: string };

/** Midnight UTC, so two sources describing the same day collide correctly. */
function toUtcDay(value: Date): Date {
  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
}

function parseDate(value: string): Date | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  // Apple writes "2024-03-11 07:12:03 +0000"; Date handles it once the space
  // before the offset is a T.
  const normalised = /^\d{4}-\d{2}-\d{2} /.test(trimmed) ? trimmed.replace(" ", "T") : trimmed;
  const parsed = new Date(normalised);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function num(value: unknown): number | undefined {
  if (value === null || value === undefined || value === "") return undefined;
  const parsed = typeof value === "number" ? value : Number(String(value).replace(/[^0-9.\-]/g, ""));
  return Number.isFinite(parsed) ? parsed : undefined;
}

const LB_TO_KG = 0.45359237;

/* -------------------------------------------------------------------------- */

export function parseHealthFile(filename: string, text: string, provider: string): ParsedImport {
  const head = text.slice(0, 4000).trimStart();

  if (head.startsWith("<?xml") || head.includes("<HealthData")) return parseAppleHealthXml(text);
  if (head.startsWith("{") || head.startsWith("[")) return parseJson(text, provider);
  return parseCsv(text, provider, filename);
}

/* --- Apple Health -------------------------------------------------------- */

/** The numeric fields of a MetricRow — everything except the day itself. */
type NumericMetric = Exclude<keyof MetricRow, "date">;

const APPLE_TYPES: Record<string, NumericMetric> = {
  HKQuantityTypeIdentifierRestingHeartRate: "restingHr",
  HKQuantityTypeIdentifierHeartRateVariabilitySDNN: "hrvMs",
  HKQuantityTypeIdentifierStepCount: "steps",
  HKQuantityTypeIdentifierActiveEnergyBurned: "activeKcal",
  HKQuantityTypeIdentifierBodyMass: "weightKg",
  HKQuantityTypeIdentifierRespiratoryRate: "respiratoryRate",
  HKQuantityTypeIdentifierOxygenSaturation: "spo2",
};

/**
 * Apple's export is one giant XML file with millions of `<Record>` elements.
 * A DOM parse would need gigabytes, so this scans with a regex and folds the
 * records it cares about into a per-day accumulator as it goes.
 */
function parseAppleHealthXml(text: string): ParsedImport {
  const byDay = new Map<string, { row: MetricRow; counts: Partial<Record<NumericMetric, number>> }>();
  const record = /<Record\s+type="([^"]+)"[^>]*?(?:unit="([^"]*)")?[^>]*?startDate="([^"]+)"[^>]*?value="([^"]+)"/g;

  let match: RegExpExecArray | null;
  while ((match = record.exec(text)) !== null) {
    const [, type, unit, startDate, rawValue] = match;
    const field = APPLE_TYPES[type];
    if (!field) continue;

    const date = parseDate(startDate);
    const value = num(rawValue);
    if (!date || value === undefined) continue;

    const day = toUtcDay(date);
    const key = day.toISOString();
    const entry = byDay.get(key) ?? { row: { date: day }, counts: {} };

    if (field === "steps" || field === "activeKcal") {
      // Cumulative measures are summed across the day.
      entry.row[field] = (entry.row[field] ?? 0) + value;
    } else {
      // Point measures are averaged, so one odd reading does not become the day.
      const count = (entry.counts[field] ?? 0) + 1;
      const previous = entry.row[field] ?? 0;
      const converted = field === "weightKg" && unit === "lb" ? value * LB_TO_KG : value;
      entry.row[field] = (previous * (count - 1) + converted) / count;
      entry.counts[field] = count;
    }

    byDay.set(key, entry);
  }

  const metrics = [...byDay.values()].map(({ row }) => ({
    ...row,
    restingHr: row.restingHr === undefined ? undefined : Math.round(row.restingHr),
    steps: row.steps === undefined ? undefined : Math.round(row.steps),
    activeKcal: row.activeKcal === undefined ? undefined : Math.round(row.activeKcal),
    // Apple reports SpO2 as a fraction; everyone reads it as a percentage.
    spo2: row.spo2 === undefined ? undefined : row.spo2 <= 1 ? row.spo2 * 100 : row.spo2,
  }));

  return { metrics, scans: [], format: "apple-health-xml" };
}

/* --- JSON ---------------------------------------------------------------- */

function parseJson(text: string, provider: string): ParsedImport {
  let payload: unknown;
  try {
    payload = JSON.parse(text);
  } catch {
    return { metrics: [], scans: [], format: "json" };
  }

  // Accept a bare array, or an object with a records/data/metrics array.
  const rows = Array.isArray(payload)
    ? payload
    : ((payload as Record<string, unknown>)?.records ??
        (payload as Record<string, unknown>)?.data ??
        (payload as Record<string, unknown>)?.metrics ??
        []);

  if (!Array.isArray(rows)) return { metrics: [], scans: [], format: "json" };
  return rowsToImport(rows as Array<Record<string, unknown>>, provider, "json");
}

/* --- CSV ----------------------------------------------------------------- */

/** Splits one CSV line, honouring quoted fields containing commas. */
function splitCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"') {
      if (quoted && line[index + 1] === '"') {
        current += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if ((char === "," || char === ";" || char === "\t") && !quoted) {
      cells.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  cells.push(current);
  return cells.map((cell) => cell.trim());
}

function parseCsv(text: string, provider: string, filename: string): ParsedImport {
  const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length < 2) return { metrics: [], scans: [], format: "csv" };

  const headers = splitCsvLine(lines[0]);
  const rows = lines.slice(1).map((line) => {
    const cells = splitCsvLine(line);
    return Object.fromEntries(headers.map((header, index) => [header, cells[index] ?? ""]));
  });

  const looksLikeInBody =
    provider === "inbody" ||
    /inbody/i.test(filename) ||
    headers.some((header) => /smm|skeletal muscle|pbf|percent body fat|inbody/i.test(header));

  return rowsToImport(rows, provider, "csv", looksLikeInBody);
}

/* --- Shared mapping ------------------------------------------------------ */

/**
 * Column aliases. Deliberately generous: it costs nothing to recognise another
 * app's spelling, and every one recognised is a member who does not have to
 * rename headers in a spreadsheet.
 */
const ALIASES: Record<string, RegExp> = {
  date: /^(date|day|test ?date|测试日期|datetime|date ?time|start|recorded|timestamp)/i,
  restingHr: /(resting ?(heart ?rate|hr)|rhr)/i,
  hrvMs: /(hrv|heart ?rate ?variability|rmssd|sdnn)/i,
  sleepMinutes: /(sleep ?(duration|minutes|time|asleep)|total ?sleep)/i,
  steps: /^(steps|step ?count)/i,
  activeKcal: /(active ?(energy|calories|kcal)|calories ?burned)/i,
  weightKg: /^(weight|body ?weight|mass)/i,
  respiratoryRate: /(respirat|breath)/i,
  spo2: /(spo2|blood ?oxygen|oxygen ?saturation)/i,
  bodyFatPercent: /(pbf|percent ?body ?fat|body ?fat ?%?|bf ?%)/i,
  skeletalMuscleKg: /(smm|skeletal ?muscle)/i,
  leanMassKg: /(lean ?(body ?)?mass|ffm|fat ?free)/i,
  bodyWaterL: /(tbw|total ?body ?water|body ?water)/i,
  visceralFatLevel: /(visceral)/i,
  basalMetabolicRate: /(bmr|basal ?metabolic)/i,
  score: /(inbody ?score|score)/i,
};

function pick(row: Record<string, unknown>, field: keyof typeof ALIASES): string | undefined {
  const pattern = ALIASES[field];
  for (const [key, value] of Object.entries(row)) {
    if (pattern.test(key)) {
      const text = value === null || value === undefined ? "" : String(value);
      if (text.trim() !== "") return text;
    }
  }
  return undefined;
}

/** Weight in pounds if the column says so; otherwise assume the SI unit. */
function weightToKg(row: Record<string, unknown>, raw: string | undefined): number | undefined {
  const value = num(raw);
  if (value === undefined) return undefined;
  const usesPounds = Object.keys(row).some((key) => /^(weight|body ?weight|mass)/i.test(key) && /lb|lbs|pound/i.test(key));
  return usesPounds ? value * LB_TO_KG : value;
}

function rowsToImport(
  rows: Array<Record<string, unknown>>,
  provider: string,
  format: string,
  bodyComposition = false,
): ParsedImport {
  const metrics: MetricRow[] = [];
  const scans: ScanRow[] = [];

  for (const row of rows) {
    const when = parseDate(pick(row, "date") ?? "");
    if (!when) continue;

    const weightKg = weightToKg(row, pick(row, "weightKg"));
    const bodyFatPercent = num(pick(row, "bodyFatPercent"));
    const skeletalMuscleKg = num(pick(row, "skeletalMuscleKg"));

    // A row carrying body composition is a scan; a row of daily numbers is a
    // metric. A row can legitimately be both — a smart scale produces both.
    if (bodyComposition || bodyFatPercent !== undefined || skeletalMuscleKg !== undefined) {
      scans.push({
        takenAt: when,
        source: provider === "inbody" || bodyComposition ? "inbody" : provider,
        weightKg,
        bodyFatPercent,
        skeletalMuscleKg,
        leanMassKg: num(pick(row, "leanMassKg")),
        bodyWaterL: num(pick(row, "bodyWaterL")),
        visceralFatLevel: num(pick(row, "visceralFatLevel")),
        basalMetabolicRate: num(pick(row, "basalMetabolicRate")),
        score: num(pick(row, "score")),
        raw: JSON.stringify(row).slice(0, 2000),
      });
    }

    const metric: MetricRow = {
      date: toUtcDay(when),
      restingHr: num(pick(row, "restingHr")),
      hrvMs: num(pick(row, "hrvMs")),
      sleepMinutes: num(pick(row, "sleepMinutes")),
      steps: num(pick(row, "steps")),
      activeKcal: num(pick(row, "activeKcal")),
      weightKg,
      respiratoryRate: num(pick(row, "respiratoryRate")),
      spo2: num(pick(row, "spo2")),
    };

    const hasAny = Object.entries(metric).some(([key, value]) => key !== "date" && value !== undefined);
    if (hasAny) metrics.push(metric);
  }

  return { metrics, scans, format };
}
