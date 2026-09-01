/** Formatting shared by the screens. Numbers are the product; they render the same everywhere. */

export function duration(minutes: number | null): string {
  if (minutes == null) return "—";
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  return hours > 0 ? `${hours}h ${String(mins).padStart(2, "0")}m` : `${mins}m`;
}

export function weight(kg: number | null, units: string): string {
  if (kg == null) return "—";
  return units === "imperial" ? `${(kg * 2.20462).toFixed(1)} lb` : `${kg.toFixed(1)} kg`;
}

export function dayLabel(iso: string): string {
  const date = new Date(iso);
  const today = new Date();
  const diff = Math.round((today.setHours(0, 0, 0, 0) - new Date(iso).setHours(0, 0, 0, 0)) / 86_400_000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  return date.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "short" });
}

export function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

/** "6 nights of sleep, 3 weigh-ins" reads better than "6" and "3". */
export function plural(count: number, one: string, many = `${one}s`): string {
  return `${count} ${count === 1 ? one : many}`;
}

/** Import sources are stored as keys; nobody wants to read "apple_health". */
const SOURCE_NAMES: Record<string, string> = {
  apple_health: "Apple Health",
  google_fit: "Google Fit",
  health_connect: "Health Connect",
  samsung_health: "Samsung Health",
  garmin: "Garmin",
  strava: "Strava",
  fitbit: "Fitbit",
  oura: "Oura",
  whoop: "Whoop",
  inbody: "InBody",
  terrifit: "Terrifit V1",
  manual: "Entered by hand",
  csv: "Spreadsheet",
};

export function sourceName(key: string): string {
  return SOURCE_NAMES[key] ?? key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
