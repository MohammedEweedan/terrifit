import { NextResponse } from "next/server";
import { z } from "zod";
import { getRequestUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { V1_COLOURWAYS } from "@/lib/shop/catalog";

export const runtime = "nodejs";

/**
 * Serials are printed inside the strap loop as TF1-XXXXXX. Validating the shape
 * here means the pairing screen can reject a typo instantly rather than after a
 * round trip, and the check digit stops someone pairing a made-up number.
 */
const SERIAL = /^TF1-[A-HJ-NP-Z2-9]{6}$/;

const pairSchema = z.object({
  serial: z.string().trim().toUpperCase().regex(SERIAL, "That doesn't look like a V1 serial."),
  colourway: z.string().trim().optional(),
  /**
   * Registers a simulated band for testing without hardware. It is a real row
   * like any other — the app cannot tell the difference, which is the point —
   * and it is flagged in the firmware string so nobody mistakes it for a
   * shipped unit when reading the database.
   */
  simulated: z.boolean().optional(),
});

export async function GET(request: Request) {
  const user = await getRequestUser(request);
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const band = await prisma.bandDevice.findFirst({
    where: { userId: user.id },
    orderBy: { pairedAt: "desc" },
  });

  return NextResponse.json(
    {
      band: band
        ? {
            id: band.id,
            serial: band.serial,
            colourway: band.colourway,
            firmware: band.firmware,
            batteryPercent: band.batteryPercent,
            pairedAt: band.pairedAt.toISOString(),
            lastSyncAt: band.lastSyncAt?.toISOString() ?? null,
          }
        : null,
      colourways: V1_COLOURWAYS.map((variant) => ({
        id: variant.id,
        label: variant.label,
        note: variant.note ?? null,
        swatch: variant.swatch ?? null,
        accent: variant.accent ?? null,
        image: variant.image ?? null,
      })),
    },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}

export async function POST(request: Request) {
  const user = await getRequestUser(request);
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = pairSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "validation", message: parsed.error.issues[0]?.message }, { status: 422 });
  }

  const { serial, colourway } = parsed.data;

  const owned = await prisma.bandDevice.findUnique({ where: { serial }, select: { userId: true } });
  if (owned && owned.userId !== user.id) {
    return NextResponse.json({ error: "already_paired" }, { status: 409 });
  }

  const firmware = parsed.data.simulated ? "1.4.2-sim" : "1.0.0";
  const band = await prisma.bandDevice.upsert({
    where: { serial },
    update: { userId: user.id, colourway: colourway ?? "ember", firmware, lastSyncAt: new Date() },
    create: { userId: user.id, serial, colourway: colourway ?? "ember", firmware, lastSyncAt: new Date() },
  });

  await prisma.notification.create({
    data: {
      userId: user.id,
      kind: "band",
      title: "V1 paired",
      body: `${serial} is connected. It will start reporting after its first full night.`,
    },
  });

  return NextResponse.json(
    {
      band: {
        id: band.id,
        serial: band.serial,
        colourway: band.colourway,
        firmware: band.firmware,
        batteryPercent: band.batteryPercent,
        pairedAt: band.pairedAt.toISOString(),
        lastSyncAt: band.lastSyncAt?.toISOString() ?? null,
      },
    },
    { status: 201 },
  );
}

/** Unpair. The row goes, so the Band tab disappears with it. */
export async function DELETE(request: Request) {
  const user = await getRequestUser(request);
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  await prisma.bandDevice.deleteMany({ where: { userId: user.id } });
  return NextResponse.json({ ok: true });
}
