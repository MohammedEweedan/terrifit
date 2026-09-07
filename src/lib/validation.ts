import { z } from "zod";

export const ROLES = ["athlete", "coach", "nutritionist", "creator", "brand"] as const;
export type Role = (typeof ROLES)[number];

/** Roles that must clear credential or compliance review before they can sell. */
export const PROFESSIONAL_ROLES: readonly Role[] = ["coach", "nutritionist", "creator"];

export const FEATURE_KEYS = [
  "maps",
  "checkins",
  "coaching",
  "communities",
  "livestreams",
  "marketplace",
  "health",
  "anonymity",
] as const;
export type FeatureKey = (typeof FEATURE_KEYS)[number];

export const waitlistSchema = z
  .object({
    name: z.string().trim().min(1).max(120),
    email: z.string().trim().toLowerCase().email().max(254),
    // The public launch uses athlete, creator and partner. Legacy professional
    // roles remain accepted so existing founding applications stay valid.
    role: z.enum([...ROLES, "partner"]),
    country: z.string().trim().min(2).max(2).toUpperCase(),
    locale: z.string().trim().min(2).max(8).default("en"),
    features: z.array(z.enum(FEATURE_KEYS)).max(FEATURE_KEYS.length).default([]),

    handle: z.string().trim().max(120).optional().or(z.literal("")),
    audienceSize: z.string().trim().max(60).optional().or(z.literal("")),
    credentials: z.string().trim().max(1000).optional().or(z.literal("")),

    brandName: z.string().trim().max(160).optional().or(z.literal("")),
    brandWebsite: z.string().trim().max(300).optional().or(z.literal("")),
    brandCategory: z.string().trim().max(80).optional().or(z.literal("")),

    referredByCode: z.string().trim().max(16).optional().or(z.literal("")),
    source: z.string().trim().max(120).optional().or(z.literal("")),
    consent: z.literal(true),
  })
  .superRefine((value, ctx) => {
    // Brands cannot be reviewed without something to review.
    if (value.role === "brand" && !value.brandName?.trim()) {
      ctx.addIssue({ code: "custom", path: ["brandName"], message: "required" });
    }
  });

export type WaitlistInput = z.infer<typeof waitlistSchema>;

export const eventSchema = z.object({
  name: z.string().trim().min(1).max(80),
  sessionId: z.string().trim().min(1).max(64),
  locale: z.string().trim().max(8).optional(),
  path: z.string().trim().max(300).optional(),
  props: z.record(z.string(), z.unknown()).default({}),
});

export const CONTACT_TOPICS = ["member", "band", "creator", "partner", "press", "other"] as const;
export type ContactTopic = (typeof CONTACT_TOPICS)[number];

export const contactSchema = z.object({
  topic: z.enum(CONTACT_TOPICS),
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().toLowerCase().email().max(254),
  // Long enough to be worth a reply, short enough that a paste of a whole log
  // does not become a database problem.
  message: z.string().trim().min(10).max(4000),
  locale: z.string().trim().min(2).max(8).default("en"),
  consent: z.literal(true),
});

export type ContactInput = z.infer<typeof contactSchema>;

/**
 * One line of a checkout cart, as the browser sends it.
 *
 * Note what is absent: a price. The server resolves every line against the
 * catalogue and computes the total itself, so a tampered payload can change
 * what is ordered but never what it costs.
 */
export const checkoutItemSchema = z.object({
  slug: z.string().trim().min(1).max(80),
  // Nullable, not just optional: "this product has no variant" is a real state
  // a client holds as null, and rejecting it 422'd every cart containing an
  // unvariated line — the charger, the membership — with no way to tell why.
  variantId: z.string().trim().max(60).nullish().transform((value) => value ?? undefined),
  quantity: z.number().int().min(1).max(20),
  subscribe: z.boolean().default(false),
});

/**
 * The rails the business offers, and only those.
 *
 * Apple Pay and Google Pay are Stripe payment methods rather than separate
 * processors — they settle as card payments — but they are listed separately
 * because a customer chooses between them, and because each needs its own
 * button and its own device support check.
 */
export const PAYMENT_METHODS = ["card", "apple_pay", "google_pay", "paypal", "crypto", "usdt_trc20"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const checkoutSchema = z.object({
  items: z.array(checkoutItemSchema).min(1).max(30),
  email: z.string().trim().toLowerCase().email().max(254),
  name: z.string().trim().min(1).max(120),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  line1: z.string().trim().max(200).optional().or(z.literal("")),
  line2: z.string().trim().max(200).optional().or(z.literal("")),
  city: z.string().trim().max(120).optional().or(z.literal("")),
  postcode: z.string().trim().max(32).optional().or(z.literal("")),
  country: z.string().trim().min(2).max(2).toUpperCase().optional().or(z.literal("")),
  paymentMethod: z.enum(PAYMENT_METHODS),
  /** What to charge in. Validated against the table, never trusted blindly. */
  currency: z.string().trim().length(3).toUpperCase().optional(),
  locale: z.string().trim().min(2).max(8).default("en"),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;

/* -------------------------------------------------------------------------- */
/* Accounts                                                                    */

/**
 * Length beats composition rules. NIST dropped the "one symbol, one digit"
 * advice years ago because it produces `Password1!` and nothing safer, so the
 * only requirement here is that the password is long enough to be worth having.
 */
export const passwordSchema = z.string().min(10).max(200);

export const signupSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().toLowerCase().email().max(254),
  password: passwordSchema,
  locale: z.string().trim().min(2).max(8).default("en"),
  role: z.enum(["athlete", "creator", "coach", "partner"]).default("athlete"),
  consent: z.literal(true),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(1).max(200),
});

export const SEXES = ["female", "male", "other", "undisclosed"] as const;
export const GOALS = ["strength", "fat-loss", "endurance", "health", "recomposition"] as const;
export const ACTIVITY_LEVELS = ["sedentary", "light", "moderate", "high", "athlete"] as const;

const optionalNumber = (min: number, max: number) =>
  z.coerce.number().min(min).max(max).optional().nullable();

export const profileSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  handle: z.string().trim().regex(/^[a-z0-9_.]{3,30}$/i).optional().or(z.literal("")),
  dateOfBirth: z.string().trim().max(10).optional().or(z.literal("")),
  sex: z.enum(SEXES).optional().or(z.literal("")),
  // Ranges are wide on purpose: they exist to reject typos and junk, not to
  // tell somebody their body is out of bounds.
  heightCm: optionalNumber(80, 260),
  weightKg: optionalNumber(25, 400),
  units: z.enum(["metric", "imperial"]).default("metric"),
  timezone: z.string().trim().max(60).optional().or(z.literal("")),
  goal: z.enum(GOALS).optional().or(z.literal("")),
  activityLevel: z.enum(ACTIVITY_LEVELS).optional().or(z.literal("")),
  trainingDays: z.coerce.number().int().min(0).max(14).optional().nullable(),
  bio: z.string().trim().max(600).optional().or(z.literal("")),
  shareWithCreators: z.boolean().optional(),
});

export const HEALTH_PROVIDERS = [
  "apple_health",
  "google_health_connect",
  "samsung_health",
  "garmin",
  "strava",
  "fitbit",
  "oura",
  "whoop",
  "inbody",
] as const;
export type HealthProvider = (typeof HEALTH_PROVIDERS)[number];

export const connectionSchema = z.object({
  provider: z.enum(HEALTH_PROVIDERS),
  action: z.enum(["connect", "disconnect"]),
});
