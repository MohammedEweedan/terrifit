/**
 * Arcads script generator.
 *
 * Arcads produces one thing well: an AI actor talking to camera. That makes it
 * the right tool for paid-social creative and the wrong tool for the hero loop
 * on the landing page, which the media manifest specifies as a *silent*,
 * text-free, single-shot clip of somebody training. A talking head cannot fill
 * that slot. See `--hero` for what that slot actually needs.
 *
 * Everything below is generated from the site's own copy modules rather than
 * written here, so an ad can never claim something the product page does not.
 * When the band copy changes, the scripts change with it.
 *
 * Two hard constraints are enforced, not suggested:
 *
 *   1. **No regulated claims.** ECG, AFib, blood glucose, diagnosis. Marketing
 *      these without clearance is the fastest way to turn a pre-order book into
 *      a refund event. See docs/v1-band-blueprint.md §5.
 *   2. **No fabricated testimony.** The actor is synthetic and the product does
 *      not exist yet. A synthetic person saying "I've worn this for three
 *      months" is a fabricated review, and it is illegal in most of the markets
 *      on the shipping list. Every script here is presenter voice.
 *
 * Usage:
 *   node --experimental-strip-types scripts/arcads.mjs           # all variants
 *   node --experimental-strip-types scripts/arcads.mjs --json    # machine-readable
 *   node --experimental-strip-types scripts/arcads.mjs --hero    # the hero-loop brief
 */

import { en } from "../src/i18n/pages/en.ts";
import {
  MANUFACTURING_TRIGGER, FOUNDING_ORDERS, FUEL_GIFT_THRESHOLD_CENTS,
} from "../src/lib/shop/offer-constants.ts";

const band = en.band;

/* -------------------------------------------------------------------------- */
/* The claim guard                                                            */

/**
 * Words that must never reach an ad, with the reason attached so anybody
 * editing this list has to argue with the reason rather than just delete it.
 */
const BANNED = [
  [/\becg\b|electrocardiogram/i, "ECG is a regulated function — FDA De Novo, EU MDR Class IIa"],
  [/\bafib\b|atrial fibrillation|arrhythmi/i, "Rhythm classification is a regulated diagnostic claim"],
  [/glucose|blood sugar|diabet/i, "Non-invasive glucose has drawn specific FDA warnings"],
  [/\bdiagnos|\bcure\b|\btreat(s|ment)?\b|medical[- ]grade/i, "Medical claim — Terrifit is a wellness product"],
  [/\bclinically proven\b|\bFDA[- ]approved\b|\bCE[- ]certified\b/i, "Unsubstantiated regulatory claim"],
  [/guarantee(d)? results|lose \d+|burn fat fast/i, "Outcome guarantee — unsubstantiable and unlawful in most markets"],
  [/\bI(?:'ve| have)\s+(?:been\s+)?(?:used|worn|tried)/i, "First-person testimony from a synthetic actor is a fabricated review"],
  [/changed my life|best purchase/i, "Testimonial framing from an actor who has not used the product"],
];

function lint(text) {
  return BANNED.filter(([pattern]) => pattern.test(text)).map(([, reason]) => reason);
}

/* -------------------------------------------------------------------------- */
/* Scripts                                                                    */

const price = "$229";
const fuelThreshold = `$${FUEL_GIFT_THRESHOLD_CENTS / 100}`;

/**
 * Each variant tests one idea, so a losing variant tells you which idea lost.
 * Running six versions of the same angle only tells you which thumbnail won.
 */
const VARIANTS = [
  {
    id: "why-this-number",
    angle: "The wedge. The one thing no competitor does.",
    actor: "30s–40s, calm, credible. Gym or plain wall. Not shouting.",
    delivery: "Conversational. The tone of somebody explaining, not selling.",
    seconds: 24,
    hook: "Your fitness app gives you a recovery score. Ask it why, and it has nothing.",
    body: [
      "Every wearable does the same thing — one number in the morning, and no working.",
      // Pulled from the band page so the promise in the ad is the promise on
      // the site, word for word.
      band.story.chapters[5].body,
      "That is the whole difference. You can check it.",
    ],
    cta: "Terrifit dot com. Show your work.",
  },
  {
    id: "screenless",
    angle: "The product decision, as the differentiator.",
    actor: "25s–35s, dry, slightly amused. Plain background.",
    delivery: "Deadpan. The joke is that nothing happens.",
    seconds: 21,
    hook: "This band has no screen. No notifications. Nothing buzzes.",
    body: [
      "It does one thing: it reads you, all day, for fifteen days on a charge.",
      "There is nothing to check mid-set and nothing to charge overnight.",
      "The band measures. The app explains. That is the entire idea.",
    ],
    cta: `Pre-order the V1 at Terrifit dot com. ${price}.`,
  },
  {
    id: "founding-hundred",
    angle: "The offer. Use when you need volume, not comprehension.",
    actor: "20s–30s, energetic but not manic. Natural light.",
    delivery: "Quick. This one is carried by the offer, not the argument.",
    seconds: 18,
    hook: `The first ${FOUNDING_ORDERS} Terrifit orders get kit, not a discount.`,
    body: [
      `Spend over ${fuelThreshold} on Terrifuel and a Terrifits tee comes with it.`,
      "Order the V1 band and you get the hoodie.",
      "Do both and you get both.",
    ],
    cta: "Terrifit dot com. The counter on the site is real.",
  },
  {
    id: "pre-order-honesty",
    angle: "Trust-first. Converts colder traffic; lower volume, higher intent.",
    actor: "35s–45s, straightforward, no gym clothes. Reads as a founder, not a model.",
    delivery: "Level and unhurried. No music bed.",
    seconds: 27,
    hook: "Here is exactly how this pre-order works, before you spend anything.",
    body: [
      `We place the manufacturing order at ${MANUFACTURING_TRIGGER} units, not on a date we might miss.`,
      "The counter on the product page is the real number, straight from the order table.",
      "Your card is charged now and refunded in full, on request, any time before your band ships.",
    ],
    cta: "That is the whole deal. Terrifit dot com.",
  },
  {
    id: "fitness-age",
    angle: "The shareable number. Top-of-funnel; sends people to a free tool.",
    actor: "Any age, expressive. Reaction-shot friendly.",
    delivery: "Curious rather than promotional.",
    seconds: 19,
    hook: "Your fitness age is not your real age, and you can work it out in about a minute.",
    body: [
      "It comes from two heart rates — your maximum and your resting.",
      "Terrifit does the maths and shows you the equation it used.",
      "It is free, and it does not need the band.",
    ],
    cta: "Terrifit dot com slash fitness age.",
  },
];

/* -------------------------------------------------------------------------- */
/* Output                                                                     */

function fullText(v) {
  return [v.hook, ...v.body, v.cta].join(" ");
}

function render(v) {
  const words = fullText(v).split(/\s+/).length;
  return `
────────────────────────────────────────────────────────────
${v.id.toUpperCase()}   ·   ~${v.seconds}s   ·   ${words} words
────────────────────────────────────────────────────────────
ANGLE     ${v.angle}
ACTOR     ${v.actor}
DELIVERY  ${v.delivery}

SCRIPT (paste this into Arcads)

${v.hook}

${v.body.join("\n\n")}

${v.cta}

ON-SCREEN TEXT
  0:00  ${v.hook.length > 46 ? v.hook.slice(0, 43) + "…" : v.hook}
  end   Terrifit — pre-order the V1
`.trimEnd();
}

const HERO_BRIEF = `
────────────────────────────────────────────────────────────
HERO LOOP — NOT AN ARCADS JOB
────────────────────────────────────────────────────────────
The landing page hero (/media/hero-loop.mp4) is specified as:

  8–12 seconds · 16:9 · silent · no cuts · no on-screen text
  An athlete training while wearing the V1, band visible twice
  Dark gym, single hard light source
  Under 4 MB, plus a .webm sibling

Arcads generates an actor talking to camera. It cannot produce a
silent single-take atmospheric loop, and a talking head in that
slot would fight the headline sitting on top of it.

Three ways to fill it, cheapest first:

  1. Leave it empty. The hero already falls back to a still with a
     slow push-in, and it looks deliberate. Do this until the band
     physically exists.
  2. Licensed stock, no wearable visible on the wrist. Costs about
     $80. Honest, because it is not pretending to show your product.
  3. Shoot it, once you have a unit. Half a day, one light, one
     athlete. This is the only version that shows the real band.

Do NOT generate the hero with an AI video tool showing a band on a
wrist. You do not have the product yet, the render still shows a
screen the JCVital Pro V8 does not have, and fabricated product
footage in the hero of a page taking deposits is the single worst
place to be caught.
`.trimEnd();

/* -------------------------------------------------------------------------- */

const args = new Set(process.argv.slice(2));

if (args.has("--hero")) {
  console.log(HERO_BRIEF);
  process.exit(0);
}

// The guard runs on every variant regardless of output mode.
let blocked = 0;
for (const v of VARIANTS) {
  const problems = lint(fullText(v));
  if (problems.length) {
    blocked += 1;
    console.error(`\n✗ ${v.id} is blocked:`);
    for (const reason of problems) console.error(`    · ${reason}`);
  }
}

if (args.has("--json")) {
  console.log(JSON.stringify({ variants: VARIANTS, blocked }, null, 2));
  process.exit(blocked ? 1 : 0);
}

if (blocked === 0) {
  console.log(`\n${VARIANTS.length} scripts · all clear of regulated and testimonial claims`);
  for (const v of VARIANTS) console.log(render(v));
  console.log(HERO_BRIEF);
  console.log(`
────────────────────────────────────────────────────────────
RUNNING THESE
────────────────────────────────────────────────────────────
Start with why-this-number and founding-hundred. They test the two
different things you actually need to know: whether the wedge lands,
and whether the offer moves people who did not care about the wedge.

Two actors per script, same words. Actor choice moves performance
more than copy at this stage, and you cannot tell which until you
have run both.

Kill on cost per pre-order, not on views. A video with ten thousand
views and no orders is a video about the wrong thing.
`);
}

process.exit(blocked ? 1 : 0);
