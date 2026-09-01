import { NextResponse } from "next/server";
import { z } from "zod";
import { getRequestUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

const schema = z.object({
  token: z.string().trim().min(10).max(200),
  platform: z.enum(["ios", "android"]).default("ios"),
});

/** Registers this install's push token. Called on every launch; upserts. */
export async function POST(request: Request) {
  const user = await getRequestUser(request);
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "validation" }, { status: 422 });

  await prisma.pushDevice.upsert({
    where: { token: parsed.data.token },
    // A token can move between accounts when a phone changes hands.
    update: { userId: user.id, platform: parsed.data.platform, lastSeenAt: new Date() },
    create: { userId: user.id, token: parsed.data.token, platform: parsed.data.platform },
  });

  return NextResponse.json({ ok: true });
}

/** Called on sign-out so a shared device stops receiving someone else's alerts. */
export async function DELETE(request: Request) {
  const user = await getRequestUser(request);
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const parsed = schema.partial().safeParse(await request.json().catch(() => ({})));
  const token = parsed.success ? parsed.data.token : undefined;

  await prisma.pushDevice.deleteMany({
    where: token ? { token, userId: user.id } : { userId: user.id },
  });
  return NextResponse.json({ ok: true });
}
