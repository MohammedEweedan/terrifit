import { NextResponse } from "next/server";
import { FORBIDDEN, requireAdmin } from "@/lib/admin";
import { adminWaitlist } from "@/lib/admin-data";

export const runtime = "nodejs";

/** The waitlist, searchable by name, email or referral code. */
export async function GET(request: Request) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json(FORBIDDEN, { status: 403 });

  const query = new URL(request.url).searchParams.get("q") ?? "";
  return NextResponse.json(await adminWaitlist(query), {
    headers: { "Cache-Control": "private, no-store" },
  });
}
