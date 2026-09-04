import { NextResponse } from "next/server";
import { z } from "zod";
import { getRequestUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { clientKey, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

const createSchema = z.object({
  kind: z.enum(["note", "progress"]),
  body: z.string().trim().min(1).max(2000),
  /** A remote URL or a data URI for a progress shot. */
  mediaUrl: z.string().trim().max(2_000_000).optional().nullable(),
  visibility: z.enum(["public", "members"]).default("public"),
});

export async function POST(request: Request) {
  const user = await getRequestUser(request);
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  if (!(await rateLimit(`post:${user.id}:${clientKey(request)}`, 20, 60_000))) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = createSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "validation", fields: parsed.error.issues.map((issue) => issue.path.join(".")) },
      { status: 422 },
    );
  }

  const input = parsed.data;
  const post = await prisma.post.create({
    data: {
      authorId: user.id,
      kind: input.kind,
      body: input.body,
      mediaUrl: input.mediaUrl ?? null,
      liveState: null,
      visibility: input.visibility,
    },
    select: { id: true, createdAt: true },
  });

  return NextResponse.json({ id: post.id, createdAt: post.createdAt.toISOString() }, { status: 201 });
}
