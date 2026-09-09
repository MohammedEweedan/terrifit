/**
 * Launch availability is independent of inventory. A backorder flag is not
 * permission to launch hardware.
 *
 * `HARDWARE_PREORDERS_OPEN` now decides placement as well as purchasability:
 * while it is off the Band, the Scale and every `v1-` accessory are hidden from
 * the shop and presented on the research page instead, which is honest about a
 * November 2027 target and keeps the storefront to things that actually ship.
 * Turning it on returns them to the shop; nothing else has to change.
 */
export type LaunchStatus = "available" | "upcoming" | "membership";

export function launchStatus(slug: string, category: string, hardwareOpen = false): LaunchStatus {
  if (slug === "terrifit-membership") return "membership";
  if (category === "band" || slug.startsWith("v1-") || slug === "terrifit-scale") {
    return hardwareOpen ? "available" : "upcoming";
  }
  return "available";
}

export const HARDWARE_NOTICE = "Upcoming hardware. Paid pre-orders are not open yet. Delivery timing will be confirmed before orders open.";
