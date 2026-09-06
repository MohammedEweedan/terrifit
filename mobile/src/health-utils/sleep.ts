export type SleepSample = { startDate: string | Date; endDate: string | Date; value: number };

/** Apple Health: 0 in bed, 1 asleep unspecified, 2 awake, 3 core, 4 deep, 5 REM.
 * Union overlapping asleep intervals, including duplicate device/app records,
 * before attributing each continuous interval to its local end date.
 */
export function sleepTotals(samples: SleepSample[], timezone: string): Map<string, number> {
  const asleep = new Set([1, 3, 4, 5]);
  const intervals = samples.filter(s => asleep.has(s.value)).map(s => [new Date(s.startDate).getTime(), new Date(s.endDate).getTime()] as [number, number])
    .filter(([a, b]) => Number.isFinite(a) && Number.isFinite(b) && b > a).sort((a, b) => a[0] - b[0]);
  const merged: Array<[number, number]> = [];
  for (const [start, end] of intervals) {
    const last = merged[merged.length - 1];
    if (last && start <= last[1]) last[1] = Math.max(last[1], end);
    else merged.push([start, end]);
  }
  const totals = new Map<string, number>();
  const format = new Intl.DateTimeFormat("en-CA", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit" });
  for (const [start, end] of merged) {
    const key = `${format.format(new Date(end))}T00:00:00.000Z`;
    totals.set(key, (totals.get(key) ?? 0) + (end - start) / 60_000);
  }
  return totals;
}
