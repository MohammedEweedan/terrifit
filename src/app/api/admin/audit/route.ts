import { NextResponse } from "next/server";
import { FORBIDDEN, requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

/** Who did what. Read-only by design — there is no endpoint that edits this. */
export async function GET(request: Request) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json(FORBIDDEN, { status: 403 });

  const entries = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { actor: { select: { name: true, email: true } } },
  });

  return NextResponse.json(
    {
      entries: entries.map((entry) => ({
        id: entry.id,
        action: entry.action,
        target: entry.target,
        detail: entry.detail,
        actor: entry.actor,
        createdAt: entry.createdAt.toISOString(),
      })),
    },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
