import type { Session } from "@/lib/maps/catalog";

export const ENGINE_VERSION = "guided-1";
export type CheckIn = { minutes: number; feeling: "ready" | "tired" | "pain" };
export type Proposal = {
  id: string;
  slot: string;
  engineVersion: string;
  checkIn: CheckIn;
  kind: "shorter" | "original" | "rest";
  title: string;
  reason: string;
  changes: string[];
  originalMinutes: number;
  session: Session | null;
};
export type CoachState = { draft?: Proposal | null; applied?: Proposal | null };

export function localDay(date: Date, timezone?: string | null): string {
  try {
    return new Intl.DateTimeFormat("en-CA", { timeZone: timezone || "UTC", year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
  } catch {
    return date.toISOString().slice(0, 10);
  }
}

/** Preserve exercise order, effort and rest. Only remove complete trailing work.
 * Duration is an estimate; never compress rest to promise a time budget.
 * No medical interpretation or automatic progression happens in this engine.
 */
export function proposeSession(input: {
  id: string; slot: string; session: Session; checkIn: CheckIn; hasConstraints: boolean;
}): Proposal {
  const { session, checkIn } = input;
  const base = { id: input.id, slot: input.slot, engineVersion: ENGINE_VERSION, checkIn, originalMinutes: session.minutes };
  if (checkIn.feeling === "pain" || input.hasConstraints) {
    return { ...base, kind: "rest", title: "Pause the session", session: null,
      reason: checkIn.feeling === "pain"
        ? "You reported pain or feeling unwell. This coach cannot assess the cause or clear you to train. Pause and seek appropriate professional advice before continuing."
        : "Your profile includes a health or injury constraint. This coach cannot safely adapt a programme to that constraint. Review it with a qualified professional before training.",
      changes: ["No workout is prescribed.", "Your programme position stays the same."] };
  }
  const budget = Math.min(checkIn.minutes, checkIn.feeling === "tired" ? Math.floor(session.minutes * 0.7) : session.minutes);
  if (budget >= session.minutes) return { ...base, kind: "original", title: "Keep your next session", session: structuredClone(session), reason: "Your time fits the scheduled session. The original exercises, effort and rest stay in place. Stop if you develop pain or feel unwell.", changes: ["Original session retained."] };
  // Reserve time for preparation and transitions instead of assuming every
  // minute is removable work. A minimum of two exercises prevents token plans.
  const overhead = 10;
  const count = session.exercises.length;
  const perExercise = Math.max(1, (session.minutes - overhead) / Math.max(1, count));
  const keep = Math.min(count, Math.floor((budget - overhead) / perExercise));
  if (keep < 2 || keep >= count) {
    return { ...base, kind: "rest", title: "Make room for another day", session: null,
      reason: "There is not enough time to shorten this session while keeping preparation and rest. You can leave the programme where it is and return when you have more time.",
      changes: ["No rushed workout.", "Your programme position stays the same."] };
  }
  const next = { ...structuredClone(session), minutes: Math.ceil(overhead + keep * perExercise), exercises: structuredClone(session.exercises.slice(0, keep)) };
  return { ...base, kind: "shorter", title: "A little less, still intentional", session: next,
    reason: checkIn.feeling === "tired" ? "You reported low energy. This option reduces total work without raising effort or cutting rest. The duration is an estimate; take more time if needed." : "Keep the opening exercises and leave the final work for another session. Rest and effort targets stay unchanged. Duration is an estimate, not a deadline.",
    changes: [`Keep ${keep} of ${count} exercises in their original order.`, `Leave out: ${session.exercises.slice(keep).map(e => e.name).join(", ")}.`, "Keep the original sets, effort targets and rest periods."] };
}

export function matchingProposal(proposal: Proposal | null | undefined, slot: string | null): Proposal | null {
  return proposal?.slot === slot ? proposal : null;
}

export function recentProgress(logs: Array<{ completedAt: Date; durationSeconds: number | null }>, day: string, timezone?: string | null) {
  const days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(`${day}T12:00:00Z`);
    date.setUTCDate(date.getUTCDate() - (6 - i));
    return { date: date.toISOString().slice(0, 10), sessions: 0, minutes: 0 };
  });
  for (const log of logs) {
    const bucket = days.find(d => d.date === localDay(log.completedAt, timezone));
    if (bucket) { bucket.sessions += 1; bucket.minutes += Math.round((log.durationSeconds ?? 0) / 60); }
  }
  return { days, sessions: days.reduce((sum, d) => sum + d.sessions, 0), minutes: days.reduce((sum, d) => sum + d.minutes, 0), activeDays: days.filter(d => d.sessions > 0).length };
}
