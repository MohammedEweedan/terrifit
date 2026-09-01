import { NextResponse } from "next/server";
import { z } from "zod";
import { audit, FORBIDDEN, requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

const schema = z.object({
  paymentStatus: z.enum(["pending", "paid", "failed", "refunded"]).optional(),
  fulfillmentStatus: z.enum(["pending", "fulfilled", "cancelled"]).optional(),
  note: z.string().trim().max(500).optional(),
});

/**
 * Moves an order along.
 *
 * This does not talk to the payment gateway — marking an order refunded here
 * records a refund that a human performed in Stripe or PayPal, it does not
 * perform one. Wiring the actual refund call is a separate job, and pretending
 * otherwise would be the kind of thing that loses money quietly.
 */
export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json(FORBIDDEN, { status: 403 });

  const { id } = await context.params;
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "validation" }, { status: 422 });

  const before = await prisma.order.findUnique({
    where: { id },
    select: { number: true, paymentStatus: true, fulfillmentStatus: true },
  });
  if (!before) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const { note, ...changes } = parsed.data;
  if (Object.keys(changes).length === 0) {
    return NextResponse.json({ error: "nothing_to_change" }, { status: 422 });
  }

  const order = await prisma.order.update({ where: { id }, data: changes });

  await audit(admin.id, "order.update", order.number, { before, after: changes, note: note ?? null });

  return NextResponse.json({
    id: order.id,
    number: order.number,
    paymentStatus: order.paymentStatus,
    fulfillmentStatus: order.fulfillmentStatus,
  });
}
