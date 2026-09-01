import { NextResponse } from "next/server";
import { getRequestUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { notify } from "@/lib/push";

export const runtime = "nodejs";

/** Follow or unfollow, toggled. The person followed gets told. */
export async function POST(request: Request, context: { params: Promise<{ handle: string }> }) {
  const viewer = await getRequestUser(request);
  if (!viewer) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const { handle } = await context.params;
  const target = await prisma.user.findFirst({
    where: { OR: [{ handle }, { id: handle }] },
    select: { id: true, name: true },
  });
  if (!target) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (target.id === viewer.id) return NextResponse.json({ error: "cannot_follow_self" }, { status: 409 });

  const key = { followerId_followeeId: { followerId: viewer.id, followeeId: target.id } };
  const existing = await prisma.follow.findUnique({ where: key, select: { followerId: true } });

  if (existing) {
    await prisma.follow.delete({ where: key });
  } else {
    await prisma.follow.create({ data: { followerId: viewer.id, followeeId: target.id } });
    await notify({
      userId: target.id,
      kind: "follow",
      title: `${viewer.name} followed you`,
      body: "They'll see your public posts in their feed.",
      path: `/user/${viewer.id}`,
    });
  }

  const followers = await prisma.follow.count({ where: { followeeId: target.id } });
  return NextResponse.json({ following: !existing, followers });
}
