import assert from "node:assert/strict";
import { describe, it } from "vitest";
import {
  bodyBattery, correlate, estimateVo2Max, fitnessAge, insights, maxHeartRate,
  sleepQuality, stressScore,
} from "../advanced";
import type { DailyMetric } from "../scores";

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

describe("maxHeartRate", () => {
  it("follows Tanaka rather than 220 minus age", () => {
    // At 40: Tanaka gives 180, the folk formula 180 — they agree here.
    assert.equal(Math.round(maxHeartRate(40)), 180);
    // At 20 they diverge: Tanaka 194, folk 200. Tanaka is the validated one.
    assert.equal(Math.round(maxHeartRate(20)), 194);
    assert.equal(Math.round(maxHeartRate(70)), 159);
  });
});

describe("estimateVo2Max", () => {
  it("rises as resting heart rate falls", () => {
    const unfit = estimateVo2Max(35, 70);
    const fit = estimateVo2Max(35, 48);
    assert.ok(fit > unfit, "a lower resting rate must estimate higher fitness");
  });

  it("lands in a plausible range for a trained 30-year-old", () => {
    const value = estimateVo2Max(30, 50);
    assert.ok(value > 50 && value < 65, `expected 50–65, got ${value}`);
  });
});

describe("fitnessAge", () => {
  const history = series(30, () => ({ restingHr: 50, activeKcal: 650, weightKg: 78 }));
  const today = history[0];

  it("reads younger than the birthday for a fit person", () => {
    const result = fitnessAge(today, history, { age: 40, sex: "male", heightCm: 180 });
    assert.ok(result.years !== null);
    assert.ok(result.delta !== null && result.delta < 0, `expected younger, got delta ${result.delta}`);
  });

  it("reads older for a high resting heart rate and no activity", () => {
    const sedentary = series(30, () => ({ restingHr: 78, activeKcal: 90, weightKg: 104 }));
    const result = fitnessAge(sedentary[0], sedentary, { age: 40, sex: "male", heightCm: 175 });
    assert.ok(result.delta !== null && result.delta > 0, `expected older, got delta ${result.delta}`);
  });

  it("never claims more than twelve years either way", () => {
    const extreme = series(30, () => ({ restingHr: 33, activeKcal: 1400, weightKg: 62 }));
    const result = fitnessAge(extreme[0], extreme, { age: 50, sex: "male", heightCm: 180 });
    assert.ok(result.delta !== null && result.delta >= -12, `delta ${result.delta} exceeds the stated limit`);

    const unfit = series(30, () => ({ restingHr: 105, activeKcal: 40, weightKg: 130 }));
    const older = fitnessAge(unfit[0], unfit, { age: 30, sex: "male", heightCm: 170 });
    assert.ok(older.delta !== null && older.delta <= 12, `delta ${older.delta} exceeds the stated limit`);
  });

  it("keeps delta consistent with the age it reports", () => {
    // The bug this guards: a 29-year-old capped at 17 was floored to 18 and
    // then reported as "11 years younger" while the cap said 12.
    const athletic = series(30, () => ({ restingHr: 50, activeKcal: 550, weightKg: 70 }));
    const result = fitnessAge(athletic[0], athletic, { age: 29, sex: "male", heightCm: 181 });
    assert.ok(result.years !== null && result.delta !== null);
    assert.equal(result.delta, (result.years as number) - 29);
  });

  it("stays believable for a fit but ordinary person", () => {
    // Resting 50 at 32 is athletic, not superhuman. The linear model said 20,
    // which is not something one number can claim.
    const fit = series(30, () => ({ restingHr: 50, activeKcal: 450, weightKg: 78 }));
    const result = fitnessAge(fit[0], fit, { age: 32, sex: "male", heightCm: 181 });
    assert.ok(result.years !== null);
    assert.ok(
      (result.years as number) >= 22,
      `a 32-year-old at 50 bpm should not read younger than 22, got ${result.years}`,
    );
  });

  it("only reports a cap at genuinely extreme readings", () => {
    const ordinary = series(30, () => ({ restingHr: 55, activeKcal: 400, weightKg: 78 }));
    assert.equal(fitnessAge(ordinary[0], ordinary, { age: 35, sex: "male", heightCm: 180 }).capped, false);

    const extreme = series(30, () => ({ restingHr: 38, activeKcal: 900, weightKg: 66 }));
    assert.equal(fitnessAge(extreme[0], extreme, { age: 35, sex: "male", heightCm: 180 }).capped, true);
  });

  it("returns your real age for a median resting heart rate", () => {
    // The property the estimator must have: feed in the population median and
    // the answer is the birthday you already knew.
    for (const [sex, median] of [["female", 74], ["male", 70]] as const) {
      const typical = series(30, () => ({ restingHr: median, activeKcal: 350, weightKg: 72 }));
      const result = fitnessAge(typical[0], typical, { age: 45, sex, heightCm: 170 });
      assert.ok(result.years !== null);
      assert.ok(
        Math.abs((result.years as number) - 45) <= 3,
        `${sex} at the median ${median} bpm should read ~45, got ${result.years}`,
      );
    }
  });

  it("does not call an ordinary resting heart rate exceptional", () => {
    // A 45-year-old woman at 62 bpm is unremarkable. Before the estimate was
    // damped this returned 25, which is the kind of number that discredits
    // every honest one beside it.
    const ordinary = series(30, () => ({ restingHr: 62, activeKcal: 320, weightKg: 68 }));
    const result = fitnessAge(ordinary[0], ordinary, { age: 45, sex: "female", heightCm: 165 });
    assert.ok(result.years !== null);
    assert.ok(result.years >= 30, `expected a plausible age, got ${result.years}`);
  });

  it("declines to guess without an age or enough readings", () => {
    assert.equal(fitnessAge(today, history, { age: null, sex: "male", heightCm: 180 }).years, null);
    const thin = series(3, () => ({ restingHr: 50 }));
    assert.equal(fitnessAge(thin[0], thin, { age: 30, sex: "male", heightCm: 180 }).years, null);
  });

  it("does not assume male when sex is undisclosed", () => {
    // A mid-range reading, so no curve is pinned against the ±12-year limit —
    // at the cap every sex returns the same number and the test proves nothing.
    const moderate = series(30, () => ({ restingHr: 70, activeKcal: 380, weightKg: 78 }));
    const male = fitnessAge(moderate[0], moderate, { age: 40, sex: "male", heightCm: 180 }).years;
    const female = fitnessAge(moderate[0], moderate, { age: 40, sex: "female", heightCm: 180 }).years;
    const undisclosed = fitnessAge(moderate[0], moderate, { age: 40, sex: "undisclosed", heightCm: 180 }).years;
    assert.notEqual(male, undisclosed);
    assert.notEqual(female, undisclosed);
  });

  it("does not swing wildly on a small change in resting heart rate", () => {
    const at66 = series(30, () => ({ restingHr: 66, activeKcal: 380, weightKg: 78 }));
    const at60 = series(30, () => ({ restingHr: 60, activeKcal: 380, weightKg: 78 }));
    const a = fitnessAge(at66[0], at66, { age: 40, sex: "male", heightCm: 180 }).years as number;
    const b = fitnessAge(at60[0], at60, { age: 40, sex: "male", heightCm: 180 }).years as number;
    // Six beats is real but it is not a decade and a half.
    assert.ok(Math.abs(a - b) <= 10, `six bpm moved the estimate ${Math.abs(a - b)} years`);
  });
});

describe("sleepQuality", () => {
  it("separates a long ragged run of nights from a consistent one", () => {
    const steady = series(20, () => ({ sleepMinutes: 470, hrvMs: 65, restingHr: 52 }));
    const ragged = series(20, (i) => ({ sleepMinutes: i % 2 === 0 ? 610 : 330, hrvMs: 65, restingHr: 52 }));
    const a = sleepQuality(steady[0], steady.slice(1));
    const b = sleepQuality(ragged[0], ragged.slice(1));
    assert.ok(a.value !== null && b.value !== null);
    assert.ok(a.value > b.value, "regular nights must score above irregular ones of similar length");
  });

  it("does not reward oversleeping as if it were more recovery", () => {
    const normal = series(20, () => ({ sleepMinutes: 480, hrvMs: 60, restingHr: 52 }));
    const long = series(20, () => ({ sleepMinutes: 700, hrvMs: 60, restingHr: 52 }));
    const a = sleepQuality(normal[0], normal.slice(1));
    const b = sleepQuality(long[0], long.slice(1));
    assert.ok(a.value !== null && b.value !== null && a.value >= b.value);
  });

  it("says what is missing rather than inventing it", () => {
    const bare = series(20, () => ({ sleepMinutes: 460 }));
    const result = sleepQuality(bare[0], bare.slice(1));
    assert.ok(result.missing.length > 0);
    assert.ok(result.value !== null, "a partial score is still worth showing");
  });
});

describe("stressScore", () => {
  const calm = series(30, () => ({ hrvMs: 70, restingHr: 50, respiratoryRate: 14 }));

  it("stays low when everything sits on baseline", () => {
    const result = stressScore(calm[0], calm.slice(1));
    assert.ok(result.value !== null && result.value < 55, `expected calm, got ${result.value}`);
  });

  it("rises when HRV drops and resting heart rate climbs", () => {
    const strained = { ...calm[0], hrvMs: 38, restingHr: 61, respiratoryRate: 17 };
    const result = stressScore(strained, calm.slice(1));
    assert.ok(result.value !== null && result.value > 60, `expected elevated, got ${result.value}`);
    assert.ok(["elevated", "high"].includes(result.band));
  });

  it("is unknown rather than zero without inputs", () => {
    const blank = series(30, () => ({}));
    assert.equal(stressScore(blank[0], blank.slice(1)).value, null);
  });
});

describe("bodyBattery", () => {
  it("recharges on good sleep and drains on load", () => {
    const rested = series(14, () => ({ sleepMinutes: 500, hrvMs: 70, restingHr: 50, activeKcal: 300 }));
    const hammered = series(14, () => ({ sleepMinutes: 320, hrvMs: 40, restingHr: 60, activeKcal: 900 }));
    const a = bodyBattery(rested);
    const b = bodyBattery(hammered);
    assert.ok(a.current !== null && b.current !== null);
    assert.ok(a.current > b.current, "sleeping well must leave more in the tank than not");
  });

  it("carries a deficit rather than resetting each day", () => {
    const debt = series(10, () => ({ sleepMinutes: 300, hrvMs: 42, restingHr: 60, activeKcal: 800 }));
    const result = bodyBattery(debt);
    assert.ok(result.current !== null && result.current < 40, `a bad run should show, got ${result.current}`);
  });

  it("has nothing to say with no days", () => {
    assert.equal(bodyBattery([]).current, null);
  });
});

describe("correlate", () => {
  it("finds a perfect positive relationship", () => {
    const pairs: Array<[number, number]> = Array.from({ length: 10 }, (_, i) => [i, i * 2]);
    assert.ok(Math.abs((correlate(pairs) as number) - 1) < 1e-9);
  });

  it("refuses to report from too few points", () => {
    assert.equal(correlate([[1, 2], [2, 4], [3, 6]]), null);
  });

  it("returns null when one side never varies", () => {
    const flat: Array<[number, number]> = Array.from({ length: 10 }, (_, i) => [i, 5]);
    assert.equal(correlate(flat), null);
  });
});

describe("insights", () => {
  it("reports the sleep-to-HRV link when it is really there", () => {
    // Alternating long and short nights, with HRV following the night before.
    const history = series(40, (i) => ({
      sleepMinutes: i % 2 === 0 ? 510 : 380,
      hrvMs: i % 2 === 0 ? 55 : 72,
      restingHr: 52,
    }));
    const found = insights(history);
    assert.ok(found.some((item) => item.id === "sleep-hrv"), "expected the sleep insight");
  });

  it("says nothing at all from a flat, featureless history", () => {
    const flat = series(40, () => ({ sleepMinutes: 460, hrvMs: 60, restingHr: 52, steps: 8000, weightKg: 80 }));
    const found = insights(flat);
    assert.equal(found.length, 0, `expected silence, got ${found.map((i) => i.id).join(", ")}`);
  });

  it("only calls a record a record when it beats what came before", () => {
    // A flat series used to congratulate you every morning.
    const flat = series(40, () => ({ hrvMs: 60, restingHr: 52, sleepMinutes: 460 }));
    assert.ok(!insights(flat).some((item) => item.id === "hrv-record"));

    const record = series(40, (i) => ({ hrvMs: i === 0 ? 92 : 60, restingHr: 52, sleepMinutes: 460 }));
    assert.ok(insights(record).some((item) => item.id === "hrv-record"));
  });

  it("gives every insight something to actually do", () => {
    const varied = series(60, (i) => ({
      sleepMinutes: i % 2 === 0 ? 515 : 375,
      hrvMs: i % 2 === 0 ? 54 : 73,
      restingHr: 52 + (i % 3),
      steps: i % 4 === 0 ? 2000 : 12000,
      weightKg: 80 - i * 0.05,
      activeKcal: i % 2 === 0 ? 900 : 200,
    }));
    const found = insights(varied);
    assert.ok(found.length > 0, "expected findings from a varied history");
    for (const item of found) {
      assert.ok(item.action.length > 20, `${item.id} has no usable action`);
      assert.ok(item.evidence.length > 5, `${item.id} shows no evidence`);
    }
  });

  it("labels a short history as low confidence", () => {
    const short = series(12, (i) => ({
      sleepMinutes: i % 2 === 0 ? 520 : 360,
      hrvMs: i % 2 === 0 ? 52 : 74,
    }));
    for (const item of insights(short)) {
      assert.notEqual(item.confidence, "high", `${item.id} should not claim high confidence from 12 days`);
    }
  });
});
