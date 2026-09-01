import { NextResponse } from "next/server";
import { FORBIDDEN, requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

/** The moderation queue: newest public content first. */
export async function GET(request: Request) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json(FORBIDDEN, { status: 403 });

  const posts = await prisma.post.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { author: { select: { id: true, name: true, handle: true, email: true } } },
  });

  return NextResponse.json(
    {
      posts: posts.map((post) => ({
        id: post.id,
        kind: post.kind,
        body: post.body,
        mediaUrl: post.mediaUrl,
        visibility: post.visibility,
        likeCount: post.likeCount,
        commentCount: post.commentCount,
        createdAt: post.createdAt.toISOString(),
        author: post.author,
      })),
    },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
