import assert from "node:assert/strict";
import { describe, it } from "vitest";
import { tScore, type DailyMetric } from "../scores";

/** Builds a run of days, newest first, which is the order everything expects. */
function series(count: number, shape: (index: number) => Partial<DailyMetric>): DailyMetric[] {
  return Array.from({ length: count }, (_, index) => ({
    date: new Date(Date.UTC(2026, 0, 60 - index)),
    restingHr: null,
    averageHr: null,
    hrvMs: null,
    sleepMinutes: null,
    steps: null,
    activeKcal: null,
    weightKg: null,
    respiratoryRate: null,
    spo2: null,
    ...shape(index),
  }));
}

describe("tScore", () => {
  it("scores from the absolute rate alone when there is no history", () => {
    const [today] = series(1, () => ({ steps: 10_000, activeKcal: 500 }));
    const score = tScore(today, [], "moderate");
    // Both targets met exactly, and the two personal components dropped out.
    assert.equal(score.value, 100);
    assert.ok(score.missing.includes("Against your usual"));
    assert.ok(score.missing.includes("Direction"));
  });

  it("does not hand a sedentary week a perfect score for matching itself", () => {
    const days = series(31, () => ({ steps: 2_000, activeKcal: 100 }));
    const [today, ...rest] = days;
    const score = tScore(today, rest, "moderate");
    assert.ok(score.value !== null && score.value < 50, `expected well under 50, got ${score.value}`);
  });

  it("rewards a day that beats the member's own baseline", () => {
    const history = series(30, () => ({ steps: 6_000, activeKcal: 300 }));
    const [flat] = series(1, () => ({ steps: 6_000, activeKcal: 300 }));
    const [big] = series(1, () => ({ steps: 12_000, activeKcal: 600 }));
    const normal = tScore(flat, history, "moderate").value;
    const heavy = tScore(big, history, "moderate").value;
    assert.ok(normal !== null && heavy !== null && heavy > normal);
  });

  it("reads a rising week as a better direction than a falling one", () => {
    // Newest first: the last 7 days are heavy, the three weeks before are light.
    const rising = series(29, (index) => ({ steps: index < 7 ? 12_000 : 6_000, activeKcal: index < 7 ? 600 : 300 }));
    const falling = series(29, (index) => ({ steps: index < 7 ? 6_000 : 12_000, activeKcal: index < 7 ? 300 : 600 }));

    const up = tScore(rising[0], rising.slice(1), "moderate");
    const down = tScore(falling[0], falling.slice(1), "moderate");

    const direction = (score: typeof up) => score.inputs.find((input) => input.label === "Direction");
    assert.ok((direction(up)?.contribution ?? 0) > (direction(down)?.contribution ?? 100));
  });

  it("needs a fortnight of prior days before it reports a direction at all", () => {
    const days = series(8, () => ({ steps: 8_000, activeKcal: 400 }));
    const score = tScore(days[0], days.slice(1), "moderate");
    assert.ok(score.missing.includes("Direction"));
  });
});
