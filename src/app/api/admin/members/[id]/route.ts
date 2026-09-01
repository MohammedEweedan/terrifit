import { NextResponse } from "next/server";
import { z } from "zod";
import { audit, FORBIDDEN, requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

const schema = z.object({
  plan: z.enum(["free", "pro"]).optional(),
  isAdmin: z.boolean().optional(),
  role: z.enum(["athlete", "creator", "coach", "partner"]).optional(),
});

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json(FORBIDDEN, { status: 403 });

  const { id } = await context.params;
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "validation" }, { status: 422 });

  const target = await prisma.user.findUnique({
    where: { id },
    select: { id: true, email: true, plan: true, isAdmin: true, role: true },
  });
  if (!target) return NextResponse.json({ error: "not_found" }, { status: 404 });

  // Removing your own staff access locks you out of the console with no way
  // back in through the product. Another admin can do it; you cannot.
  if (target.id === admin.id && parsed.data.isAdmin === false) {
    return NextResponse.json({ error: "cannot_demote_self" }, { status: 409 });
  }

  const user = await prisma.user.update({ where: { id }, data: parsed.data });

  await audit(admin.id, parsed.data.isAdmin === undefined ? "user.update" : "user.admin", target.email, {
    before: { plan: target.plan, isAdmin: target.isAdmin, role: target.role },
    after: parsed.data,
  });

  return NextResponse.json({ id: user.id, plan: user.plan, isAdmin: user.isAdmin, role: user.role });
}
