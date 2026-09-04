/**
 * Launch preflight.
 *
 * Answers one question — can this deployment take a real customer's money and
 * a real person's health data — and answers it by checking, not by assuming.
 * Every check names what is wrong and what to set, because a preflight that
 * says "failed" and stops is a preflight nobody runs twice.
 *
 *   node scripts/preflight.mjs            # checks the current environment
 *   node scripts/preflight.mjs --live     # checks it as if NODE_ENV=production
 *
 * Exits non-zero if anything that would take money or leak data is wrong.
 */
import { readFileSync, existsSync } from "node:fs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";

const live = process.argv.includes("--live") || process.env.NODE_ENV === "production";
const env = (key) => process.env[key]?.trim() || "";

const results = [];
const ok = (area, message) => results.push({ level: "ok", area, message });
const warn = (area, message, fix) => results.push({ level: "warn", area, message, fix });
const fail = (area, message, fix) => results.push({ level: "fail", area, message, fix });

/* -------------------------------------------------------------------------- */
/* Database                                                                   */

const connectionString = env("DATABASE_URL");
let prisma = null;

if (!connectionString) {
  fail("database", "DATABASE_URL is not set.", 'DATABASE_URL="postgresql://user:pass@host:5432/terrifit"');
} else if (!connectionString.startsWith("postgres")) {
  fail("database", `DATABASE_URL is not Postgres (${connectionString.split(":")[0]}).`,
       "The schema targets postgresql; another provider will not migrate.");
} else {
  prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
  try {
    await prisma.$queryRaw`SELECT 1`;
    ok("database", "Postgres reachable.");

    const applied = await prisma.$queryRaw`
      SELECT count(*)::int AS n FROM "_prisma_migrations" WHERE finished_at IS NOT NULL`;
    ok("database", `${applied[0].n} migrations applied.`);

    const pending = await prisma.$queryRaw`
      SELECT count(*)::int AS n FROM "_prisma_migrations" WHERE finished_at IS NULL`;
    if (pending[0].n > 0) {
      fail("database", `${pending[0].n} migration(s) started but never finished.`,
           "Resolve with `prisma migrate resolve` before serving traffic.");
    }

    const products = await prisma.shopProduct.count();
    if (products === 0) fail("catalog", "No products in the database.", "The catalog seeds on first request; hit /en/shop once.");
    else ok("catalog", `${products} products.`);

    const admins = await prisma.user.count({ where: { isAdmin: true } });
    if (admins === 0) fail("access", "No admin account exists.", "node scripts/grant-admin.mjs you@example.com");
    else ok("access", `${admins} admin account(s).`);
  } catch (error) {
    fail("database", `Cannot query Postgres: ${error.message.split("\n")[0]}`, "Check DATABASE_URL and that the server is up.");
  }
}

/* -------------------------------------------------------------------------- */
/* Taking money                                                               */

const stripe = env("STRIPE_SECRET_KEY");
const publishable = env("STRIPE_PUBLISHABLE_KEY");
const webhook = env("STRIPE_WEBHOOK_SECRET");

if (!stripe) {
  (live ? fail : warn)("payments", "STRIPE_SECRET_KEY is not set — card, Apple Pay and Google Pay are all unavailable.",
    "Set it from the Stripe dashboard. Without it a live site can take no card payment at all.");
} else {
  ok("payments", `Stripe secret key set (${stripe.startsWith("sk_live") ? "live" : "test"} mode).`);
  if (live && !stripe.startsWith("sk_live")) {
    fail("payments", "Stripe is in TEST mode on a live deployment — no real payment will ever settle.",
         "Swap in the sk_live key.");
  }
  if (!publishable) fail("payments", "STRIPE_PUBLISHABLE_KEY is not set — the in-app payment sheet cannot initialise.", "Set it alongside the secret key.");
  else if (live && !publishable.startsWith("pk_live")) fail("payments", "Publishable key is a test key while the secret key is live.", "The pair must match mode.");
  if (!webhook) {
    fail("payments", "STRIPE_WEBHOOK_SECRET is not set — payment confirmations cannot be verified, so paid orders stay pending forever.",
         "Create the endpoint in Stripe and set its signing secret.");
  } else ok("payments", "Webhook signing secret set.");
}

const sandboxFlag = env("ALLOW_SANDBOX_CHECKOUT").toLowerCase();
const sandboxOn = sandboxFlag === "true" ? true : sandboxFlag === "false" ? false : !live;
if (sandboxOn && live) {
  fail("payments", "Sandbox checkout is ON in a live environment — unpaid orders will be recorded as real ones.",
       "ALLOW_SANDBOX_CHECKOUT=false");
} else if (sandboxOn) {
  warn("payments", "Sandbox checkout is on (fine for development — orders are recorded unpaid and labelled).", null);
} else ok("payments", "Sandbox checkout is off.");

for (const [name, keys] of [["PayPal", ["PAYPAL_CLIENT_ID", "PAYPAL_SECRET"]], ["Crypto", ["NOWPAYMENTS_API_KEY"]]]) {
  const set = keys.filter((key) => env(key));
  if (set.length === 0) warn("payments", `${name} is not configured — the method is hidden at checkout.`, null);
  else if (set.length < keys.length) fail("payments", `${name} is half-configured (${keys.filter((k) => !env(k)).join(", ")} missing).`, "Set all of them or none.");
  else ok("payments", `${name} configured.`);
}

/* -------------------------------------------------------------------------- */
/* Reaching people                                                            */

if (!env("RESEND_API_KEY") || !env("EMAIL_FROM")) {
  (live ? fail : warn)("email", "Email is not configured — password resets and order confirmations will not send.",
    "RESEND_API_KEY and EMAIL_FROM");
} else ok("email", `Email configured, sending as ${env("EMAIL_FROM")}.`);

const site = env("NEXT_PUBLIC_SITE_URL");
if (!site) {
  (live ? fail : warn)("site", "NEXT_PUBLIC_SITE_URL is not set — reset links, report links, sitemap and robots all fall back to https://terrifit.com.",
    'NEXT_PUBLIC_SITE_URL="https://your-domain"');
} else if (live && !site.startsWith("https://")) {
  fail("site", `NEXT_PUBLIC_SITE_URL is not https (${site}) — password reset links would be sent over plain http.`, "Use an https origin.");
} else ok("site", `Site URL ${site}.`);

/* -------------------------------------------------------------------------- */
/* Content                                                                    */

const manifest = "public/media/MANIFEST.md";
if (existsSync(manifest)) {
  const missing = [...readFileSync(manifest, "utf8").matchAll(/`(\/[^`]+\.(?:jpg|png|avif|webp))`/g)]
    .map((match) => match[1])
    .filter((path, index, all) => all.indexOf(path) === index)
    .filter((path) => !existsSync(`public${path}`));
  if (missing.length) {
    warn("media", `${missing.length} image slot(s) have no file; those tiles render a branded placeholder.`,
         missing.join(", "));
  } else ok("media", "Every referenced image is present.");
}

/* -------------------------------------------------------------------------- */

await prisma?.$disconnect();

const order = { fail: 0, warn: 1, ok: 2 };
results.sort((a, b) => order[a.level] - order[b.level]);

const mark = { ok: "  ok  ", warn: " warn ", fail: " FAIL " };
let area = "";
for (const result of results) {
  if (result.area !== area) {
    area = result.area;
    console.log(`\n${area.toUpperCase()}`);
  }
  console.log(`[${mark[result.level]}] ${result.message}`);
  if (result.fix) console.log(`           → ${result.fix}`);
}

const failed = results.filter((r) => r.level === "fail").length;
const warned = results.filter((r) => r.level === "warn").length;

console.log(
  `\n${failed ? `NOT READY — ${failed} blocking issue${failed === 1 ? "" : "s"}` : "Ready to launch"}` +
  `${warned ? `, ${warned} warning${warned === 1 ? "" : "s"}` : ""}.` +
  `${live ? "" : "  (Checked as development; run with --live for launch rules.)"}`,
);

process.exit(failed ? 1 : 0);
