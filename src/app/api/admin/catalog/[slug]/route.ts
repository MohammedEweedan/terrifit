import { NextResponse } from "next/server";
import { FORBIDDEN, requireAdmin } from "@/lib/admin";
import { adminProductSchema, archiveAdminProduct, updateAdminProduct } from "@/lib/shop/admin-catalog";
import { revalidatePath } from "next/cache";

export const runtime = "nodejs";

export async function PATCH(request: Request, context: { params: Promise<{ slug: string }> }) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json(FORBIDDEN, { status: 403 });
  const parsed = adminProductSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "validation", fields: parsed.error.issues.map((issue) => issue.path.join(".")) }, { status: 422 });
  }
  const { slug } = await context.params;
  if (parsed.data.slug !== slug) return NextResponse.json({ error: "slug_immutable" }, { status: 422 });
  let updated: boolean;
  try {
    updated = await updateAdminProduct(admin.id, slug, parsed.data);
  } catch {
    return NextResponse.json({ error: "conflict" }, { status: 409 });
  }
  if (!updated) return NextResponse.json({ error: "not_found" }, { status: 404 });
  revalidatePath("/", "layout");
  return NextResponse.json({ ok: true, slug });
}

/** Reversible archive: historical order lines and reviews remain intact. */
export async function DELETE(request: Request, context: { params: Promise<{ slug: string }> }) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json(FORBIDDEN, { status: 403 });
  const { slug } = await context.params;
  const archived = await archiveAdminProduct(admin.id, slug);
  if (!archived) return NextResponse.json({ error: "not_found" }, { status: 404 });
  revalidatePath("/", "layout");
  return NextResponse.json({ ok: true });
}
