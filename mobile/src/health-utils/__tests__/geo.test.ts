import {
  buildTrack, distanceBetween, formatDistance, formatDuration, formatPace, formatSpeed,
  usableFixes, type Fix,
} from "../geo";

function fix(latitude: number, longitude: number, seconds: number, extra: Partial<Fix> = {}): Fix {
  return {
    latitude, longitude,
    accuracy: 5, speed: null, altitude: null,
    timestamp: 1_700_000_000_000 + seconds * 1000,
    ...extra,
  };
}

/** Roughly 111,320 m per degree of latitude at the equator. */
const M_PER_DEG = 111_320;

it("measures a known distance to within a metre", () => {
  const north = distanceBetween(fix(0, 0, 0), fix(0.001, 0, 1));
  expect(Math.abs(north - M_PER_DEG * 0.001)).toBeLessThan(1);
});

it("discards fixes too uncertain to use", () => {
  const kept = usableFixes([fix(0, 0, 0), fix(0, 0, 1, { accuracy: 90 }), fix(0, 0, 2, { accuracy: null })]);
  expect(kept).toHaveLength(2);
});

it("reports no distance for a phone standing still", () => {
  // Ten fixes wandering within a couple of metres: this is what a GPS does at
  // a traffic light, and counting it is how apps invent kilometres.
  const jitter = Array.from({ length: 10 }, (_, i) =>
    fix(0.0000, (i % 2 === 0 ? 0.00001 : -0.00001), i),
  );
  expect(buildTrack(jitter).distanceM).toBe(0);
});

it("measures a straight run", () => {
  const points = Array.from({ length: 11 }, (_, i) => fix(i * 0.001, 0, i * 10));
  const track = buildTrack(points);
  expect(track.distanceM).toBeGreaterThan(1100);
  expect(track.distanceM).toBeLessThan(1120);
  expect(track.durationS).toBe(100);
});

it("averages speed over the whole track", () => {
  const points = Array.from({ length: 11 }, (_, i) => fix(i * 0.001, 0, i * 10));
  const track = buildTrack(points);
  expect(track.averageSpeedMs).toBeCloseTo(track.distanceM / track.durationS, 5);
});

it("has no track at all from a single fix", () => {
  const track = buildTrack([fix(0, 0, 0)]);
  expect(track.distanceM).toBe(0);
  expect(track.durationS).toBe(0);
  expect(track.currentSpeedMs).toBeNull();
});

it("ignores altitude noise on flat ground", () => {
  // A metre of wobble either way, ten times over. No hill was climbed.
  const points = Array.from({ length: 10 }, (_, i) =>
    fix(i * 0.001, 0, i * 10, { altitude: 100 + (i % 2 === 0 ? 1 : -1) }),
  );
  expect(buildTrack(points).ascentM).toBe(0);
});

it("counts a real climb", () => {
  const points = Array.from({ length: 10 }, (_, i) => fix(i * 0.001, 0, i * 10, { altitude: 100 + i * 10 }));
  expect(buildTrack(points).ascentM).toBeGreaterThan(80);
});

it("gives a current speed from the recent window only", () => {
  // Slow for a long time, then fast. Current speed should reflect the fast part.
  const slow = Array.from({ length: 10 }, (_, i) => fix(i * 0.0001, 0, i * 30));
  const fast = Array.from({ length: 5 }, (_, i) => fix(0.001 + i * 0.001, 0, 300 + i * 5));
  const track = buildTrack([...slow, ...fast]);
  expect(track.currentSpeedMs).not.toBeNull();
  expect(track.currentSpeedMs as number).toBeGreaterThan(track.averageSpeedMs);
});

describe("formatting", () => {
  it("switches units where a person would", () => {
    expect(formatDistance(840)).toBe("840 m");
    expect(formatDistance(5420)).toBe("5.42 km");
    expect(formatDistance(5420, true)).toBe("3.37 mi");
  });

  it("writes pace the way runners say it", () => {
    // 1000 m in 312 s is 5:12 per kilometre.
    expect(formatPace(1000 / 312)).toBe("5:12 /km");
  });

  it("refuses to quote a pace from a standstill", () => {
    expect(formatPace(0)).toBe("—");
    expect(formatPace(null)).toBe("—");
    // Slower than a shuffle: the number would be meaningless.
    expect(formatPace(0.1)).toBe("—");
  });

  it("shows speed for the activities that read better that way", () => {
    expect(formatSpeed(5)).toBe("18.0 km/h");
    expect(formatSpeed(null)).toBe("—");
  });

  it("drops the hour when there is not one", () => {
    expect(formatDuration(581)).toBe("9:41");
    expect(formatDuration(3849)).toBe("1:04:09");
    expect(formatDuration(-5)).toBe("0:00");
  });
});
