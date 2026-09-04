/**
 * The one place the app talks to the backend.
 *
 * Scores, prices and Map content are all resolved server-side and returned
 * whole, so the phone and the web app can never disagree about a number — and
 * a change to a formula or a price ships without an App Store review.
 */
import Constants from "expo-constants";

/**
 * Where the Next.js app is running.
 *
 * `localhost` only resolves on a simulator; a real device needs the machine's
 * LAN address. Set EXPO_PUBLIC_API_URL rather than editing this.
 */
export const API_BASE =
  process.env.EXPO_PUBLIC_API_URL ??
  (Constants.expoConfig?.hostUri
    ? `http://${Constants.expoConfig.hostUri.split(":")[0]}:3000`
    : "http://localhost:3000");

/* -------------------------------------------------------------------------- */
/* Types                                                                       */

export type ScoreInput = {
  label: string;
  value: string;
  baseline: string | null;
  weight: number;
  contribution: number;
  direction: "higher" | "lower" | "target";
};

export type Score = {
  value: number | null;
  band: "good" | "fair" | "poor" | "unknown";
  inputs: ScoreInput[];
  missing: string[];
  caveat?: string;
};

export type FitnessFactor = {
  label: string;
  value: string;
  /** Where this reading sits in its own range, 0–1. */
  position: number;
  effect: "younger" | "older" | "neutral";
  note: string;
};

export type FitnessAge = {
  years: number | null;
  chronological: number | null;
  delta: number | null;
  /** True when the estimate hit its limit — a bound, not a reading. */
  capped: boolean;
  vo2max: number | null;
  basis: string[];
  factors: FitnessFactor[];
  caveat: string;
};

export type SleepQuality = {
  value: number | null;
  band: string;
  parts: Array<{ label: string; value: number; weight: number; detail: string }>;
  missing: string[];
};

export type StressReading = { value: number | null; band: string; drivers: string[]; caveat: string };

export type BodyBattery = {
  charged: number | null;
  current: number | null;
  drained: number | null;
  gained: number | null;
  narrative: string;
};

export type Insight = {
  id: string;
  title: string;
  body: string;
  /** What to do about it — the half that makes Pro worth paying for. */
  action: string;
  /** The numbers behind the claim. */
  evidence: string;
  confidence: "low" | "medium" | "high";
  kind: string;
  priority: number;
};

export type Dashboard = {
  user: { name: string; email: string };
  units: string;
  /** Fitness age is free; the rest is null without Pro. */
  advanced: {
    fitnessAge: FitnessAge | null;
    sleepQuality: SleepQuality | null;
    stress: StressReading | null;
    bodyBattery: BodyBattery | null;
    insights: Insight[];
  };
  plan: { plan: string; locked: string[] };
  latest: { date: string; recovery: Score; strain: Score; sleep: Score; movement: Score } | null;
  staleDays: number;
  dayCount: number;
  sources: string[];
  history: Array<{
    date: string;
    recovery: number | null;
    /** The T Score for that day, scored only against the days before it. */
    tScore: number | null;
    /** The fitness age estimate on that day, from the days before it. */
    fitnessAge: number | null;
    hrvMs: number | null;
    restingHr: number | null;
    averageHr: number | null;
    sleepMinutes: number | null;
    steps: number | null;
    activeKcal: number | null;
    weightKg: number | null;
  }>;
};

export type BodyScan = {
  id: string;
  takenAt: string;
  source: string;
  weightKg: number | null;
  bodyFatPercent: number | null;
  skeletalMuscleKg: number | null;
  bodyWaterL: number | null;
  visceralFatLevel: number | null;
  basalMetabolicRate: number | null;
  score: number | null;
};

export type Post = {
  id: string;
  kind: "note" | "progress" | "live";
  body: string;
  mediaUrl: string | null;
  liveState: string | null;
  visibility: string;
  likeCount: number;
  commentCount: number;
  likedByMe: boolean;
  createdAt: string;
  author: { id: string; name: string; handle: string | null; role: string; isMe: boolean };
};

export type CirclePerson = { id: string; name: string; handle: string | null; live: boolean };

export type Feed = { scope: string; followingCount: number; circle: CirclePerson[]; posts: Post[] };

export type PostComment = {
  id: string;
  body: string;
  createdAt: string;
  author: { id: string; name: string; handle: string | null; isMe: boolean };
};

export type MapBlock = { key: string; label: string; weeks: [number, number]; intent: string };

export type MapSummary = {
  id: string;
  name: string;
  tagline: string;
  coach: { name: string; credential: string; handle: string; bio: string };
  goal: string;
  weeks: number;
  sessionsPerWeek: number;
  level: string;
  equipment: string[];
  summary: string;
  accent: string;
  blocks: MapBlock[];
  enrolled: boolean;
};

export type ActiveMap = {
  mapId: string;
  name: string;
  week: number;
  weeks: number;
  done: number;
  sessionsPerWeek: number;
  blockLabel: string | null;
  percent: number;
  accent: string;
};

export type Exercise = {
  name: string;
  scheme: string;
  intensity?: string;
  cue: string;
  restSeconds: number;
  targets?: string[];
  technique?: string[];
  mistakes?: string[];
  progression?: string;
  media?: { image?: string; video?: string; alt: string };
};

export type MapSession = {
  id: string;
  name: string;
  day: number;
  minutes: number;
  strain: number;
  focus: string;
  exercises: Exercise[];
};

export type LoggedSet = { reps: number | null; weightKg: number | null; done: boolean };
export type LoggedEntry = { exercise: string; sets: LoggedSet[] };

export type SessionRuntime = {
  map: { id: string; name: string; accent: string; sessionsPerWeek: number };
  session: MapSession;
  week: number;
  blockLabel: string | null;
  lastTime: { completedAt: string; week: number; entries: LoggedEntry[] } | null;
};

export type MapDetail = {
  map: MapSummary & { sample: MapSession[] };
  /** The coach's account, when they have one, so they can be messaged. */
  coach: { id: string; name: string; handle: string | null } | null;
  enrollment: { week: number; done: number; blockLabel: string | null; startedAt: string } | null;
};

export type LoggedSession = {
  id: string;
  sessionId: string;
  name: string;
  week: number;
  completedAt: string;
  durationSeconds: number | null;
  volumeKg: number;
  sets: number;
  entries: LoggedEntry[];
};

export type MapHistory = {
  sessions: LoggedSession[];
  summary: { count: number; totalVolumeKg: number; bestVolumeKg: number };
};

export type ShopVariant = {
  id: string;
  label: string;
  note: string | null;
  /** The web shop's CSS gradient. Unusable here; kept so the shapes match. */
  swatch: string | null;
  /** The same swatch as plain hex, which is what a native view can paint. */
  swatchColours: string[];
  accent: string | null;
  image: string | null;
  stockQuantity: number;
  allowBackorder: boolean;
  priceCents: number;
  price: string;
};

export type ShopProduct = {
  slug: string;
  name: string;
  tagline: string;
  category: string;
  brand: string;
  partner: boolean;
  priceCents: number;
  price: string;
  compareAt: string | null;
  rating: number;
  reviews: number;
  badges: string[];
  variantLabel: string | null;
  description: string;
  highlights: string[];
  specs: Array<[string, string]>;
  /** The full grouped spec sheet, where a product has one. */
  specGroups: Array<{ title: string; rows: Array<[string, string]> }> | null;
  stock: string;
  stockQuantity: number;
  allowBackorder: boolean;
  shipsIn: string;
  fulfilment: string;
  subscription: { label: string; discountPercent: number } | null;
  image: string | null;
  imageAlt: string;
  variants: ShopVariant[];
};

export type Profile = {
  user: {
    id: string;
    name: string;
    email: string;
    handle: string | null;
    role: string;
    locale: string;
    plan: string;
    isAdmin: boolean;
    createdAt: string;
  };
  profile: {
    /** A data URI, or null. Mutually exclusive with `avatarEmoji`. */
    avatarImage: string | null;
    /** One emoji, or null. Mutually exclusive with `avatarImage`. */
    avatarEmoji: string | null;
    dateOfBirth: string | null;
    sex: string | null;
    heightCm: number | null;
    weightKg: number | null;
    units: string;
    goal: string | null;
    activityLevel: string | null;
    trainingDays: number | null;
    bio: string | null;
    experience: string | null;
    activities: string[];
    healthConditions: string[];
    onboardedAt: string | null;
    shareWithCreators: boolean;
  } | null;
  stats: { posts: number; followers: number; following: number };
};

export type ProfilePatch = Partial<{
  name: string;
  handle: string | null;
  bio: string | null;
  /** A data URI. Setting this clears any emoji. */
  avatarImage: string | null;
  /** One emoji. Setting this clears any photo. */
  avatarEmoji: string | null;
  dateOfBirth: string | null;
  sex: string | null;
  heightCm: number | null;
  weightKg: number | null;
  units: string;
  goal: string | null;
  activityLevel: string | null;
  trainingDays: number | null;
  experience: string | null;
  activities: string[];
  healthConditions: string[];
  shareWithCreators: boolean;
  finishOnboarding: boolean;
}>;

export type Band = {
  id: string;
  serial: string;
  colourway: string;
  firmware: string;
  batteryPercent: number;
  pairedAt: string;
  lastSyncAt: string | null;
};

export type BandState = {
  band: Band | null;
  colourways: Array<{
    id: string;
    label: string;
    note: string | null;
    swatch: string | null;
    swatchColours: string[];
    accent: string | null;
    image: string | null;
  }>;
};

export type PublicProfile = {
  user: { id: string; name: string; handle: string | null; role: string; createdAt: string; isMe: boolean };
  profile: { bio: string | null; goal: string | null; activityLevel: string | null; shareWithCreators: boolean } | null;
  stats: { posts: number; followers: number; following: number };
  isFollowing: boolean;
  posts: Post[];
};

export type ConversationSummary = {
  id: string;
  title: string;
  members: Array<{ id: string; name: string; handle: string | null; role: string }>;
  lastMessage: { body: string; createdAt: string; mine: boolean } | null;
  unread: boolean;
  lastMessageAt: string;
};

export type DirectMessage = { id: string; body: string; mine: boolean; createdAt: string };

export type Thread = {
  id: string;
  title: string;
  members: Array<{ id: string; name: string; handle: string | null; role: string }>;
  messages: DirectMessage[];
};

export type Notification = {
  id: string;
  kind: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
};

/* -------------------------------------------------------------------------- */
/* Transport                                                                   */

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly detail?: string,
  ) {
    super(message);
  }
}

async function request<T>(path: string, token: string | null, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as {
      error?: string;
      message?: string;
      fields?: Array<string | { path?: string; message?: string }>;
    } | null;
    const fieldDetail = body?.fields
      ?.map((field) => typeof field === "string" ? field : [field.path, field.message].filter(Boolean).join(": "))
      .filter(Boolean)
      .join(" · ");
    throw new ApiError(response.status, body?.error ?? `request_failed_${response.status}`, body?.message ?? fieldDetail);
  }
  // 204s and empty bodies are valid; callers that expect nothing get undefined.
  const text = await response.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

/* -------------------------------------------------------------------------- */
/* Endpoints                                                                   */

type AuthResult = { user: { name: string; email: string }; token: string };

export function signIn(email: string, password: string) {
  return request<AuthResult>("/api/auth/login", null, {
    method: "POST",
    // `client: "native"` is what makes the server hand back a raw token; a
    // browser gets an httpOnly cookie and no token at all.
    body: JSON.stringify({ email, password, client: "native" }),
  });
}

export function signUp(name: string, email: string, password: string, locale = "en") {
  return request<AuthResult>("/api/auth/signup", null, {
    method: "POST",
    body: JSON.stringify({ name, email, password, locale, consent: true, client: "native" }),
  });
}

/** The server's minimum. Checked here too so nobody types a password twice to find out. */
export const MIN_PASSWORD = 10;

export const getDashboard = (token: string) => request<Dashboard>("/api/app/dashboard", token);
export const getBody = (token: string) => request<{ scans: BodyScan[] }>("/api/app/body", token);
export const getProfile = (token: string) => request<Profile>("/api/app/profile", token);
export const getBand = (token: string) => request<BandState>("/api/app/band", token);
export const getMaps = (token: string) => request<{ active: ActiveMap[]; maps: MapSummary[]; total: number }>("/api/app/maps", token);
export type ShopColourway = {
  id: string;
  label: string;
  note: string | null;
  /** The web shop's CSS gradient. Unusable here; kept so the shapes match. */
  swatch: string | null;
  /** The same swatch as plain hex, which is what a native view can paint. */
  swatchColours: string[];
  accent: string | null;
  image: string | null;
};

export type Shop = {
  categories: string[];
  products: ShopProduct[];
  currency: { code: string; symbol: string; decimals: 0 | 2 };
  currencies: Array<{ code: string; symbol: string }>;
  colourways: ShopColourway[];
  recommended: string[];
  /** The colourway they actually own, so the V1 is pictured as theirs. */
  yourBand: { serial: string; colourway: string; label: string; image: string | null; accent: string | null } | null;
};

export const getShop = (token: string, currency = "USD", locale = "en") =>
  request<Shop>(`/api/app/shop?currency=${encodeURIComponent(currency)}&locale=${encodeURIComponent(locale)}`, token);
export const getNotifications = (token: string) =>
  request<{ unread: number; notifications: Notification[] }>("/api/app/notifications", token);


export const getMap = (token: string, id: string) => request<MapDetail>(`/api/app/maps/${id}`, token);

export const patchProfile = (token: string, patch: ProfilePatch) =>
  request<{ ok: true }>("/api/app/profile", token, { method: "PATCH", body: JSON.stringify(patch) });



export const pairBand = (token: string, serial: string, colourway?: string, simulated = false) =>
  request<{ band: Band }>("/api/app/band", token, {
    method: "POST",
    body: JSON.stringify({ serial, colourway, simulated }),
  });

/**
 * Registers a simulated V1 for testing without hardware.
 *
 * It goes through the same endpoint and becomes the same row, so every screen
 * downstream behaves exactly as it would with a real band — which is the only
 * kind of simulator worth having. The serial is derived from the session so two
 * test devices do not fight over one record.
 */
export const simulateBand = (token: string, colourway: string) => {
  const suffix = token.replace(/[^A-Za-z0-9]/g, "").toUpperCase().replace(/[IO01]/g, "X").slice(0, 6).padEnd(6, "X");
  return pairBand(token, `TF1-${suffix}`, colourway, true);
};

export const unpairBand = (token: string) =>
  request<{ ok: true }>("/api/app/band", token, { method: "DELETE" });

export const enrollMap = (token: string, id: string) =>
  request<{ week: number; done: number }>(`/api/app/maps/${id}`, token, {
    method: "POST",
    body: JSON.stringify({}),
  });


export const leaveMap = (token: string, id: string) =>
  request<{ ok: true }>(`/api/app/maps/${id}`, token, { method: "DELETE" });

export const markNotificationsRead = (token: string) =>
  request<{ ok: true }>("/api/app/notifications", token, { method: "POST" });




/** Opens (or reuses) a thread with someone and returns its id. */

export const syncHealth = (token: string, source: string, days: unknown[]) =>
  request<{ written: number; skipped: number; totalDays: number }>("/api/app/health", token, {
    method: "POST",
    body: JSON.stringify({ source, days }),
  });

export const getSessionRuntime = (token: string, mapId: string, sessionId: string) =>
  request<SessionRuntime>(`/api/app/maps/${mapId}/sessions/${sessionId}`, token);

export const finishSession = (
  token: string,
  mapId: string,
  sessionId: string,
  payload: { entries: LoggedEntry[]; durationSeconds?: number; notes?: string },
) =>
  request<{ week: number; done: number; completed: boolean }>(
    `/api/app/maps/${mapId}/sessions/${sessionId}`,
    token,
    { method: "POST", body: JSON.stringify(payload) },
  );

export type CheckoutLine = { slug: string; variantId?: string | null; quantity: number };

export type CheckoutResult = {
  /** The short reference a customer can quote, e.g. TF-4QW8ZR. */
  number: string;
  totals: { subtotalCents: number; taxCents: number; shippingCents: number; totalCents: number };
  /** Present when the gateway wants the customer sent somewhere to pay. */
  redirectUrl?: string | null;
  sandbox?: boolean;
};

export const getPaymentMethods = () =>
  request<{
    methods: string[];
    sandbox: string[];
    /** Public by design; served so rotating it is a deploy, not a release. */
    publishableKey: string | null;
    merchantIdentifier: string | null;
  }>("/api/checkout", null);

/**
 * Prices are never sent. The server resolves every line from the catalogue, so
 * a tampered bag cannot buy anything cheaply.
 */
export const checkout = (
  token: string | null,
  payload: {
    items: CheckoutLine[];
    email: string;
    name: string;
    phone?: string;
    line1?: string;
    line2?: string;
    city?: string;
    postcode?: string;
    country?: string;
    paymentMethod: string;
    locale?: string;
  },
) => request<CheckoutResult>("/api/checkout", token, { method: "POST", body: JSON.stringify(payload) });

export type AdminPaymentBucket = {
  currency: string;
  grossCents: number;
  refundedCents: number;
  netCents: number;
  paidOrders: number;
  refundedOrders: number;
  averageOrderCents: number;
};

export type AdminOverview = {
  members: { total: number; newThisWeek: number; pro: number; payingCustomers: number; trialing: number };
  /** Recurring revenue, with a yearly plan counted as a twelfth per month. */
  subscriptions: { monthly: number; yearly: number; mrrCents: number; arrCents: number };
  waitlist: number;
  orders: { total: number; thisWeek: number; paid: number; sandbox: number; revenueCents: number };
  payments: {
    byCurrency: AdminPaymentBucket[];
    byMethod: Array<{
      method: string;
      orders: number;
      revenue: AdminPaymentBucket[];
    }>;
    byStatus: Array<{ status: string; orders: number }>;
  };
  sales: {
    terrifuel: AdminSalesMetric;
    band: AdminSalesMetric;
    accessories: AdminSalesMetric;
    products: Array<AdminSalesMetric & { slug: string; name: string; category: string; brand: string }>;
  };
  content: { posts: number; comments: number };
  devices: number;
  contact: number;
  imports: number;
};

export type AdminSalesMetric = {
  units: number;
  orders: number;
  revenue: Array<{ currency: string; cents: number }>;
};

export type AdminOrder = {
  id: string; number: string; email: string; name: string; totalCents: number;
  currency: string;
  paymentMethod: string; paymentStatus: string; fulfillmentStatus: string;
  sandbox: boolean; createdAt: string; address: string | null;
  items: Array<{ title: string; variantLabel: string | null; quantity: number; unitPriceCents: number }>;
};

export type AdminCatalogVariant = {
  key: string;
  label: string;
  note: string | null;
  sku: string;
  priceCents: number | null;
  image: string | null;
  colours: string[];
  accent: string | null;
  active: boolean;
  sortOrder: number;
  stockQuantity: number;
  lowStockThreshold: number;
  allowBackorder: boolean;
};

export type AdminCatalogProduct = {
  slug: string;
  name: string;
  tagline: string;
  category: string;
  brand: string;
  partner: boolean;
  description: string;
  priceCents: number;
  compareAtCents: number | null;
  rating: number;
  reviewCount: number;
  badges: string[];
  variantLabel: string | null;
  highlights: string[];
  specs: Array<[string, string]>;
  shipsIn: string;
  fulfilment: "ship" | "subscription";
  subscriptionLabel: string | null;
  subscriptionDiscountPercent: number | null;
  active: boolean;
  featured: boolean;
  sortOrder: number;
  trackInventory: boolean;
  stockQuantity: number;
  lowStockThreshold: number;
  allowBackorder: boolean;
  variants: AdminCatalogVariant[];
  media: Array<{ src: string; alt: string; ratio: number | null; sortOrder: number }>;
};

export const getAdminOverview = (token: string) => request<AdminOverview>("/api/admin/overview", token);
export const getAdminOrders = (token: string) => request<{ orders: AdminOrder[] }>("/api/admin/orders", token);
export const getAdminCatalog = (token: string) => request<{ products: AdminCatalogProduct[] }>("/api/admin/catalog", token);

export const createAdminProduct = (token: string, product: AdminCatalogProduct) =>
  request<{ ok: true; slug: string }>("/api/admin/catalog", token, { method: "POST", body: JSON.stringify(product) });

export const saveAdminProduct = (token: string, product: AdminCatalogProduct) =>
  request<{ ok: true; slug: string }>(`/api/admin/catalog/${encodeURIComponent(product.slug)}`, token, { method: "PATCH", body: JSON.stringify(product) });

export const archiveAdminProduct = (token: string, slug: string) =>
  request<{ ok: true }>(`/api/admin/catalog/${encodeURIComponent(slug)}`, token, { method: "DELETE" });

export const updateAdminOrder = (token: string, id: string, body: Record<string, string>) =>
  request<{ number: string; paymentStatus: string; fulfillmentStatus: string }>(`/api/admin/orders/${id}`, token, {
    method: "PATCH",
    body: JSON.stringify(body),
  });

export type TogetherProduct = {
  slug: string;
  name: string;
  tagline: string;
  price: string;
  priceCents: number;
  image: string | null;
  variantId: string | null;
  variantLabel: string | null;
  needsChoice: boolean;
};

export const getTogether = (token: string, slugs: string[], currency = "USD", locale = "en") =>
  request<{ basis: "orders" | "curated"; sampleSize: number; products: TogetherProduct[] }>(
    `/api/app/shop/together?slugs=${encodeURIComponent(slugs.join(","))}&currency=${encodeURIComponent(currency)}&locale=${encodeURIComponent(locale)}`,
    token,
  );

export const getMapHistory = (token: string, mapId: string) =>
  request<MapHistory>(`/api/app/maps/${mapId}/history`, token);

/** Opens (or reuses) a thread with a coach and returns its id. */
export const messageCoach = (token: string, handle: string) =>
  request<{ id: string }>("/api/app/messages", token, {
    method: "POST",
    body: JSON.stringify({ to: handle }),
  });

export const getThread = (token: string, id: string) => request<Thread>(`/api/app/messages/${id}`, token);

export const sendMessage = (token: string, id: string, body: string) =>
  request<DirectMessage>(`/api/app/messages/${id}`, token, { method: "POST", body: JSON.stringify({ body }) });

export type PlanInfo = {
  plan: "free" | "trial" | "pro";
  active: boolean;
  trialEndsAt: string | null;
  trialDaysLeft: number | null;
  trialExpired: boolean;
  interval: string | null;
  trialAvailable: boolean;
  trialDays: number;
  pricing: { monthly: { cents: number; label: string }; yearly: { cents: number; label: string; note?: string } };
};

export const getPlan = (token: string) => request<PlanInfo>("/api/app/plan", token);

export const startTrial = (token: string) =>
  request<PlanInfo & { started: boolean }>("/api/app/plan", token, {
    method: "POST",
    body: JSON.stringify({ action: "start-trial" }),
  });

/**
 * Starts a Pro subscription.
 *
 * Does not make anybody Pro on its own: with Stripe configured it comes back
 * with a `sheet` to confirm, and the plan only changes once Stripe's webhook
 * reports the first invoice paid. `sandbox: true` means there are no keys on
 * this environment and the plan was granted without money moving.
 */
export const subscribePro = (token: string, interval: "monthly" | "yearly") =>
  request<PlanInfo & {
    sandbox?: boolean;
    sheet?: {
      clientSecret: string | null;
      ephemeralKey: string;
      customerId: string;
      publishableKey: string;
    } | null;
  }>("/api/app/plan", token, {
    method: "POST",
    body: JSON.stringify({ action: "subscribe", interval }),
  });

export const cancelPro = (token: string) =>
  request<PlanInfo & { cancelling?: boolean }>("/api/app/plan", token, {
    method: "POST",
    body: JSON.stringify({ action: "cancel" }),
  });

export type ProductReview = {
  id: string;
  rating: number;
  title: string;
  body: string;
  verified: boolean;
  author: string;
  date: string;
  mine: boolean;
};

export type ProductReviews = {
  /** Null when nobody has written one yet — never a borrowed figure. */
  average: number | null;
  total: number;
  /** Index 0 is one star, index 4 is five. */
  counts: number[];
  mine: string | null;
  reviews: ProductReview[];
};

export const getReviews = (token: string | null, slug: string) =>
  request<ProductReviews>(`/api/app/shop/reviews?slug=${encodeURIComponent(slug)}`, token);

export const writeReview = (
  token: string | null,
  payload: { slug: string; rating: number; title: string; body: string },
) =>
  request<{ id: string; verified: boolean }>("/api/app/shop/reviews", token, {
    method: "POST",
    body: JSON.stringify(payload),
  });

export type PaymentSheetSetup = {
  clientSecret: string;
  ephemeralKey: string;
  customerId: string;
  publishableKey: string;
};

export type AppCheckoutResult = {
  number: string;
  totals: { subtotalCents: number; taxCents: number; shippingCents: number; totalCents: number };
  currency: string;
  chargeAmount: number;
  /** True when Stripe has no keys yet: the order is recorded, nothing charged. */
  sandbox: boolean;
  /** Null in that case; otherwise everything the native sheet needs. */
  sheet: PaymentSheetSetup | null;
};

/**
 * Checkout for the app. Prices are never sent — the server resolves every line
 * from the catalogue, so a tampered bag cannot buy anything cheaply.
 */
export const appCheckout = (
  token: string | null,
  payload: {
    items: CheckoutLine[];
    email: string;
    name: string;
    phone?: string;
    line1?: string;
    line2?: string;
    city?: string;
    postcode?: string;
    country?: string;
    paymentMethod: string;
    currency?: string;
    locale?: string;
  },
) => request<AppCheckoutResult>("/api/app/checkout", token, { method: "POST", body: JSON.stringify(payload) });

/**
 * Tells the server the sheet closed. Not how an order becomes paid — the
 * webhook does that — only how support tells an abandoned checkout from one
 * waiting on Stripe.
 */
export const reportCheckout = (token: string | null, number: string, outcome: "completed" | "cancelled") =>
  request<{ status: string }>("/api/app/checkout", token, {
    method: "PATCH",
    body: JSON.stringify({ number, outcome }),
  });

export type SavedAddress = {
  id: string;
  label: string | null;
  name: string;
  phone: string | null;
  line1: string;
  line2: string | null;
  city: string;
  postcode: string;
  country: string;
  isDefault: boolean;
};

export const getAddresses = (token: string | null) =>
  request<{ addresses: SavedAddress[] }>("/api/app/addresses", token);

export const saveAddress = (
  token: string | null,
  address: Omit<SavedAddress, "id" | "isDefault"> & { isDefault?: boolean },
) => request<SavedAddress>("/api/app/addresses", token, { method: "POST", body: JSON.stringify(address) });

export const deleteAddress = (token: string | null, id: string) =>
  request<{ ok: true }>(`/api/app/addresses?id=${encodeURIComponent(id)}`, token, { method: "DELETE" });

export type OrderLine = {
  slug: string;
  title: string;
  variant: string | null;
  quantity: number;
  unitCents: number;
};

export type TrackedOrder = {
  number: string;
  placedAt: string;
  paymentStatus: string;
  /** pending | packed | shipped | delivered | cancelled */
  fulfillmentStatus: string;
  sandbox: boolean;
  currency: string;
  totalCents: number;
  carrier: string | null;
  trackingNumber: string | null;
  /** Built server-side, so the app never has to know a carrier's URL shape. */
  trackingUrl: string | null;
  packedAt: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  shipsTo: string | null;
  items: OrderLine[];
};

export const getOrders = (token: string | null) =>
  request<{ orders: TrackedOrder[]; active: number }>("/api/app/orders", token);

/** Changes which strap the band is pictured in, everywhere it appears. */
export const setBandColourway = (token: string | null, colourway: string) =>
  request<{ colourway: string }>("/api/app/band", token, {
    method: "PATCH",
    body: JSON.stringify({ colourway }),
  });

export type ReportBlock = { id: string; title: string; rows: Array<[string, string]>; note?: string };
export type HealthReport = {
  name: string;
  generatedAt: string;
  period: string;
  blocks: ReportBlock[];
};

/**
 * A report of the member's own data. Built server-side from the same function
 * the dashboard draws from, so a printed report and the screen it came from
 * can never quote different numbers.
 */
export const getReport = (token: string | null, options: { days?: number; sections?: string[] } = {}) => {
  const query = new URLSearchParams();
  if (options.days) query.set("days", String(options.days));
  if (options.sections?.length) query.set("sections", options.sections.join(","));
  return request<HealthReport>(`/api/app/report?${query}`, token);
};

/** The daily rows as CSV, for a spreadsheet rather than a read. */
export const reportCsvUrl = (days: number) => `${API_BASE}/api/app/report?format=csv&days=${days}`;

/** A short-lived browser link for the same report, so it can be printed. */
export const getReportLink = (token: string | null, options: { days?: number; sections?: string[] } = {}) =>
  request<{ url: string; expiresInMinutes: number }>("/api/app/report/link", token, {
    method: "POST",
    body: JSON.stringify(options),
  });
