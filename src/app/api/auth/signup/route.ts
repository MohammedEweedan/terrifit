import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { signupSchema } from "@/lib/validation";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { createSession, hashPassword, setSessionCookie } from "@/lib/auth";

export const runtime = "nodejs";

/** A native client asks for a token explicitly; browsers never do. */
function isNativeClient(body: unknown): boolean {
  return (body as { client?: string } | null)?.client === "native";
}

export async function POST(request: Request) {
  if (!rateLimit(`signup:${clientKey(request)}`, 5, 60_000)) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = signupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "validation", fields: parsed.error.issues.map((issue) => issue.path.join(".")) },
      { status: 422 },
    );
  }

  const input = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email: input.email }, select: { id: true } });
  if (existing) {
    // Deliberately explicit. Hiding this would only push someone into the
    // password-reset flow to discover the same thing, and this endpoint is
    // rate-limited against enumeration.
    return NextResponse.json({ error: "email_taken" }, { status: 409 });
  }

  try {
    const user = await prisma.user.create({
      data: {
        email: input.email,
        name: input.name,
        role: input.role,
        locale: input.locale,
        passwordHash: await hashPassword(input.password),
        // An empty profile is created up front so the account page never has to
        // deal with the row not existing.
        profile: { create: {} },
      },
      select: { id: true, email: true, name: true, role: true },
    });

    const session = await createSession(user.id, {
      userAgent: request.headers.get("user-agent"),
      ip: clientKey(request),
    });
    await setSessionCookie(session.token, session.expiresAt);

    return NextResponse.json(
      {
        user,
        // See the note in the login route: native only.
        ...(isNativeClient(body) ? { token: session.token, expiresAt: session.expiresAt } : {}),
      },
      { status: 201 },
    );
  } catch {
    return NextResponse.json({ error: "server" }, { status: 500 });
  }
}
