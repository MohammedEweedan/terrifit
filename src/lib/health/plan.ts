/**
 * What a Terrifit Pro subscription actually unlocks.
 *
 * The split is deliberate. Everything needed to answer "should I train today"
 * is free — recovery, sleep, strain, movement — because a health app that
 * paywalls the basic read is a bad product and people rightly resent it. Pro
 * pays for the derived work: the metrics that need weeks of history to mean
 * anything, and the analysis across them.
 *
 * Fitness age is free on purpose, and it is the exception that proves the
 * rule: it is the number people screenshot and send to a friend. Charging for
 * it would be charging for our own advertising.
 */
export const PRO_METRICS = ["sleepQuality", "stress", "bodyBattery", "insights"] as const;

export type ProMetric = (typeof PRO_METRICS)[number];

export type Plan = "free" | "pro";

/** Length of the free trial every new member is offered, once. */
export const TRIAL_DAYS = 14;

export type PlanState = {
  plan: Plan | "trial";
  /** Whether the derived metrics are unlocked right now. */
  active: boolean;
  trialEndsAt: string | null;
  trialDaysLeft: number | null;
  /** True when the trial has run out and no payment followed. */
  trialExpired: boolean;
  interval: string | null;
};

/**
 * Whether Pro features are unlocked.
 *
 * A trial is Pro for as long as it lasts. Deliberately computed from the dates
 * rather than a flag someone has to remember to flip, so an expired trial
 * cannot keep paying out because a cron job did not run.
 */
export function isPro(plan: string | null | undefined, trialEndsAt?: Date | null): boolean {
  if (plan === "pro") return true;
  if (plan === "trial" && trialEndsAt) return trialEndsAt.getTime() > Date.now();
  return false;
}

export function planState(user: {
  plan: string;
  trialEndsAt: Date | null;
  trialStartedAt: Date | null;
  planInterval: string | null;
}): PlanState {
  const active = isPro(user.plan, user.trialEndsAt);
  const msLeft = user.trialEndsAt ? user.trialEndsAt.getTime() - Date.now() : null;
  return {
    plan: user.plan === "pro" ? "pro" : user.plan === "trial" ? "trial" : "free",
    active,
    trialEndsAt: user.trialEndsAt?.toISOString() ?? null,
    trialDaysLeft: msLeft == null ? null : Math.max(0, Math.ceil(msLeft / 86_400_000)),
    trialExpired: user.plan === "trial" && msLeft != null && msLeft <= 0,
    interval: user.planInterval,
  };
}

/** Pricing. Physical Terrifuel bundles are sold separately so checkout can capture protein choice and delivery. */
export const PRICING = {
  monthly: { cents: 499, label: "$4.99 a month" },
  yearly: { cents: 3900, label: "$39 a year", note: "Two months free" },
} as const;

/** Copy for the upgrade prompt, per metric, so it names the thing being sold. */
export const PRO_PITCH: Record<ProMetric, { title: string; body: string }> = {
  sleepQuality: {
    title: "Sleep quality",
    body: "Not just how long you slept — whether it restored you, and whether your nights are regular enough to count on.",
  },
  stress: {
    title: "Load",
    body: "The autonomic cost of your week, read from HRV and resting heart rate against your own baseline.",
  },
  bodyBattery: {
    title: "Body battery",
    body: "A reservoir that fills with sleep and empties with training, carried day to day so a bad week actually shows.",
  },
  insights: {
    title: "Insights",
    body: "What your own history says about you — which nights lift your HRV, what the hard days cost, where the pattern breaks.",
  },
};
