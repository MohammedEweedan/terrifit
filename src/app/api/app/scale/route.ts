import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getRequestUser } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { scaleIntegration, scaleProvider } from "@/lib/devices/scale";

export const runtime = "nodejs";
const headers = { "Cache-Control": "private, no-store" };

export async function GET(request: Request) {
  const user = await getRequestUser(request);
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  const scale = await prisma.scaleDevice.findFirst({ where: { userId: user.id, disconnectedAt: null }, orderBy: { pairedAt: "desc" } });
  return NextResponse.json({
    integration: scaleIntegration(),
    scale: scale ? { id: scale.id, model: scale.model, colourway: scale.colourway, firmware: scale.firmware, batteryPercent: scale.batteryPercent, pairedAt: scale.pairedAt, lastSyncAt: scale.lastSyncAt, capabilities: JSON.parse(scale.capabilities) } : null,
  }, { headers });
}

const pairSchema = z.object({ provider: z.string().max(80), proof: z.string().min(1).max(4096), colourway: z.enum(["black", "white"]) });
export async function POST(request: Request) {
  const user = await getRequestUser(request);
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  if (!(await rateLimit(`scale-pair:${user.id}`, 10, 60 * 60_000))) return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  const parsed = pairSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "validation" }, { status: 422 });
  const provider = scaleProvider(parsed.data.provider);
  if (!provider) return NextResponse.json({ error: "integration_upcoming", message: "Scale pairing is not available yet." }, { status: 503 });
  // A serial typed by a customer is not proof of physical device ownership.
  const verified = await provider.verifyPairing(parsed.data.proof, user.id).catch(() => null);
  if (!verified) return NextResponse.json({ error: "verification_failed" }, { status: 422 });
  const key = { provider: provider.id, externalId: verified.externalId };
  const owned = await prisma.scaleDevice.findUnique({ where: { provider_externalId: key } });
  if (owned && owned.userId !== user.id) return NextResponse.json({ error: "already_paired" }, { status: 409 });
  const data = { model: verified.model, firmware: verified.firmware, capabilities: JSON.stringify(verified.capabilities), colourway: parsed.data.colourway, disconnectedAt: null };
  // Conditional update prevents an ownership transfer in a concurrent pairing request.
  if (owned) {
    await prisma.scaleDevice.updateMany({ where: { id: owned.id, userId: user.id }, data });
    return NextResponse.json({ ok: true }, { headers });
  }
  try { await prisma.scaleDevice.create({ data: { ...key, ...data, userId: user.id } }); }
  catch (error) {
    if ((error as { code?: string }).code === "P2002") return NextResponse.json({ error: "already_paired" }, { status: 409 });
    throw error;
  }
  return NextResponse.json({ ok: true }, { status: 201, headers });
}

export async function DELETE(request: Request) {
  const user = await getRequestUser(request);
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  await prisma.scaleDevice.updateMany({ where: { userId: user.id, disconnectedAt: null }, data: { disconnectedAt: new Date() } });
  return NextResponse.json({ ok: true }, { headers });
}
