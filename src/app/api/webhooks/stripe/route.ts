import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendReceipt } from "@/lib/shop/orders";

export const runtime = "nodejs";

/**
 * Stripe's webhook. The only thing in this codebase that may mark an order paid.
 *
 * A device or a browser saying "the payment worked" is a claim, not evidence —
 * anyone can post that. This endpoint is the evidence: Stripe signs each event
 * with a shared secret, and the signature is checked before a single field is
 * read. An unsigned or stale event is rejected outright.
 */
export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!secret) return NextResponse.json({ error: "unconfigured" }, { status: 503 });

  const signature = request.headers.get("stripe-signature") ?? "";
  // The raw body, not the parsed object: the signature covers the exact bytes.
  const payload = await request.text();

  if (!verify(payload, signature, secret)) {
    return NextResponse.json({ error: "bad_signature" }, { status: 400 });
  }

  const event = JSON.parse(payload) as {
    type?: string;
    data?: {
      object?: {
        id?: string;
        status?: string;
        customer?: string;
        subscription?: string;
        current_period_end?: number;
        metadata?: { order_number?: string; user_id?: string };
        client_reference_id?: string;
        items?: { data?: Array<{ price?: { recurring?: { interval?: string } } }> };
      };
    };
  };

  const object = event.data?.object;
  if (!object) return NextResponse.json({ received: true });

  // Subscriptions and one-off orders are different animals and are handled
  // separately; the signature check above covers both.
  if ((event.type ?? "").startsWith("customer.subscription.")) {
    await applySubscription(event.type ?? "", object);
    return NextResponse.json({ received: true });
  }
  if (event.type === "invoice.paid" && object.subscription) {
    await markPro(object.subscription, null);
    return NextResponse.json({ received: true });
  }

  // Native payments carry the order in metadata; hosted Checkout sessions use
  // `client_reference_id`. Both are set by us, on the way out.
  const number = object.metadata?.order_number ?? object.client_reference_id;
  if (!number) return NextResponse.json({ received: true });

  const status = statusFor(event.type ?? "");
  if (!status) return NextResponse.json({ received: true });

  const order = await prisma.order.findUnique({ where: { number }, select: { id: true, paymentStatus: true } });
  if (!order) return NextResponse.json({ received: true });

  // Events can arrive out of order and be redelivered. A refund never reverts
  // to paid, and a paid order is not knocked back to failed by a late retry.
  if (order.paymentStatus === "refunded") return NextResponse.json({ received: true });
  if (order.paymentStatus === "paid" && status !== "refunded") return NextResponse.json({ received: true });

  await prisma.order.update({
    where: { id: order.id },
    data: { paymentStatus: status, paymentRef: object?.id ?? undefined },
  });

  // The receipt goes out when the money actually arrives, not when a device
  // says the sheet closed. Failures here never fail the webhook — Stripe would
  // retry the whole event and we would double-charge nothing but the inbox.
  if (status === "paid" && order.paymentStatus !== "paid") {
    await sendReceipt(order.id);
  }

  return NextResponse.json({ received: true });
}

/**
 * A subscription's life, reflected onto the account.
 *
 * Stripe's status is the truth. `active` and `trialing` are Pro; everything
 * else — past due, unpaid, incomplete, cancelled — is not. Nothing here trusts
 * a plan value that was already on the row.
 */
async function applySubscription(
  type: string,
  object: {
    id?: string;
    status?: string;
    current_period_end?: number;
    items?: { data?: Array<{ price?: { recurring?: { interval?: string } } }> };
  },
): Promise<void> {
  const subscriptionId = object.id;
  if (!subscriptionId) return;

  const live = object.status === "active" || object.status === "trialing";
  if (type === "customer.subscription.deleted" || !live) {
    await prisma.user.updateMany({
      where: { stripeSubscriptionId: subscriptionId },
      data: { plan: "free", planRenewsAt: null },
    });
    return;
  }

  const interval = object.items?.data?.[0]?.price?.recurring?.interval === "year" ? "yearly" : "monthly";
  const renews = object.current_period_end ? new Date(object.current_period_end * 1000) : null;
  await markPro(subscriptionId, renews, interval);
}

/** Grants Pro against a Stripe subscription id. The only path that does. */
async function markPro(
  subscriptionId: string,
  renewsAt: Date | null,
  interval?: "monthly" | "yearly",
): Promise<void> {
  await prisma.user.updateMany({
    where: { stripeSubscriptionId: subscriptionId },
    data: {
      plan: "pro",
      // A paid subscription supersedes any trial that was still running.
      trialEndsAt: null,
      ...(renewsAt ? { planRenewsAt: renewsAt } : {}),
      ...(interval ? { planInterval: interval } : {}),
    },
  });
}

function statusFor(type: string): "paid" | "failed" | "refunded" | null {
  switch (type) {
    case "payment_intent.succeeded":
    case "checkout.session.completed":
      return "paid";
    case "payment_intent.payment_failed":
      return "failed";
    case "charge.refunded":
      return "refunded";
    default:
      return null;
  }
}

/**
 * Stripe's `t=…,v1=…` scheme: HMAC-SHA256 over `timestamp.body`.
 *
 * Compared with `timingSafeEqual` so the check leaks nothing through timing,
 * and the timestamp is bounded so a captured event cannot be replayed later.
 */
function verify(payload: string, header: string, secret: string): boolean {
  const parts = Object.fromEntries(
    header.split(",").map((piece) => {
      const [key, ...rest] = piece.split("=");
      return [key.trim(), rest.join("=")];
    }),
  );

  const timestamp = Number(parts.t);
  const provided = parts.v1;
  if (!Number.isFinite(timestamp) || !provided) return false;

  const age = Math.abs(Date.now() / 1000 - timestamp);
  if (age > 300) return false;

  const expected = createHmac("sha256", secret).update(`${timestamp}.${payload}`).digest("hex");
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(provided, "utf8");
  return a.length === b.length && timingSafeEqual(a, b);
}
