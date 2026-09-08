import { NextResponse } from "next/server";
import { FORBIDDEN, requireAdmin } from "@/lib/admin";
import { adminMessages } from "@/lib/admin-data";

export const runtime = "nodejs";

/** Contact messages, unhandled first. */
export async function GET(request: Request) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json(FORBIDDEN, { status: 403 });

  return NextResponse.json(await adminMessages(), {
    headers: { "Cache-Control": "private, no-store" },
  });
}
