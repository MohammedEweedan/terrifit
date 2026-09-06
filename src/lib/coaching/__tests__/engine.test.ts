import { describe, expect, it } from "vitest";
import { localDay, matchingProposal, proposeSession, recentProgress } from "../engine";
import type { Session } from "@/lib/maps/catalog";
const session: Session = { id: "test", name: "Strength", day: 1, minutes: 50, strain: 10, focus: "Strength", exercises: Array.from({length: 5}, (_, i) => ({name: `Exercise ${i}`, scheme: "3 × 8", cue: "Controlled", restSeconds: 90})) };
const base = { id: "draft", slot: "slot", session, checkIn: { minutes: 35, feeling: "ready" as const }, hasConstraints: false };
describe("reviewable coaching", () => {
  it("reduces only whole exercises, preserving effort, sets and rest without mutating the catalogue", () => {
    const draft = proposeSession(base);
    expect(draft.kind).toBe("shorter"); expect(draft.session?.minutes).toBeLessThanOrEqual(35);
    expect(draft.session?.exercises).toEqual(session.exercises.slice(0, 3));
    expect(session.exercises).toHaveLength(5);
  });
  it("pauses for pain or existing constraints without issuing an adapted workout", () => {
    expect(proposeSession({...base, checkIn: {minutes: 50, feeling: "pain"}}).session).toBeNull();
    expect(proposeSession({...base, hasConstraints: true}).kind).toBe("rest");
  });
  it("will not compress rest into an impossible time budget or add intensity for spare time", () => {
    expect(proposeSession({...base, checkIn: {minutes: 15, feeling: "ready"}}).kind).toBe("rest");
    expect(proposeSession({...base, checkIn: {minutes: 90, feeling: "ready"}}).session).toEqual(session);
    expect(proposeSession({...base, checkIn: {minutes: 90, feeling: "tired"}}).session?.exercises.length).toBeLessThan(5);
  });
  it("invalidates proposals after the programme position changes", () => {
    expect(matchingProposal(proposeSession(base), "different-slot")).toBeNull();
  });
  it("uses the member's date across UTC boundaries and counts only the visible seven days", () => {
    expect(localDay(new Date("2026-09-05T23:30:00Z"), "Asia/Tokyo")).toBe("2026-09-06");
    const progress = recentProgress([
      {completedAt:new Date("2026-09-05T23:30:00Z"),durationSeconds:1200},
      {completedAt:new Date("2026-08-29T12:00:00Z"),durationSeconds:500},
    ], "2026-09-06", "Asia/Tokyo");
    expect(progress.sessions).toBe(1); expect(progress.minutes).toBe(20); expect(progress.days[6].sessions).toBe(1);
  });
});
