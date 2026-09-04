import { NextResponse } from "next/server";
import { getRequestUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { checkoutSchema } from "@/lib/validation";
import { addressProblems, orderDescription, writeOrder } from "@/lib/shop/orders";
import { createPaymentSheet } from "@/lib/shop/payments";
import { inventoryProblems } from "@/lib/shop/catalog-store";

export const runtime = "nodejs";

/**
 * Checkout for the app, paid in-process.
 *
 * The browser rail sends people to a hosted Stripe page and waits for them to
 * come back. On a phone that is a bad trade: it drops out of the app, loses the
 * Apple Pay sheet, and leaves the customer on a Safari page that looks nothing
 * like what they were just using. This returns everything Stripe's native
 * PaymentSheet needs instead, so the whole payment happens on top of the app.
 *
 * The order is written here, before the sheet is presented, so a charge always
 * has a record to reconcile against. Payment is confirmed by webhook, never by
 * the device saying so — see `PATCH` below.
 */
export async function POST(request: Request) {
  const user = await getRequestUser(request);
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  if (!(await rateLimit(`appcheckout:${user.id}:${clientKey(request)}`, 8, 60_000))) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const parsed = checkoutSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "validation", fields: parsed.error.issues.map((issue) => issue.path.join(".")) },
      { status: 422 },
    );
  }

  const input = parsed.data;
  const unavailable = await inventoryProblems(input.items);
  if (unavailable.length > 0) {
    return NextResponse.json({ error: "out_of_stock", items: unavailable }, { status: 409 });
  }
  const written = await writeOrder(input);
  if (!written) return NextResponse.json({ error: "empty_cart" }, { status: 422 });

  const problems = addressProblems(input, written.hasPhysical);
  if (problems.length > 0) {
    // The row is already written, so it is marked rather than left looking like
    // a real order somebody abandoned.
    await prisma.order.update({
      where: { id: written.id },
      data: { paymentStatus: "failed", fulfillmentStatus: "cancelled" },
    });
    return NextResponse.json({ error: "validation", fields: problems }, { status: 422 });
  }

  const sheet = await createPaymentSheet({
    orderNumber: written.number,
    // The amount is in the charged currency's own minor units — 2 decimals for
    // most, none for yen — which is exactly what Stripe expects.
    amountCents: written.chargeAmount,
    currency: written.currency.code,
    email: input.email,
    name: input.name,
    description: orderDescription(written.lines),
  });

  if ("error" in sheet) {
    // No keys yet: the order stands as pending and unpaid, and the app says so
    // rather than pretending a sheet is about to appear.
    if (sheet.error === "stripe_unconfigured") {
      return NextResponse.json(
        {
          number: written.number,
          totals: written.totals,
          currency: written.currency.code,
          chargeAmount: written.chargeAmount,
          sandbox: true,
          sheet: null,
        },
        { status: 201 },
      );
    }
    await prisma.order.update({ where: { id: written.id }, data: { paymentStatus: "failed" } });
    return NextResponse.json({ error: "payment", number: written.number }, { status: 502 });
  }

  await prisma.order.update({
    where: { id: written.id },
    // The client secret's prefix is the PaymentIntent id, which is what the
    // webhook will quote back. The secret itself is never stored.
    data: { paymentRef: sheet.clientSecret.split("_secret_")[0] ?? null },
  });

  return NextResponse.json(
    {
      number: written.number,
      totals: written.totals,
      currency: written.currency.code,
      chargeAmount: written.chargeAmount,
      sandbox: false,
      sheet: {
        clientSecret: sheet.clientSecret,
        ephemeralKey: sheet.ephemeralKey,
        customerId: sheet.customerId,
        publishableKey: sheet.publishableKey,
      },
    },
    { status: 201 },
  );
}

/**
 * What the app reports after the sheet closes.
 *
 * Deliberately *not* how an order becomes paid — the device is not a trusted
 * source of truth about money, and anyone can call this. It only records that
 * the customer got as far as completing the sheet, so support can tell an
 * abandoned checkout from one waiting on a webhook. The webhook sets `paid`.
 */
export async function PATCH(request: Request) {
  const user = await getRequestUser(request);
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const body = (await request.json().catch(() => null)) as { number?: string; outcome?: string } | null;
  const number = body?.number?.trim();
  if (!number) return NextResponse.json({ error: "validation" }, { status: 422 });

  const order = await prisma.order.findUnique({ where: { number }, select: { id: true, email: true, paymentStatus: true } });
  if (!order || order.email !== user.email) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  // A webhook that already landed outranks anything the device has to say.
  if (order.paymentStatus === "paid" || order.paymentStatus === "refunded") {
    return NextResponse.json({ status: order.paymentStatus });
  }

  const status = body?.outcome === "cancelled" ? "cancelled" : "authorising";
  await prisma.order.update({ where: { id: order.id }, data: { paymentStatus: status } });
  return NextResponse.json({ status });
}
