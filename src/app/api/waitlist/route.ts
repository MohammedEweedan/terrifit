import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { waitlistSchema } from "@/lib/validation";
import { generateReferralCode, displayPosition, REFERRAL_BOOST } from "@/lib/referral";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { isKnownMarket } from "@/lib/markets";
import { getWaitlistStats } from "@/lib/stats";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!(await rateLimit(`waitlist:${clientKey(request)}`, 5, 60_000))) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = waitlistSchema.safeParse(body);
  if (!parsed.success) {
    const fields = parsed.error.issues.map((issue) => issue.path.join("."));
    return NextResponse.json({ error: "validation", fields }, { status: 422 });
  }

  const input = parsed.data;
  if (!isKnownMarket(input.country)) {
    return NextResponse.json({ error: "validation", fields: ["country"] }, { status: 422 });
  }

  const referredByCode = input.referredByCode?.trim().toUpperCase() || null;

  try {
    const existing = await prisma.waitlistEntry.findUnique({
      where: { email: input.email },
      select: { referralCode: true, position: true, referrals: true, role: true },
    });

    // Re-submitting an email returns the original place rather than an error —
    // people forget they signed up, and a hard failure loses them.
    if (existing) {
      return NextResponse.json(
        {
          duplicate: true,
          referralCode: existing.referralCode,
          position: displayPosition(existing.position, existing.referrals),
          role: existing.role,
          referralBoost: REFERRAL_BOOST,
        },
        { status: 200 },
      );
    }

    const entry = await prisma.$transaction(async (tx) => {
      const referrer = referredByCode
        ? await tx.waitlistEntry.findUnique({
            where: { referralCode: referredByCode },
            select: { id: true },
          })
        : null;

      const position = (await tx.waitlistEntry.count()) + 1;

      const created = await tx.waitlistEntry.create({
        data: {
          email: input.email,
          name: input.name,
          role: input.role,
          country: input.country,
          locale: input.locale,
          features: JSON.stringify(input.features),
          handle: input.handle || null,
          audienceSize: input.audienceSize || null,
          credentials: input.credentials || null,
          brandName: input.brandName || null,
          brandWebsite: input.brandWebsite || null,
          brandCategory: input.brandCategory || null,
          referralCode: generateReferralCode(),
          // Only credit a code that resolves to a real entry.
          referredByCode: referrer ? referredByCode : null,
          position,
          source: input.source || null,
        },
      });

      if (referrer) {
        await tx.waitlistEntry.update({
          where: { id: referrer.id },
          data: { referrals: { increment: 1 } },
        });
      }

      return created;
    });

    return NextResponse.json(
      {
        duplicate: false,
        referralCode: entry.referralCode,
        position: displayPosition(entry.position, entry.referrals),
        role: entry.role,
        referralBoost: REFERRAL_BOOST,
      },
      { status: 201 },
    );
  } catch (error) {
    // The duplicate lookup used to sit outside this guard, so an unreachable
    // database threw straight through the handler: a bare 500 with an empty
    // body that the form could only report as a generic failure. The catch was
    // also bare, so the cause never reached the logs either. Both cost real
    // debugging time — keep the lookup inside, and keep the reason.
    console.error("waitlist POST failed", error);
    return NextResponse.json({ error: "server" }, { status: 500 });
  }
}

export async function GET() {
  const stats = await getWaitlistStats();
  return NextResponse.json(stats, {
    headers: { "Cache-Control": "public, max-age=60, s-maxage=60" },
  });
}
