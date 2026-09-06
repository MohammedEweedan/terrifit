import { baselineFrom, detect, effort, initialState, type Reading } from "../set-detect";

/** Builds a second-by-second stream from a list of [bpm, seconds] segments. */
function stream(segments: [number, number][]): Reading[] {
  const readings: Reading[] = [];
  let at = 1_700_000_000_000;
  for (const [bpm, seconds] of segments) {
    for (let i = 0; i < seconds; i += 1) {
      readings.push({ bpm, at });
      at += 1000;
    }
  }
  return readings;
}

it("refuses to guess a baseline from too few readings", () => {
  expect(baselineFrom(stream([[60, 3]]))).toBeNull();
});

it("is not dragged down by a single dropped reading", () => {
  const readings = stream([[62, 30]]);
  readings[5].bpm = 38;
  expect(baselineFrom(readings)).toBeGreaterThan(55);
});

it("takes the baseline from the opening, not from whatever dominates the window", () => {
  // Most of this stream is work. An earlier version took a percentile across
  // the whole window, so work became the baseline and the detector went blind
  // exactly when it mattered.
  expect(baselineFrom(stream([[60, 40], [95, 300]]))).toBe(60);
});

it("finds one bout in rest, work, rest", () => {
  const state = detect(stream([[60, 40], [90, 40], [62, 40]]), initialState);
  expect(state.bouts).toHaveLength(1);
  expect(state.bouts[0].peakBpm).toBe(90);
});

it("finds a bout per set across a working series", () => {
  const state = detect(stream([[60, 40], [92, 30], [63, 40], [94, 30], [63, 40], [95, 30], [62, 40]]), initialState);
  expect(state.bouts).toHaveLength(3);
});

it("ignores a rise too brief to be a set", () => {
  // Six seconds of raised heart rate is standing up, not five reps.
  expect(detect(stream([[60, 40], [95, 6], [61, 40]]), initialState).bouts).toHaveLength(0);
});

it("records no set at all for continuous work, and does not stay stuck", () => {
  // Five minutes of raised heart rate is a row or a run. Counting it as one
  // set is wrong and chopping it into several is worse — it would tick off a
  // lifting session nobody performed.
  const state = detect(stream([[60, 40], [95, 300], [61, 30]]), initialState);
  expect(state.bouts).toHaveLength(0);
  expect(state.openedAt).toBeNull();
  expect(state.awaitingRecovery).toBe(false);
});

it("will not open a new set until the heart rate comes back down", () => {
  const state = detect(stream([[60, 40], [95, 300]]), initialState);
  expect(state.bouts).toHaveLength(0);
  expect(state.awaitingRecovery).toBe(true);
});

it("counts sets again after recovering from continuous work", () => {
  const state = detect(stream([[60, 40], [95, 300], [61, 40], [92, 30], [62, 40]]), initialState);
  expect(state.bouts).toHaveLength(1);
});

it("holds a bout open while the member is still working", () => {
  const state = detect(stream([[60, 40], [95, 30]]), initialState);
  expect(state.bouts).toHaveLength(0);
  expect(state.openedAt).not.toBeNull();
});

it("never counts the same bout twice when replayed", () => {
  const readings = stream([[60, 40], [92, 30], [62, 40]]);
  const once = detect(readings, initialState);
  expect(detect(readings, once).bouts).toHaveLength(once.bouts.length);
});

it("does nothing at all without a baseline", () => {
  const state = detect(stream([[95, 4]]), initialState);
  expect(state.bouts).toHaveLength(0);
  expect(state.baselineBpm).toBeNull();
});

it("scales to the person, not to an absolute number", () => {
  // 70 bpm is work for a 48 bpm athlete and rest for somebody sitting at 75.
  expect(detect(stream([[48, 40], [70, 30], [49, 40]]), initialState).bouts).toHaveLength(1);
  expect(detect(stream([[75, 40], [70, 30], [75, 40]]), initialState).bouts).toHaveLength(0);
});

it("keeps effort inside 0 and 1 whatever arrives", () => {
  expect(effort(90, null, null)).toBe(0);
  expect(effort(90, 60, 60)).toBe(0);
  for (const bpm of [20, 60, 90, 200]) {
    const value = effort(bpm, 60, 120);
    expect(value).toBeGreaterThanOrEqual(0);
    expect(value).toBeLessThanOrEqual(1);
  }
});
