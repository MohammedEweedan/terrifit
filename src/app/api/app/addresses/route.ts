import { NextResponse } from "next/server";
import { z } from "zod";
import { getRequestUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { findCountry, validPostal } from "@/lib/shop/countries";

export const runtime = "nodejs";

/** Somebody's address book. Small on purpose — this is not a CRM. */
const MAX_ADDRESSES = 8;

const select = {
  id: true, label: true, name: true, phone: true,
  line1: true, line2: true, city: true, postcode: true, country: true, isDefault: true,
} as const;

export async function GET(request: Request) {
  const user = await getRequestUser(request);
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const addresses = await prisma.savedAddress.findMany({
    where: { userId: user.id },
    orderBy: [{ isDefault: "desc" }, { updatedAt: "desc" }],
    select,
  });

  return NextResponse.json({ addresses }, { headers: { "Cache-Control": "private, no-store" } });
}

const schema = z.object({
  label: z.string().trim().max(40).optional().nullable(),
  name: z.string().trim().min(1).max(120),
  phone: z.string().trim().max(40).optional().nullable(),
  line1: z.string().trim().min(1).max(200),
  line2: z.string().trim().max(200).optional().nullable(),
  city: z.string().trim().min(1).max(120),
  postcode: z.string().trim().min(1).max(32),
  country: z.string().trim().length(2).toUpperCase(),
  isDefault: z.boolean().optional(),
});

export async function POST(request: Request) {
  const user = await getRequestUser(request);
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  if (!(await rateLimit(`address:${user.id}:${clientKey(request)}`, 20, 60_000))) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "validation", fields: parsed.error.issues.map((issue) => issue.path.join(".")) },
      { status: 422 },
    );
  }

  const input = parsed.data;
  // The same rules checkout applies, so a saved address can never be one that
  // would be rejected at the moment of paying.
  if (!findCountry(input.country)) {
    return NextResponse.json({ error: "validation", fields: ["country"] }, { status: 422 });
  }
  if (!validPostal(input.country, input.postcode)) {
    return NextResponse.json({ error: "validation", fields: ["postcode"] }, { status: 422 });
  }

  const count = await prisma.savedAddress.count({ where: { userId: user.id } });
  if (count >= MAX_ADDRESSES) {
    return NextResponse.json({ error: "too_many", limit: MAX_ADDRESSES }, { status: 409 });
  }

  // The first address somebody saves is their default whether they asked or not
  // — a book with no default makes checkout ask a question with one answer.
  const isDefault = input.isDefault || count === 0;

  const created = await prisma.$transaction(async (tx) => {
    if (isDefault) {
      await tx.savedAddress.updateMany({ where: { userId: user.id }, data: { isDefault: false } });
    }
    return tx.savedAddress.create({
      data: { ...input, label: input.label || null, userId: user.id, isDefault },
      select,
    });
  });

  return NextResponse.json(created, { status: 201 });
}

export async function DELETE(request: Request) {
  const user = await getRequestUser(request);
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const id = new URL(request.url).searchParams.get("id") ?? "";
  // Scoped to the owner in the same statement, so a guessed id deletes nothing.
  const removed = await prisma.savedAddress.deleteMany({ where: { id, userId: user.id } });
  if (removed.count === 0) return NextResponse.json({ error: "not_found" }, { status: 404 });

  // Losing the default leaves the book without one; the newest takes over.
  const remaining = await prisma.savedAddress.findFirst({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
    select: { id: true, isDefault: true },
  });
  if (remaining && !remaining.isDefault) {
    const anyDefault = await prisma.savedAddress.count({ where: { userId: user.id, isDefault: true } });
    if (anyDefault === 0) {
      await prisma.savedAddress.update({ where: { id: remaining.id }, data: { isDefault: true } });
    }
  }

  return NextResponse.json({ ok: true });
}
