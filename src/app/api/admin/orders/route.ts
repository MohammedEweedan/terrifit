import { NextResponse } from "next/server";
import { FORBIDDEN, requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { findCarrier, trackingUrl } from "@/lib/shop/carriers";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json(FORBIDDEN, { status: 403 });

  const url = new URL(request.url);
  const status = url.searchParams.get("status");
  const query = url.searchParams.get("q")?.trim() ?? "";

  const orders = await prisma.order.findMany({
    where: {
      ...(status && status !== "all" ? { paymentStatus: status } : {}),
      ...(query ? { OR: [{ number: { contains: query.toUpperCase() } }, { email: { contains: query } }] } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { items: true },
  });

  return NextResponse.json(
    {
      orders: orders.map((order) => ({
        id: order.id,
        number: order.number,
        email: order.email,
        name: order.name,
        totalCents: order.totalCents,
        currency: order.currency,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        fulfillmentStatus: order.fulfillmentStatus,
        sandbox: order.sandbox,
        createdAt: order.createdAt.toISOString(),
        items: order.items.map((item) => ({
          title: item.title,
          variantLabel: item.variant,
          quantity: item.quantity,
          unitPriceCents: item.unitCents,
        })),
        address: order.line1
          ? [order.line1, order.line2, order.city, order.postcode, order.country].filter(Boolean).join(", ")
          : null,
      })),
    },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}

const patchSchema = z.object({
  number: z.string().trim().min(1).max(40),
  fulfillmentStatus: z.enum(["pending", "packed", "shipped", "delivered", "cancelled"]).optional(),
  carrier: z.string().trim().max(40).nullish(),
  trackingNumber: z.string().trim().max(60).nullish(),
});

/**
 * Marking an order packed, shipped or delivered, and attaching a tracking
 * number.
 *
 * The timestamps are set here rather than left to the operator, so the
 * customer's tracking page is a real timeline instead of a status word with no
 * history. Each is written once — moving an order back and forward does not
 * rewrite when it actually shipped.
 */
export async function PATCH(request: Request) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json(FORBIDDEN, { status: 403 });

  const parsed = patchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "validation", fields: parsed.error.issues.map((issue) => issue.path.join(".")) },
      { status: 422 },
    );
  }

  const { number, fulfillmentStatus, carrier, trackingNumber } = parsed.data;

  // An unknown carrier key would produce a tracking link that goes nowhere.
  if (carrier && !findCarrier(carrier)) {
    return NextResponse.json({ error: "validation", fields: ["carrier"] }, { status: 422 });
  }

  const existing = await prisma.order.findUnique({
    where: { number },
    select: { id: true, packedAt: true, shippedAt: true, deliveredAt: true, fulfillmentStatus: true },
  });
  if (!existing) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const now = new Date();
  const stamps: Record<string, Date> = {};
  if (fulfillmentStatus === "packed" && !existing.packedAt) stamps.packedAt = now;
  if (fulfillmentStatus === "shipped" && !existing.shippedAt) stamps.shippedAt = now;
  if (fulfillmentStatus === "delivered" && !existing.deliveredAt) stamps.deliveredAt = now;

  const updated = await prisma.order.update({
    where: { id: existing.id },
    data: {
      ...(fulfillmentStatus ? { fulfillmentStatus } : {}),
      ...(carrier !== undefined ? { carrier: carrier || null } : {}),
      ...(trackingNumber !== undefined ? { trackingNumber: trackingNumber || null } : {}),
      ...stamps,
    },
    select: { number: true, fulfillmentStatus: true, carrier: true, trackingNumber: true },
  });

  await prisma.auditLog.create({
    data: {
      actorId: admin.id,
      action: "order.update",
      target: number,
      detail: JSON.stringify({ fulfillmentStatus, carrier, trackingNumber, was: existing.fulfillmentStatus }),
    },
  });

  return NextResponse.json({
    ...updated,
    trackingUrl: trackingUrl(updated.carrier, updated.trackingNumber),
  });
}
