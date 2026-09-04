import { NextResponse } from "next/server";
import { z } from "zod";
import { getRequestUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { planState, PRICING, TRIAL_DAYS } from "@/lib/health/plan";
import {
  cancelSubscription, createSubscription, sandboxAllowed, subscriptionsConfigured,
} from "@/lib/shop/payments";

export const runtime = "nodejs";

const select = {
  plan: true, trialEndsAt: true, trialStartedAt: true, planInterval: true,
  stripeCustomerId: true, stripeSubscriptionId: true,
} as const;

export async function GET(request: Request) {
  const current = await getRequestUser(request);
  if (!current) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { id: current.id }, select });
  if (!user) return NextResponse.json({ error: "not_found" }, { status: 404 });

  return NextResponse.json(
    {
      ...planState(user),
      // Offered once ever, so somebody cannot cycle trials forever.
      trialAvailable: user.trialStartedAt === null,
      trialDays: TRIAL_DAYS,
      pricing: PRICING,
    },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}

const schema = z.object({
  action: z.enum(["start-trial", "subscribe", "cancel"]),
  interval: z.enum(["monthly", "yearly"]).optional(),
});

/**
 * Starting a trial, paying, or stopping.
 *
 * `subscribe` creates a real Stripe subscription in the incomplete state and
 * hands the app what it needs to confirm the first payment in the native sheet.
 * **It does not make anybody Pro.** That happens in the webhook, when Stripe
 * says the invoice was paid — a request is a claim, and a claim is not money.
 *
 * With no Stripe keys, development still needs to be able to see the paid
 * tier, so the plan is granted and flagged as a sandbox grant. Setting
 * `ALLOW_SANDBOX_CHECKOUT=false` in production turns that off, and the endpoint
 * then refuses rather than giving the product away.
 */
export async function POST(request: Request) {
  const current = await getRequestUser(request);
  if (!current) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "validation" }, { status: 422 });

  const user = await prisma.user.findUnique({ where: { id: current.id }, select });
  if (!user) return NextResponse.json({ error: "not_found" }, { status: 404 });

  if (parsed.data.action === "start-trial") {
    if (user.trialStartedAt) {
      return NextResponse.json({ error: "trial_used" }, { status: 409 });
    }
    const ends = new Date(Date.now() + TRIAL_DAYS * 86_400_000);
    const updated = await prisma.user.update({
      where: { id: current.id },
      data: { plan: "trial", trialStartedAt: new Date(), trialEndsAt: ends },
      select,
    });
    return NextResponse.json({ ...planState(updated), started: true }, { status: 201 });
  }

  if (parsed.data.action === "cancel") {
    // Cancel at Stripe first: a local flag saying "free" while Stripe keeps
    // billing is the worst possible failure of the two.
    if (user.stripeSubscriptionId) {
      const cancelled = await cancelSubscription(user.stripeSubscriptionId);
      if (!cancelled) return NextResponse.json({ error: "cancel_failed" }, { status: 502 });
      // Access runs to the end of the paid period; the webhook flips the plan
      // when the subscription actually ends.
      return NextResponse.json({ ...planState(user), cancelling: true });
    }

    const updated = await prisma.user.update({
      where: { id: current.id },
      data: { plan: "free", planInterval: null, planRenewsAt: null },
      select,
    });
    return NextResponse.json(planState(updated));
  }

  // subscribe
  const interval = parsed.data.interval ?? "monthly";

  if (!subscriptionsConfigured()) {
    if (!sandboxAllowed()) {
      return NextResponse.json({ error: "subscriptions_unavailable" }, { status: 503 });
    }
    // Development only, and labelled: no money moved.
    const renews = new Date(Date.now() + (interval === "yearly" ? 365 : 30) * 86_400_000);
    const updated = await prisma.user.update({
      where: { id: current.id },
      data: { plan: "pro", planInterval: interval, planRenewsAt: renews, trialEndsAt: null },
      select,
    });
    return NextResponse.json({
      ...planState(updated),
      sandbox: true,
    });
  }

  const setup = await createSubscription({
    interval,
    email: current.email,
    name: current.name,
    userId: current.id,
    existingCustomerId: user.stripeCustomerId,
  });

  if ("error" in setup) {
    return NextResponse.json({ error: "payment", detail: setup.error }, { status: 502 });
  }

  // The ids are stored now so the webhook can find this member, but the plan is
  // untouched — they are not Pro until the money lands.
  await prisma.user.update({
    where: { id: current.id },
    data: {
      stripeCustomerId: setup.customerId,
      stripeSubscriptionId: setup.subscriptionId,
      planInterval: interval,
    },
  });

  return NextResponse.json({
    ...planState(user),
    sandbox: false,
    sheet: {
      clientSecret: setup.clientSecret,
      ephemeralKey: setup.ephemeralKey,
      customerId: setup.customerId,
      publishableKey: setup.publishableKey,
    },
  }, { status: 201 });
}
