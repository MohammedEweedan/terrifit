/** Launch availability is independent of inventory. A backorder flag is not permission to launch hardware. */
export type LaunchStatus = "available" | "upcoming" | "membership";

export function launchStatus(slug: string, category: string, hardwareOpen = false): LaunchStatus {
  if (slug === "terrifit-membership") return "membership";
  if (category === "band" || slug.startsWith("v1-") || slug === "terrifit-scale") {
    return hardwareOpen ? "available" : "upcoming";
  }
  return "available";
}

export const HARDWARE_NOTICE = "Upcoming hardware. Paid pre-orders are not open yet. Delivery timing will be confirmed before orders open.";
