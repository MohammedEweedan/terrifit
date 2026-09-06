import { NextResponse } from "next/server";
import { z } from "zod";
import { getRequestUser } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { changeCoaching, CoachingConflict, loadCoaching } from "@/lib/coaching/service";

export const runtime = "nodejs";
const headers = { "Cache-Control": "private, no-store" };
const common = { revision: z.number().int().nonnegative(), day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), slot: z.string().length(64) };
const schema = z.discriminatedUnion("action", [
  z.object({ ...common, action: z.literal("propose"), checkIn: z.object({ minutes: z.number().int().min(15).max(120), feeling: z.enum(["ready", "tired", "pain"]) }) }),
  z.object({ ...common, action: z.literal("apply"), proposalId: z.string().uuid() }),
  z.object({ ...common, action: z.literal("undo") }),
]);

export async function GET(request: Request) {
  const user = await getRequestUser(request);
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401, headers });
  return NextResponse.json(await loadCoaching(user.id), { headers });
}

export async function POST(request: Request) {
  const user = await getRequestUser(request);
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401, headers });
  if (!(await rateLimit(`coach:${user.id}`, 30, 60_000))) return NextResponse.json({ error: "rate_limited", message: "Please wait a moment and try again." }, { status: 429, headers });
  const input = schema.safeParse(await request.json().catch(() => null));
  if (!input.success) return NextResponse.json({ error: "validation" }, { status: 422, headers });
  try { return NextResponse.json(await changeCoaching(user.id, input.data), { headers }); }
  catch (error) {
    if (error instanceof CoachingConflict) return NextResponse.json({ error: "plan_changed", message: error.message }, { status: 409, headers });
    throw error;
  }
}
