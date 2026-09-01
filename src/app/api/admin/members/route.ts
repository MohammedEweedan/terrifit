import { NextResponse } from "next/server";
import { FORBIDDEN, requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

/**
 * Members, searchable.
 *
 * Deliberately does not return health data. Staff can see that someone has
 * imported data and how much; reading the readings themselves needs a reason
 * and a different endpoint, so the everyday list cannot leak it.
 */
export async function GET(request: Request) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json(FORBIDDEN, { status: 403 });

  const url = new URL(request.url);
  const query = url.searchParams.get("q")?.trim() ?? "";
  const take = Math.min(100, Number(url.searchParams.get("limit") ?? 50) || 50);

  const users = await prisma.user.findMany({
    where: query
      ? { OR: [{ email: { contains: query } }, { name: { contains: query } }, { handle: { contains: query } }] }
      : undefined,
    orderBy: { createdAt: "desc" },
    take,
    select: {
      id: true, email: true, name: true, handle: true, role: true, plan: true,
      isAdmin: true, createdAt: true,
      _count: { select: { posts: true, metrics: true, bands: true } },
    },
  });

  return NextResponse.json(
    {
      members: users.map((user) => ({
        id: user.id,
        email: user.email,
        name: user.name,
        handle: user.handle,
        role: user.role,
        plan: user.plan,
        isAdmin: user.isAdmin,
        createdAt: user.createdAt.toISOString(),
        posts: user._count.posts,
        metricDays: user._count.metrics,
        bands: user._count.bands,
      })),
    },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
