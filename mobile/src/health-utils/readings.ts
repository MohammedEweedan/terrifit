/**
 * Did a Health import actually return anything?
 *
 * Days are created for the whole requested window whether or not they carry
 * readings, so a non-empty array is not evidence that anything was readable.
 * Apple also never tells an app that a read type was denied — it returns an
 * empty result, indistinguishable from somebody who simply has no data — so
 * this is the only signal available, and the message it drives has to name
 * both possibilities rather than pick one.
 */
export function hasAnyReading(days: Array<Record<string, unknown>>): boolean {
  return days.some((day) =>
    Object.entries(day).some(([key, value]) => key !== "date" && value != null),
  );
}
