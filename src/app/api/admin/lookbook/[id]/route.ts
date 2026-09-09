import { NextResponse } from "next/server";
import { z } from "zod";
import { audit, FORBIDDEN, requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

const schema = z.object({
  published: z.boolean().optional(),
  sortOrder: z.number().int().min(0).max(999).optional(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json(FORBIDDEN, { status: 403 });

  const { id } = await params;
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success || Object.keys(parsed.data).length === 0) {
    return NextResponse.json({ error: "validation" }, { status: 422 });
  }

  const look = await prisma.lookbookLook.update({ where: { id }, data: parsed.data }).catch(() => null);
  if (!look) return NextResponse.json({ error: "not_found" }, { status: 404 });
  await audit(admin.id, "lookbook.update", id, parsed.data);
  return NextResponse.json({ id: look.id, published: look.published, sortOrder: look.sortOrder });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json(FORBIDDEN, { status: 403 });

  const { id } = await params;
  const gone = await prisma.lookbookLook.delete({ where: { id } }).catch(() => null);
  if (!gone) return NextResponse.json({ error: "not_found" }, { status: 404 });
  await audit(admin.id, "lookbook.delete", id, { title: gone.title });
  return NextResponse.json({ id });
}
