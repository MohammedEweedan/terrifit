import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { connectionSchema } from "@/lib/validation";

export const runtime = "nodejs";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const connections = await prisma.healthConnection.findMany({
    where: { userId: user.id },
    orderBy: { provider: "asc" },
  });
  return NextResponse.json({ connections });
}

/**
 * Records the member's intent to connect an app.
 *
 * The OAuth handshake with each provider needs that provider's credentials, so
 * until those are configured a connection is stored as `pending` and the UI says
 * so. What matters is that the record — and the revocation — are real: turning a
 * connection off has to work the moment somebody wants it off.
 */
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = connectionSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "validation" }, { status: 422 });

  const { provider, action } = parsed.data;

  if (action === "disconnect") {
    const connection = await prisma.healthConnection.upsert({
      where: { userId_provider: { userId: user.id, provider } },
      update: { status: "revoked", revokedAt: new Date() },
      create: { userId: user.id, provider, status: "revoked", revokedAt: new Date() },
    });
    return NextResponse.json({ connection });
  }

  const connection = await prisma.healthConnection.upsert({
    where: { userId_provider: { userId: user.id, provider } },
    update: { status: "pending", revokedAt: null },
    create: { userId: user.id, provider, status: "pending" },
  });
  return NextResponse.json({ connection });
}
