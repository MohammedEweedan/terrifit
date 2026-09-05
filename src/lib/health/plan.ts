/**
 * What a Terrifit Pro subscription actually unlocks.
 *
 * The line is drawn at one question. **"Should I train today" stays free** —
 * recovery, strain and sleep — because a health app that paywalls the morning
 * read is a bad product and people rightly resent it. Pro pays for everything
 * that needs weeks of history behind it to mean anything.
 *
 * `tScore` sits on the paid side deliberately. It is not part of the morning
 * read: it scores the *whole day* against the member's own rolling history, so
 * it is worthless on day one and interesting by week six. That is exactly the
 * shape of a subscription feature, and unlike the four derived metrics it is
 * something a free member can see the outline of and want.
 *
 * Fitness age is free on purpose, and it is the exception that proves the
 * rule: it is the number people screenshot and send to a friend. Charging for
 * it would be charging for our own advertising.
 */
export const PRO_METRICS = ["sleepQuality", "stress", "bodyBattery", "insights", "tScore"] as const;

/**
 * How far back a free account can look.
 *
 * Thirty days is enough to see a trend and not enough to see a season, which
 * is the honest version of a history limit: it does not break the daily read,
 * and the thing it withholds — "what did the winter block actually do to me" —
 * is a genuinely different question worth paying for.
 */
export const FREE_HISTORY_DAYS = 30;

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
  monthly: { cents: 799, label: "$7.99 a month" },
  // $70 against $95.88 at the monthly rate — a hair over a quarter off, which
  // is worth taking and is not so steep that the monthly price looks like a
  // punishment for not committing.
  yearly: { cents: 7000, label: "$70 a year", note: "Save 27%" },
} as const;

/** Copy for the upgrade prompt, per metric, so it names the thing being sold. */
export const PRO_PITCH: Record<ProMetric, { title: string; body: string }> = {
  tScore: {
    title: "T Score",
    body: "How much of the whole day you actually moved, scored against your own history rather than a target somebody else set. It needs weeks behind it before it means anything, and then it means a lot.",
  },
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
