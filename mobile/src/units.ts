/**
 * Metric and imperial, in one place.
 *
 * The app stores everything in SI — kilograms, centimetres, metres — because a
 * score computed from a converted number would drift with the display setting.
 * These convert on the way out only, at the moment something is drawn.
 */
export type UnitSystem = "metric" | "imperial";

const LB_PER_KG = 2.2046226218;
const KM_PER_MILE = 1.609344;

/** Body mass, to one decimal in both systems. */
export function weight(kg: number | null | undefined, system: UnitSystem): string {
  if (kg == null) return "—";
  return system === "imperial" ? `${(kg * LB_PER_KG).toFixed(1)} lb` : `${kg.toFixed(1)} kg`;
}

/**
 * Height. Imperial is feet and inches rather than decimal feet, because "5 ft
 * 11 in" is how everybody who uses it actually says it.
 */
export function height(cm: number | null | undefined, system: UnitSystem): string {
  if (cm == null) return "—";
  if (system === "metric") return `${Math.round(cm)} cm`;

  const totalInches = cm / 2.54;
  const feet = Math.floor(totalInches / 12);
  // Rounding inches can reach 12; carry it rather than printing 5 ft 12 in.
  let inches = Math.round(totalInches - feet * 12);
  let carried = feet;
  if (inches === 12) {
    carried += 1;
    inches = 0;
  }
  return `${carried} ft ${inches} in`;
}

/** Walking and running distance. Metres in, miles or kilometres out. */
export function distance(metres: number | null | undefined, system: UnitSystem): string {
  if (metres == null) return "—";
  const km = metres / 1000;
  if (system === "imperial") {
    const miles = km / KM_PER_MILE;
    return miles < 0.1 ? `${Math.round(metres * 3.28084)} ft` : `${miles.toFixed(1)} mi`;
  }
  return km < 1 ? `${Math.round(metres)} m` : `${km.toFixed(1)} km`;
}

/** Skin and ambient temperature. */
export function temperature(celsius: number | null | undefined, system: UnitSystem): string {
  if (celsius == null) return "—";
  return system === "imperial"
    ? `${(celsius * 9 / 5 + 32).toFixed(1)} °F`
    : `${celsius.toFixed(1)} °C`;
}

/** What to label a weight input with, so the field and the value agree. */
export function weightUnit(system: UnitSystem): string {
  return system === "imperial" ? "lb" : "kg";
}

export function heightUnit(system: UnitSystem): string {
  return system === "imperial" ? "in" : "cm";
}

/** Typed input back to SI for storage. Never the other way round. */
export function toKg(value: number, system: UnitSystem): number {
  return system === "imperial" ? value / LB_PER_KG : value;
}

export function toCm(value: number, system: UnitSystem): number {
  return system === "imperial" ? value * 2.54 : value;
}
