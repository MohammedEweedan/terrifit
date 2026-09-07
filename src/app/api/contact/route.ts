import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { contactSchema } from "@/lib/validation";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { verifyTurnstile } from "@/lib/turnstile";

export const runtime = "nodejs";

export async function POST(request: Request) {
  // A contact form is the most-abused endpoint on any marketing site. Three a
  // minute is far more than a person needs and far less than a script wants.
  if (!(await rateLimit(`contact:${clientKey(request)}`, 3, 60_000))) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const challenge = await verifyTurnstile(
    (body as { turnstileToken?: unknown } | null)?.turnstileToken,
    request.headers.get("x-forwarded-for"),
    "contact",
  );
  if (!challenge.ok) {
    return NextResponse.json({ error: "challenge", reason: challenge.reason }, { status: 403 });
  }

  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "validation", fields: parsed.error.issues.map((issue) => issue.path.join(".")) },
      { status: 422 },
    );
  }

  const input = parsed.data;

  try {
    // If they are already on the waitlist, attach the id so whoever replies has
    // their role, market and position without a second lookup.
    const waitlisted = await prisma.waitlistEntry.findUnique({
      where: { email: input.email },
      select: { id: true },
    });

    await prisma.contactMessage.create({
      data: {
        topic: input.topic,
        name: input.name,
        email: input.email,
        message: input.message,
        locale: input.locale,
        waitlistId: waitlisted?.id ?? null,
      },
    });

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "server" }, { status: 500 });
  }
}
