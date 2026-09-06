import assert from "node:assert/strict";
import { describe, it } from "vitest";
import type { Exercise } from "../catalog";
import { incrementFor, repTarget, setCount, suggestNext, type SessionHistory } from "../progression";

const squat: Exercise = { name: "Back squat", scheme: "5×3", cue: "", restSeconds: 180 };
const curl: Exercise = { name: "Bicep curl", scheme: "3×10", cue: "", restSeconds: 60 };

/** A performance where every set was completed at one weight and rep count. */
function clean(exercise: string, sets: number, reps: number, weightKg: number, daysAgo = 7): SessionHistory {
  return {
    completedAt: new Date(Date.now() - daysAgo * 86_400_000).toISOString(),
    entries: [{ exercise, sets: Array.from({ length: sets }, () => ({ reps, weightKg, done: true })) }],
  };
}

describe("scheme parsing", () => {
  it("reads sets and reps the way a coach writes them", () => {
    assert.equal(setCount("5×3"), 5);
    assert.equal(repTarget("5×3"), 3);
    assert.equal(setCount("3×10 each side"), 3);
    assert.equal(repTarget("3×10 each side"), 10);
  });

  it("falls back to three sets rather than guessing wildly", () => {
    assert.equal(setCount("AMRAP"), 3);
    assert.equal(repTarget("AMRAP"), null);
  });
});

describe("increments", () => {
  it("moves a squat further than a curl", () => {
    // The same absolute jump is 2% of a squat and 25% of a lateral raise.
    assert.ok(incrementFor("Back squat") > incrementFor("Bicep curl"));
  });

  it("has a sane default for an unrecognised movement", () => {
    assert.equal(incrementFor("Sled drag"), 1.25);
  });
});

describe("suggestNext", () => {
  it("asks for nothing on a movement never performed", () => {
    const suggestion = suggestNext(squat, []);
    assert.equal(suggestion.kind, "first");
    assert.equal(suggestion.weightKg, null);
  });

  it("adds weight when every prescribed set hit its target", () => {
    const suggestion = suggestNext(squat, [clean("Back squat", 5, 3, 100)]);
    assert.equal(suggestion.kind, "increase");
    assert.equal(suggestion.weightKg, 102.5);
  });

  it("holds when a set was left incomplete", () => {
    // Four of five sets done. The fifth is the one that decides.
    const partial: SessionHistory = {
      completedAt: new Date().toISOString(),
      entries: [{ exercise: "Back squat", sets: [
        ...Array.from({ length: 4 }, () => ({ reps: 3, weightKg: 100, done: true })),
        { reps: null, weightKg: 100, done: false },
      ] }],
    };
    const suggestion = suggestNext(squat, [partial]);
    assert.equal(suggestion.kind, "hold");
    assert.equal(suggestion.weightKg, 100);
  });

  it("holds when the reps fell short of the target", () => {
    const short = clean("Back squat", 5, 2, 100);
    const suggestion = suggestNext(squat, [short]);
    assert.equal(suggestion.kind, "hold");
  });

  it("deloads after three sessions stuck at the same weight", () => {
    const stuck = [clean("Back squat", 5, 2, 100, 7), clean("Back squat", 5, 2, 100, 14), clean("Back squat", 5, 2, 100, 21)];
    const suggestion = suggestNext(squat, stuck);
    assert.equal(suggestion.kind, "deload");
    assert.equal(suggestion.weightKg, 90);
  });

  it("does not call it a stall when the weight was already dropped", () => {
    // Building back up after a deload is progress, not a plateau.
    const rebuilding = [clean("Back squat", 5, 2, 90, 7), clean("Back squat", 5, 2, 100, 14), clean("Back squat", 5, 2, 100, 21)];
    assert.equal(suggestNext(squat, rebuilding).kind, "hold");
  });

  it("never suggests a weight that cannot be loaded", () => {
    const suggestion = suggestNext(curl, [clean("Bicep curl", 3, 10, 12.3)]);
    assert.ok(suggestion.weightKg != null);
    assert.equal((suggestion.weightKg as number) * 4 % 1, 0, `${suggestion.weightKg} is not loadable`);
  });

  it("refuses to progress when the sets disagree about the weight", () => {
    // A ramped or dropped set is not evidence that the top weight was easy.
    const ramped: SessionHistory = {
      completedAt: new Date().toISOString(),
      entries: [{ exercise: "Back squat", sets: [
        { reps: 3, weightKg: 90, done: true },
        { reps: 3, weightKg: 95, done: true },
        { reps: 3, weightKg: 100, done: true },
        { reps: 3, weightKg: 100, done: true },
        { reps: 3, weightKg: 100, done: true },
      ] }],
    };
    assert.equal(suggestNext(squat, [ramped]).kind, "hold");
  });

  it("gives a reason a member can read", () => {
    for (const history of [[], [clean("Back squat", 5, 3, 100)], [clean("Back squat", 5, 1, 100)]]) {
      const suggestion = suggestNext(squat, history);
      assert.ok(suggestion.reason.length > 10, "empty reason");
      assert.ok(!suggestion.reason.includes("undefined"), suggestion.reason);
    }
  });
});
