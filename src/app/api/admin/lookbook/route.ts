import { NextResponse } from "next/server";
import { z } from "zod";
import { audit, FORBIDDEN, requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/db";
import { listAllLooks } from "@/lib/shop/lookbook";

export const runtime = "nodejs";

const schema = z.object({
  title: z.string().trim().min(1).max(120),
  note: z.string().trim().max(400).optional().or(z.literal("")),
  // Site-relative or absolute https. Anything else — javascript:, data:, a
  // protocol-relative //host — would render an attacker-controlled image.
  imageUrl: z.string().trim().min(1).max(500)
    .refine((value) => value.startsWith("/") && !value.startsWith("//") ? true : /^https:\/\/[^/]+\//.test(value),
      "must be a site path or an https URL"),
  alt: z.string().trim().min(1).max(300),
  productSlugs: z.array(z.string().trim().max(80)).max(12).default([]),
  sortOrder: z.number().int().min(0).max(999).default(0),
  published: z.boolean().default(true),
});

export async function GET(request: Request) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json(FORBIDDEN, { status: 403 });
  return NextResponse.json({ looks: await listAllLooks() }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function POST(request: Request) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json(FORBIDDEN, { status: 403 });

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "validation", fields: parsed.error.issues.map((issue) => issue.path.join(".")) },
      { status: 422 },
    );
  }

  const look = await prisma.lookbookLook.create({
    data: {
      title: parsed.data.title,
      note: parsed.data.note || null,
      imageUrl: parsed.data.imageUrl,
      alt: parsed.data.alt,
      productSlugs: JSON.stringify(parsed.data.productSlugs),
      sortOrder: parsed.data.sortOrder,
      published: parsed.data.published,
    },
  });
  await audit(admin.id, "lookbook.create", look.id, { title: look.title });

  return NextResponse.json({ id: look.id }, { status: 201 });
}
