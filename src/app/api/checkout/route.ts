import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { checkoutSchema } from "@/lib/validation";
import { orderDescription, priceCart, writeOrder } from "@/lib/shop/orders";
import { findCountry, validPostal } from "@/lib/shop/countries";
import { availableMethods, createPayment, methodConfigured } from "@/lib/shop/payments";
import { inventoryProblems, listProducts } from "@/lib/shop/catalog-store";

export const runtime = "nodejs";

/**
 * The public origin the payment gateway will redirect the customer back to.
 * It must be absolute and reachable from the internet, so it comes from the
 * environment first; the request's own Origin is only a fallback for previews.
 */
function publicOrigin(request: Request): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) return configured.replace(/\/$/, "");
  const origin = request.headers.get("origin");
  if (origin && /^https?:\/\//.test(origin)) return origin.replace(/\/$/, "");
  return "http://localhost:3000";
}

export async function GET() {
  // The storefront asks which rails it may offer before rendering the picker,
  // and which of those have no credentials so it can label them honestly.
  const methods = availableMethods();
  return NextResponse.json({
    methods,
    sandbox: methods.filter((method) => !methodConfigured(method)),
    // Publishable keys are designed to be public — this is how Stripe's own
    // docs ship them. Serving it rather than baking it into the app binary
    // means rotating the key is a deploy, not an App Store release.
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY?.trim() || null,
    // Required by Apple for the Pay sheet; set up in the Stripe dashboard.
    merchantIdentifier: process.env.APPLE_MERCHANT_ID?.trim() || null,
  });
}

export async function POST(request: Request) {
  if (!(await rateLimit(`checkout:${clientKey(request)}`, 8, 60_000))) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = checkoutSchema.safeParse(body);
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
  const catalogue = await listProducts();
  const { lines, hasPhysical } = priceCart(input.items, catalogue);
  if (lines.length === 0) {
    return NextResponse.json({ error: "empty_cart" }, { status: 422 });
  }

  // Anything that has to be posted needs somewhere to post it to. A cart of
  // only memberships legitimately has no address, so this is conditional.
  if (hasPhysical) {
    const missing = (["line1", "city", "postcode", "country"] as const).filter(
      (field) => !input[field],
    );
    if (missing.length > 0) {
      return NextResponse.json({ error: "validation", fields: missing }, { status: 422 });
    }
    // The client checks these too, but the client is not the authority: a
    // postcode that does not match its country produces an undeliverable
    // parcel, and the carrier bills us either way.
    if (!findCountry(input.country ?? "")) {
      return NextResponse.json({ error: "validation", fields: ["country"] }, { status: 422 });
    }
    if (!validPostal(input.country ?? "", input.postcode ?? "")) {
      return NextResponse.json({ error: "validation", fields: ["postcode"] }, { status: 422 });
    }
  }

  if (!availableMethods().includes(input.paymentMethod)) {
    return NextResponse.json({ error: "method_unavailable" }, { status: 422 });
  }

  try {
    const written = await writeOrder(input);
    if (!written) return NextResponse.json({ error: "empty_cart" }, { status: 422 });

    const origin = publicOrigin(request);
    const payment = await createPayment({
      method: input.paymentMethod,
      orderNumber: written.number,
      amountCents: written.chargeAmount,
      currency: written.currency.code,
      email: input.email,
      description: orderDescription(written.lines),
      // Itemised so Stripe's own page lists the order rather than one opaque
      // line carrying the whole total.
      lines: written.lines.map((line) => ({
        title: line.title,
        variant: line.variant,
        unitCents: line.unitCents,
        quantity: line.quantity,
      })),
      shippingCents: written.totals.shippingCents,
      taxCents: written.totals.taxCents,
      successUrl: `${origin}/${input.locale}/shop/order/${written.number}`,
      cancelUrl: `${origin}/${input.locale}/shop/checkout?cancelled=${written.number}`,
    });

    await prisma.order.update({
      where: { id: written.id },
      data: {
        paymentStatus: payment.status === "failed" ? "failed" : payment.status,
        paymentRef: payment.reference,
        sandbox: payment.sandbox,
      },
    });

    if (payment.status === "failed") {
      return NextResponse.json({ error: "payment", number: written.number }, { status: 502 });
    }

    return NextResponse.json(
      {
        number: written.number,
        redirectUrl: payment.redirectUrl ?? null,
        sandbox: payment.sandbox,
        totals: written.totals,
        currency: written.currency.code,
        chargeAmount: written.chargeAmount,
      },
      { status: 201 },
    );
  } catch {
    return NextResponse.json({ error: "server" }, { status: 500 });
  }
}
