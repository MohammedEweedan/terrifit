export type CompositionReading = {
  takenAt: string | Date; source: string; deviceId?: string | null;
  weightKg: number | null; bodyFatPercent: number | null;
  muscleMassKg?: number | null; skeletalMuscleKg: number | null;
};

/** Compare like-for-like sources, not a DEXA result against a home BIA scale. */
export function compositionChange<T extends CompositionReading>(readings: readonly T[]) {
  const sorted = [...readings].filter(row => Number.isFinite(new Date(row.takenAt).getTime())).sort((a, b) => +new Date(b.takenAt) - +new Date(a.takenAt));
  const latest = sorted[0] ?? null;
  const previous = latest ? sorted.find(row => +new Date(row.takenAt) < +new Date(latest.takenAt) && row.source === latest.source && (row.deviceId ?? null) === (latest.deviceId ?? null)) ?? null : null;
  const delta = (current: number | null | undefined, before: number | null | undefined) => current != null && before != null ? Math.round((current - before) * 100) / 100 : null;
  return { latest, previous, weightKg: delta(latest?.weightKg, previous?.weightKg), bodyFatPoints: delta(latest?.bodyFatPercent, previous?.bodyFatPercent), muscleMassKg: delta(latest?.muscleMassKg, previous?.muscleMassKg) };
}
