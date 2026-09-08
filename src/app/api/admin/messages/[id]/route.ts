import { NextResponse } from "next/server";
import { z } from "zod";
import { audit, FORBIDDEN, requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

const schema = z.object({ handled: z.boolean() });

/** Marks a message handled, or puts it back in the queue. */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json(FORBIDDEN, { status: 403 });

  const { id } = await params;
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "validation" }, { status: 422 });

  const before = await prisma.contactMessage.findUnique({ where: { id }, select: { handled: true } });
  if (!before) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (before.handled === parsed.data.handled) {
    return NextResponse.json({ error: "nothing_to_change" }, { status: 422 });
  }

  const message = await prisma.contactMessage.update({
    where: { id },
    data: { handled: parsed.data.handled },
  });
  // Every state change by a human is recorded, like the other console actions.
  await audit(admin.id, "message.handled", id, { handled: parsed.data.handled });

  return NextResponse.json({ id: message.id, handled: message.handled });
}
