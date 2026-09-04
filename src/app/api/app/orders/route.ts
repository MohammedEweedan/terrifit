import { NextResponse } from "next/server";
import { getRequestUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { findCarrier, trackingUrl } from "@/lib/shop/carriers";

export const runtime = "nodejs";

/** Anything past this is history, not something to watch. */
const ACTIVE = ["pending", "packed", "shipped"];

/**
 * The member's orders, newest first.
 *
 * Matched on email rather than a user id because orders can be placed before
 * an account exists and the two are reconciled by address — the same rule the
 * receipt uses.
 */
export async function GET(request: Request) {
  const user = await getRequestUser(request);
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const orders = await prisma.order.findMany({
    where: { email: user.email },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: {
      number: true, createdAt: true,
      paymentStatus: true, fulfillmentStatus: true, sandbox: true,
      currency: true, totalCents: true,
      carrier: true, trackingNumber: true,
      packedAt: true, shippedAt: true, deliveredAt: true,
      line1: true, line2: true, city: true, postcode: true, country: true,
      items: { select: { title: true, variant: true, quantity: true, unitCents: true, slug: true } },
    },
  });

  const shaped = orders.map((order) => ({
    number: order.number,
    placedAt: order.createdAt.toISOString(),
    paymentStatus: order.paymentStatus,
    fulfillmentStatus: order.fulfillmentStatus,
    sandbox: order.sandbox,
    currency: order.currency,
    totalCents: order.totalCents,
    carrier: findCarrier(order.carrier)?.name ?? null,
    trackingNumber: order.trackingNumber,
    // Built here so the app never has to know a carrier's URL shape.
    trackingUrl: trackingUrl(order.carrier, order.trackingNumber),
    packedAt: order.packedAt?.toISOString() ?? null,
    shippedAt: order.shippedAt?.toISOString() ?? null,
    deliveredAt: order.deliveredAt?.toISOString() ?? null,
    shipsTo: order.line1
      ? [order.line1, order.line2, order.city, order.postcode, order.country].filter(Boolean).join(", ")
      : null,
    items: order.items,
  }));

  return NextResponse.json(
    {
      orders: shaped,
      // What the header badge watches: how many are still in flight.
      active: shaped.filter((order) => ACTIVE.includes(order.fulfillmentStatus) && order.paymentStatus !== "failed").length,
    },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
