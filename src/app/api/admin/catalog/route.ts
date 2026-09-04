import { NextResponse } from "next/server";
import { FORBIDDEN, requireAdmin } from "@/lib/admin";
import { adminProductSchema, createAdminProduct } from "@/lib/shop/admin-catalog";
import { ensureCatalogSeeded, listProducts } from "@/lib/shop/catalog-store";
import { revalidatePath } from "next/cache";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json(FORBIDDEN, { status: 403 });
  await ensureCatalogSeeded();
  const products = await listProducts({ includeInactive: true });
  return NextResponse.json({
    products: products.map((product) => ({
      ...product,
      reviewCount: product.reviews,
      subscriptionLabel: product.subscription?.label ?? null,
      subscriptionDiscountPercent: product.subscription?.discountPercent ?? null,
      variants: product.variants.map((variant, sortOrder) => ({
        key: variant.id,
        label: variant.label,
        note: variant.note ?? null,
        sku: variant.sku,
        priceCents: variant.priceCents ?? null,
        image: variant.image ?? null,
        colours: variant.colours ?? [],
        accent: variant.accent ?? null,
        active: variant.active ?? true,
        sortOrder,
        stockQuantity: variant.stockQuantity ?? 0,
        lowStockThreshold: variant.lowStockThreshold ?? 5,
        allowBackorder: variant.allowBackorder ?? false,
      })),
      media: product.media.map((item, sortOrder) => ({ ...item, ratio: item.ratio ?? null, sortOrder })),
    })),
  }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function POST(request: Request) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json(FORBIDDEN, { status: 403 });
  const parsed = adminProductSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "validation", fields: parsed.error.issues.map((issue) => issue.path.join(".")) }, { status: 422 });
  }
  try {
    await createAdminProduct(admin.id, parsed.data);
    revalidatePath("/", "layout");
    return NextResponse.json({ ok: true, slug: parsed.data.slug }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "conflict" }, { status: 409 });
  }
}
