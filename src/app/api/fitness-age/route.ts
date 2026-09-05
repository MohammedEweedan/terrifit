import { NextResponse } from "next/server";
import { z } from "zod";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import {
  estimateVo2Max, maxHeartRate, medianRestingHr,
  MAX_SWING, SENSITIVITY, type Sex,
} from "@/lib/health/advanced";

export const runtime = "nodejs";

/**
 * The free fitness-age estimate.
 *
 * No account, no stored data, no session — someone lands from a link, gets a
 * number, and decides whether to care. Reusing the app's own functions matters:
 * if the tool and the product disagreed about the same person, the tool would
 * be an advert for a product that does something else.
 */
const schema = z.object({
  age: z.coerce.number().int().min(13).max(100),
  restingHr: z.coerce.number().int().min(30).max(140),
  sex: z.enum(["female", "male", "other", "undisclosed"]).default("undisclosed"),
});

export async function POST(request: Request) {
  if (!(await rateLimit(`fitnessage:${clientKey(request)}`, 30, 60_000))) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "validation" }, { status: 422 });
  }

  const { age, restingHr, sex } = parsed.data;
  const vo2 = Math.max(15, Math.min(75, estimateVo2Max(age, restingHr)));

  // Identical arithmetic to the app, from the same module: a tool that
  // disagreed with the product about the same person would be advertising
  // something else.
  const median = medianRestingHr(sex as Sex);
  const z = (restingHr - median) / 9.5;
  const offset = MAX_SWING * Math.tanh(z * SENSITIVITY);
  const years = Math.round(Math.max(18, Math.min(85, age + offset)) * 10) / 10;

  return NextResponse.json({
    years,
    chronological: age,
    delta: Math.round((years - age) * 10) / 10,
    vo2max: Math.round(vo2 * 10) / 10,
    maxHr: Math.round(maxHeartRate(age)),
    // The reference the estimate is measured against. Returned so the page can
    // show where the reading actually sits rather than just asserting a verdict
    // — the whole argument for this product is showing the working.
    median,
    restingHr,
    capped: Math.abs(offset) >= MAX_SWING * 0.9,
  });
}
