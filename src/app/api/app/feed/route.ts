import { NextResponse } from "next/server";
import { getRequestUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

const PAGE = 30;

/**
 * The feed.
 *
 * "Following" is the default the app opens on, with a discover tab behind it,
 * because a feed of strangers on day one is what makes people close a fitness
 * app and not come back.
 */
export async function GET(request: Request) {
  const user = await getRequestUser(request);
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const scope = new URL(request.url).searchParams.get("scope") === "discover" ? "discover" : "following";

  const following = await prisma.follow.findMany({
    where: { followerId: user.id },
    select: { followeeId: true },
  });
  const ids = following.map((row) => row.followeeId);

  // The circle rail is the people you actually follow.
  const circlePeople = ids.length
    ? await prisma.user.findMany({
        where: { id: { in: ids } },
        select: {
          id: true,
          name: true,
          handle: true,
        },
        take: 20,
      })
    : [];

  const posts = await prisma.post.findMany({
    where:
      scope === "following"
        ? { authorId: { in: [...ids, user.id] } }
        : { visibility: "public", authorId: { notIn: [user.id] } },
    orderBy: { createdAt: "desc" },
    take: PAGE,
    include: {
      author: { select: { id: true, name: true, handle: true, role: true } },
      likes: { where: { userId: user.id }, select: { userId: true } },
    },
  });

  return NextResponse.json(
    {
      scope,
      followingCount: ids.length,
      circle: circlePeople.map((person) => ({
        id: person.id,
        name: person.name,
        handle: person.handle,
      })),
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
        author: {
          id: post.author.id,
          name: post.author.name,
          handle: post.author.handle,
          role: post.author.role,
          isMe: post.author.id === user.id,
        },
      })),
    },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
