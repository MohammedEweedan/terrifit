import { NextResponse } from "next/server";
import { getRequestUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

/** Someone else's profile, as the viewer is allowed to see it. */
export async function GET(request: Request, context: { params: Promise<{ handle: string }> }) {
  const viewer = await getRequestUser(request);
  if (!viewer) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const { handle } = await context.params;
  const user = await prisma.user.findFirst({
    where: { OR: [{ handle }, { id: handle }] },
    select: { id: true, name: true, handle: true, role: true, createdAt: true },
  });
  if (!user) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const [profile, posts, followers, following, follow] = await Promise.all([
    prisma.profile.findUnique({
      where: { userId: user.id },
      select: { bio: true, goal: true, activityLevel: true, shareWithCreators: true },
    }),
    prisma.post.findMany({
      where: { authorId: user.id, visibility: "public" },
      orderBy: { createdAt: "desc" },
      take: 30,
      include: { likes: { where: { userId: viewer.id }, select: { userId: true } } },
    }),
    prisma.follow.count({ where: { followeeId: user.id } }),
    prisma.follow.count({ where: { followerId: user.id } }),
    prisma.follow.findUnique({
      where: { followerId_followeeId: { followerId: viewer.id, followeeId: user.id } },
      select: { followerId: true },
    }),
  ]);

  return NextResponse.json(
    {
      user: { ...user, createdAt: user.createdAt.toISOString(), isMe: user.id === viewer.id },
      profile: profile ?? null,
      stats: { posts: posts.length, followers, following },
      isFollowing: follow !== null,
      posts: posts.map((post) => ({
        id: post.id,
        kind: post.kind,
        body: post.body,
        mediaUrl: post.mediaUrl,
        liveState: post.liveState,
        visibility: post.visibility,
        likeCount: post.likeCount,
        commentCount: post.commentCount,
        likedByMe: post.likes.length > 0,
        createdAt: post.createdAt.toISOString(),
        author: { id: user.id, name: user.name, handle: user.handle, role: user.role, isMe: user.id === viewer.id },
      })),
    },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
