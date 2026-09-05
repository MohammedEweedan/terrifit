import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { findCarrier, trackingUrl } from "@/lib/shop/carriers";
import { apiConfigured, trackingInfo } from "@/lib/shop/seventeentrack";

export const runtime = "nodejs";

const schema = z.object({
  number: z.string().trim().min(4).max(40),
  email: z.string().trim().email().max(200),
});

/**
 * Public order lookup, for somebody who has an order number and no account.
 *
 * An order-number endpoint is an enumeration target: numbers are short and
 * sequential enough to guess, and an order carries a name and an address. Three
 * things keep that shut.
 *
 *   1. **The email must match the order.** Knowing a number is not enough.
 *   2. **Rate limited per IP**, so the pair cannot be brute-forced.
 *   3. **One response for every failure.** A wrong number and a wrong email
 *      return the same body, so the endpoint never confirms that an order
 *      exists — which is what makes guessing worthwhile in the first place.
 *
 * What comes back is deliberately thin: status, dates, a tracking link. No
 * address, no line items, no total. Anyone who wants those can sign in.
 */
export async function POST(request: Request) {
  if (!(await rateLimit(`track:${clientKey(request)}`, 20, 60_000))) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "validation" }, { status: 422 });
  }

  const { number, email } = parsed.data;

  const order = await prisma.order
    .findFirst({
      where: {
        number: { equals: number, mode: "insensitive" },
        email: { equals: email, mode: "insensitive" },
      },
      select: {
        number: true,
        createdAt: true,
        paymentStatus: true,
        fulfillmentStatus: true,
        carrier: true,
        trackingNumber: true,
        packedAt: true,
        shippedAt: true,
        deliveredAt: true,
      },
    })
    .catch(() => null);

  // The same answer whether the number is wrong, the email is wrong, or the
  // pair simply does not exist together.
  if (!order) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const url = trackingUrl(order.carrier, order.trackingNumber);
  const carrier = findCarrier(order.carrier);

  // Live carrier events, when a key is configured. Never load-bearing — the
  // timeline below is built from our own fulfilment dates either way.
  const live =
    apiConfigured() && order.trackingNumber ? await trackingInfo(order.trackingNumber) : null;

  return NextResponse.json(
    {
      number: order.number,
      placedAt: order.createdAt.toISOString(),
      paymentStatus: order.paymentStatus,
      fulfillmentStatus: order.fulfillmentStatus,
      carrier: carrier?.name ?? live?.carrier ?? null,
      trackingNumber: order.trackingNumber,
      trackingUrl: url,
      packedAt: order.packedAt?.toISOString() ?? null,
      shippedAt: order.shippedAt?.toISOString() ?? null,
      deliveredAt: order.deliveredAt?.toISOString() ?? null,
      events: live?.events ?? [],
      estimatedDelivery: live?.estimatedDelivery ?? null,
    },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
