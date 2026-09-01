import { NextResponse } from "next/server";
import { z } from "zod";
import { getRequestUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { notify } from "@/lib/push";
import { clientKey, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getRequestUser(request);
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const { id } = await context.params;
  const comments = await prisma.comment.findMany({
    where: { postId: id },
    orderBy: { createdAt: "asc" },
    take: 200,
    include: { author: { select: { id: true, name: true, handle: true } } },
  });

  return NextResponse.json(
    {
      comments: comments.map((comment) => ({
        id: comment.id,
        body: comment.body,
        createdAt: comment.createdAt.toISOString(),
        author: {
          id: comment.author.id,
          name: comment.author.name,
          handle: comment.author.handle,
          isMe: comment.author.id === user.id,
        },
      })),
    },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}

const schema = z.object({ body: z.string().trim().min(1).max(1000) });

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getRequestUser(request);
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  if (!rateLimit(`comment:${user.id}:${clientKey(request)}`, 30, 60_000)) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const { id } = await context.params;
  const post = await prisma.post.findUnique({ where: { id }, select: { authorId: true } });
  if (!post) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "validation" }, { status: 422 });

  // The count is denormalised onto the post, so both writes go together.
  const [comment] = await prisma.$transaction([
    prisma.comment.create({
      data: { postId: id, authorId: user.id, body: parsed.data.body },
      include: { author: { select: { id: true, name: true, handle: true } } },
    }),
    prisma.post.update({ where: { id }, data: { commentCount: { increment: 1 } } }),
  ]);

  // Nobody needs telling they commented on their own post.
  if (post.authorId !== user.id) {
    await notify({
      userId: post.authorId,
      kind: "comment",
      title: `${user.name} commented`,
      body: parsed.data.body.slice(0, 120),
    });
  }

  return NextResponse.json(
    {
      id: comment.id,
      body: comment.body,
      createdAt: comment.createdAt.toISOString(),
      author: { id: comment.author.id, name: comment.author.name, handle: comment.author.handle, isMe: true },
    },
    { status: 201 },
  );
}
