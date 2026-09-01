import { NextResponse } from "next/server";
import { audit, FORBIDDEN, requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

/** Removes a post. The audit entry keeps what was removed and by whom. */
export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json(FORBIDDEN, { status: 403 });

  const { id } = await context.params;
  const post = await prisma.post.findUnique({
    where: { id },
    select: { id: true, body: true, kind: true, author: { select: { email: true } } },
  });
  if (!post) return NextResponse.json({ error: "not_found" }, { status: 404 });

  await prisma.post.delete({ where: { id } });
  await audit(admin.id, "post.remove", post.id, {
    author: post.author.email,
    kind: post.kind,
    body: post.body.slice(0, 280),
  });

  return NextResponse.json({ ok: true });
}
