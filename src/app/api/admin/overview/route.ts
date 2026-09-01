import { NextResponse } from "next/server";
import { FORBIDDEN, requireAdmin } from "@/lib/admin";
import { adminOverview } from "@/lib/admin-data";

export const runtime = "nodejs";

/**
 * The numbers worth seeing on opening the console.
 *
 * Delegates to `adminOverview` rather than running its own queries: this route
 * and the server-rendered console used to compute the same figures separately,
 * and they drifted — the web console gained MRR while the app kept showing the
 * old shape. One function, one answer.
 */
export async function GET(request: Request) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json(FORBIDDEN, { status: 403 });

  return NextResponse.json(await adminOverview(), {
    headers: { "Cache-Control": "private, no-store" },
  });
}
