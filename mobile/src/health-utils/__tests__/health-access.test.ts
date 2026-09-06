import { hasAnyReading } from "../readings";

/**
 * The regression these guard: "Apple couldn't connect to Health".
 *
 * `requestAuthorization` resolves with Apple's `success` flag, which means the
 * *request completed* — not that anything was granted. Apple never reports
 * read authorisation at all. Treating `false` as "the user declined" told
 * people to switch on a permission that was already on, and `.catch(() =>
 * false)` meant every real error said the same wrong thing.
 */
it("treats a day of nulls as no reading", () => {
  // Days are created for the whole window, so a populated array is not
  // evidence that anything was actually readable.
  const empty = [
    { date: "2026-09-01T00:00:00.000Z" },
    { date: "2026-09-02T00:00:00.000Z" },
  ];
  expect(hasAnyReading(empty)).toBe(false);
});

it("counts a single reading anywhere in the window", () => {
  const days = [
    { date: "2026-09-01T00:00:00.000Z" },
    { date: "2026-09-02T00:00:00.000Z", restingHr: 54 },
  ];
  expect(hasAnyReading(days)).toBe(true);
});

it("does not mistake the date field for data", () => {
  // `date` is always present; if it counted, every empty window would look
  // like a successful read and the sync would post nothing but dates.
  expect(hasAnyReading([{ date: "2026-09-01T00:00:00.000Z" }])).toBe(false);
});

it("is false for no days at all", () => {
  expect(hasAnyReading([])).toBe(false);
});

it("counts a zero reading as a reading", () => {
  // Zero steps is a measurement. Only null means absent.
  expect(hasAnyReading([{ date: "2026-09-01T00:00:00.000Z", steps: 0 }])).toBe(true);
});
