import { NextResponse } from "next/server";
import { getRequestUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

/**
 * Toggles a like.
 *
 * The count is denormalised onto the post, so both writes go in one
 * transaction — a like that increments nothing, or a count that outlives its
 * row, is worse than no like at all.
 */
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getRequestUser(request);
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const { id } = await context.params;
  const post = await prisma.post.findUnique({ where: { id }, select: { id: true } });
  if (!post) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const existing = await prisma.postLike.findUnique({
    where: { postId_userId: { postId: id, userId: user.id } },
    select: { postId: true },
  });

  const [, updated] = existing
    ? await prisma.$transaction([
        prisma.postLike.delete({ where: { postId_userId: { postId: id, userId: user.id } } }),
        prisma.post.update({ where: { id }, data: { likeCount: { decrement: 1 } }, select: { likeCount: true } }),
      ])
    : await prisma.$transaction([
        prisma.postLike.create({ data: { postId: id, userId: user.id } }),
        prisma.post.update({ where: { id }, data: { likeCount: { increment: 1 } }, select: { likeCount: true } }),
      ]);

  return NextResponse.json({ liked: !existing, likeCount: updated.likeCount });
}
