import { randomUUID, createHash } from "node:crypto";
import { prisma } from "@/lib/db";
import { findMap } from "@/lib/maps/catalog";
import { localDay, matchingProposal, proposeSession, recentProgress, type CheckIn, type CoachState } from "./engine";

export class CoachingConflict extends Error {}

export async function coachingContext(userId: string, now = new Date()) {
  const [profile, enrollment, logs] = await Promise.all([
    prisma.profile.findUnique({ where: { userId } }),
    prisma.mapEnrollment.findFirst({ where: { userId, completedAt: null }, orderBy: { startedAt: "desc" } }),
    prisma.sessionLog.findMany({ where: { userId, completedAt: { gte: new Date(now.getTime() - 8 * 86400000) } }, orderBy: { completedAt: "desc" }, select: { completedAt: true, durationSeconds: true } }),
  ]);
  const day = localDay(now, profile?.timezone);
  const map = enrollment ? findMap(enrollment.mapId) : null;
  const session = map && enrollment ? map.sample[enrollment.done % map.sample.length] : null;
  // Catalogue edits invalidate old proposals too: a saved plan cannot silently
  // refer to exercises that changed after it was reviewed.
  const slot = enrollment && session ? createHash("sha256").update(JSON.stringify([enrollment.id, enrollment.startedAt, enrollment.week, enrollment.done, session])).digest("hex") : null;
  let hasConstraints = false;
  try { hasConstraints = Boolean(JSON.parse(profile?.healthConditions || "[]").length); } catch { hasConstraints = true; }
  return { day, slot, hasConstraints, targetDays: profile?.trainingDays ?? map?.sessionsPerWeek ?? 3,
    next: map && enrollment && session ? { mapId: map.id, mapName: map.name, week: enrollment.week, weeks: map.weeks, done: enrollment.done, sessionsPerWeek: map.sessionsPerWeek, session } : null,
    progress: recentProgress(logs, day, profile?.timezone),
  };
}

function readState(raw?: string): CoachState {
  try { return JSON.parse(raw || "{}") as CoachState; } catch { return {}; }
}

export async function loadCoaching(userId: string) {
  const context = await coachingContext(userId);
  const record = await prisma.coachingPlan.findUnique({ where: { userId_day: { userId, day: context.day } } });
  const state = readState(record?.state);
  return { ...context, mode: "guided" as const, revision: record?.revision ?? 0,
    draft: matchingProposal(state.draft, context.slot), applied: matchingProposal(state.applied, context.slot) };
}
export type CoachingDashboard = Awaited<ReturnType<typeof loadCoaching>>;

export type CoachingAction =
  | { action: "propose"; revision: number; day: string; slot: string; checkIn: CheckIn }
  | { action: "apply"; revision: number; day: string; slot: string; proposalId: string }
  | { action: "undo"; revision: number; day: string; slot: string };

export async function changeCoaching(userId: string, action: CoachingAction) {
  const context = await coachingContext(userId);
  if (context.day !== action.day || context.slot !== action.slot || !context.next) throw new CoachingConflict("Your next session changed. Refresh and review it again.");
  await prisma.$transaction(async tx => {
    const record = await tx.coachingPlan.upsert({ where: { userId_day: { userId, day: context.day } }, create: { userId, day: context.day }, update: {} });
    if (record.revision !== action.revision) throw new CoachingConflict("This plan was updated elsewhere. Refresh before making another change.");
    const current = readState(record.state);
    const state: CoachState = { draft: matchingProposal(current.draft, context.slot), applied: matchingProposal(current.applied, context.slot) };
    if (action.action === "propose") {
      state.draft = proposeSession({ id: randomUUID(), slot: context.slot!, session: context.next!.session, checkIn: action.checkIn, hasConstraints: context.hasConstraints });
    } else if (action.action === "apply") {
      if (!state.draft || state.draft.id !== action.proposalId) throw new CoachingConflict("That proposal is no longer available. Review a new one.");
      // A profile constraint added after drafting must not be bypassed.
      if (context.hasConstraints && state.draft.kind !== "rest") throw new CoachingConflict("Your training constraints changed. Review a new proposal.");
      state.applied = state.draft; state.draft = null;
    } else {
      state.applied = null; state.draft = null;
    }
    const revision = record.revision + 1;
    const saved = await tx.coachingPlan.updateMany({ where: { id: record.id, revision: action.revision }, data: { state: JSON.stringify(state), revision } });
    if (saved.count !== 1) throw new CoachingConflict("This plan changed while you were reviewing it. Refresh to continue.");
    await tx.coachingEvent.create({ data: { planId: record.id, revision, action: action.action, snapshot: JSON.stringify({ state, slot: context.slot, original: context.next?.session }) } });
  });
  return loadCoaching(userId);
}
