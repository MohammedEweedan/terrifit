import { sleepTotals } from "../sleep";
const record = (start: string, end: string, value: number) => ({ startDate: `2026-09-05T${start}:00Z`, endDate: `2026-09-05T${end}:00Z`, value });
it("excludes awake, in-bed and unknown stages", () => {
  const totals = sleepTotals([record("01:00", "02:00", 3), record("02:00", "03:00", 2), record("00:00", "04:00", 0), record("04:00", "05:00", 9)], "UTC");
  expect([...totals.values()]).toEqual([60]);
});
it("unions duplicate and overlapping records instead of double counting", () => {
  const totals = sleepTotals([record("01:00", "03:00", 1), record("01:00", "02:00", 3), record("02:00", "04:00", 4), record("04:00", "05:00", 5)], "UTC");
  expect([...totals.values()]).toEqual([240]);
});
it("attributes the night to its local end date and rejects malformed durations", () => {
  const totals = sleepTotals([record("22:00", "23:30", 5), record("03:00", "02:00", 1)], "Asia/Tokyo");
  expect(totals.get("2026-09-06T00:00:00.000Z")).toBe(90);
});
