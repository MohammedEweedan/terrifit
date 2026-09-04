import { z } from "zod";
import { prisma } from "@/lib/db";

const image = z.string().trim().max(6_000_000).refine(
  (value) => value.startsWith("/") || /^https:\/\//i.test(value) || /^data:image\/(jpeg|png|webp);base64,/i.test(value),
  "image_must_be_a_path_url_or_data_uri",
);

export const adminVariantSchema = z.object({
  key: z.string().trim().min(1).max(60).regex(/^[a-z0-9][a-z0-9-]*$/),
  label: z.string().trim().min(1).max(100),
  note: z.string().trim().max(300).nullish(),
  sku: z.string().trim().min(1).max(80),
  priceCents: z.number().int().min(0).max(10_000_000).nullish(),
  image: image.nullish(),
  colours: z.array(z.string().regex(/^#[0-9a-f]{6}$/i)).max(4).default([]),
  accent: z.string().regex(/^#[0-9a-f]{6}$/i).nullish(),
  active: z.boolean().default(true),
  sortOrder: z.number().int().min(0).max(10_000).default(0),
  stockQuantity: z.number().int().min(0).max(10_000_000).default(0),
  lowStockThreshold: z.number().int().min(0).max(1_000_000).default(5),
  allowBackorder: z.boolean().default(false),
});

export const adminMediaSchema = z.object({
  src: image,
  alt: z.string().trim().min(1).max(500),
  ratio: z.number().positive().max(10).nullish(),
  sortOrder: z.number().int().min(0).max(10_000).default(0),
});

export const adminProductSchema = z.object({
  slug: z.string().trim().min(2).max(80).regex(/^[a-z0-9][a-z0-9-]*$/),
  name: z.string().trim().min(1).max(120),
  tagline: z.string().trim().min(1).max(200),
  category: z.string().trim().min(1).max(40),
  brand: z.string().trim().min(1).max(80),
  partner: z.boolean().default(false),
  description: z.string().trim().min(1).max(10_000),
  priceCents: z.number().int().min(0).max(10_000_000),
  compareAtCents: z.number().int().min(0).max(10_000_000).nullish(),
  rating: z.number().min(0).max(5).default(0),
  reviewCount: z.number().int().min(0).default(0),
  badges: z.array(z.string().trim().min(1).max(80)).max(30).default([]),
  variantLabel: z.string().trim().max(80).nullish(),
  highlights: z.array(z.string().trim().min(1).max(500)).max(50).default([]),
  specs: z.array(z.tuple([z.string().trim().min(1).max(100), z.string().trim().min(1).max(300)])).max(100).default([]),
  shipsIn: z.string().trim().min(1).max(200),
  fulfilment: z.enum(["ship", "subscription"]),
  subscriptionLabel: z.string().trim().max(100).nullish(),
  subscriptionDiscountPercent: z.number().int().min(0).max(90).nullish(),
  active: z.boolean().default(true),
  featured: z.boolean().default(false),
  sortOrder: z.number().int().min(0).max(10_000).default(0),
  trackInventory: z.boolean().default(true),
  stockQuantity: z.number().int().min(0).max(10_000_000).default(0),
  lowStockThreshold: z.number().int().min(0).max(1_000_000).default(5),
  allowBackorder: z.boolean().default(false),
  variants: z.array(adminVariantSchema).max(100).default([]),
  media: z.array(adminMediaSchema).max(30).default([]),
}).superRefine((product, context) => {
  if (product.active && product.fulfilment === "ship" && product.priceCents === 0) {
    context.addIssue({ code: "custom", path: ["priceCents"], message: "active_physical_product_needs_a_price" });
  }
});

export type AdminProductInput = z.infer<typeof adminProductSchema>;

const scalar = (input: AdminProductInput) => ({
  name: input.name,
  tagline: input.tagline,
  category: input.category,
  brand: input.brand,
  partner: input.partner,
  description: input.description,
  priceCents: input.priceCents,
  compareAtCents: input.compareAtCents ?? null,
  rating: input.rating,
  reviewCount: input.reviewCount,
  badges: JSON.stringify(input.badges),
  variantLabel: input.variantLabel ?? null,
  highlights: JSON.stringify(input.highlights),
  specs: JSON.stringify(input.specs),
  shipsIn: input.shipsIn,
  fulfilment: input.fulfilment,
  subscriptionLabel: input.subscriptionLabel ?? null,
  subscriptionDiscountPercent: input.subscriptionDiscountPercent ?? null,
  active: input.active,
  featured: input.featured,
  sortOrder: input.sortOrder,
  trackInventory: input.trackInventory,
  stockQuantity: input.stockQuantity,
  lowStockThreshold: input.lowStockThreshold,
  allowBackorder: input.allowBackorder,
});

const variantData = (variant: AdminProductInput["variants"][number]) => ({
  label: variant.label,
  note: variant.note ?? null,
  sku: variant.sku,
  priceCents: variant.priceCents ?? null,
  image: variant.image ?? null,
  colours: JSON.stringify(variant.colours),
  accent: variant.accent ?? null,
  active: variant.active,
  sortOrder: variant.sortOrder,
  stockQuantity: variant.stockQuantity,
  lowStockThreshold: variant.lowStockThreshold,
  allowBackorder: variant.allowBackorder,
});

export async function createAdminProduct(actorId: string, input: AdminProductInput): Promise<void> {
  await prisma.$transaction(async (tx) => {
    await tx.shopProduct.create({
      data: {
        slug: input.slug,
        ...scalar(input),
        variants: { create: input.variants.map((variant) => ({ key: variant.key, ...variantData(variant) })) },
        media: { create: input.media.map((item) => ({ ...item, ratio: item.ratio ?? null })) },
      },
    });
    await tx.auditLog.create({ data: { actorId, action: "catalog.create", target: input.slug, detail: JSON.stringify({ name: input.name }) } });
  });
}

export async function updateAdminProduct(actorId: string, slug: string, input: AdminProductInput): Promise<boolean> {
  const product = await prisma.shopProduct.findUnique({ where: { slug }, select: { id: true } });
  if (!product) return false;

  await prisma.$transaction(async (tx) => {
    await tx.shopProduct.update({ where: { id: product.id }, data: scalar(input) });

    const keys = input.variants.map((variant) => variant.key);
    await tx.shopVariant.deleteMany({ where: { productId: product.id, key: { notIn: keys } } });
    for (const variant of input.variants) {
      await tx.shopVariant.upsert({
        where: { productId_key: { productId: product.id, key: variant.key } },
        update: variantData(variant),
        create: { productId: product.id, key: variant.key, ...variantData(variant) },
      });
    }

    await tx.shopMedia.deleteMany({ where: { productId: product.id } });
    if (input.media.length > 0) {
      await tx.shopMedia.createMany({ data: input.media.map((item) => ({ productId: product.id, ...item, ratio: item.ratio ?? null })) });
    }
    await tx.auditLog.create({ data: { actorId, action: "catalog.update", target: slug, detail: JSON.stringify({ active: input.active, stockQuantity: input.stockQuantity, variants: input.variants.length }) } });
  });
  return true;
}

export async function archiveAdminProduct(actorId: string, slug: string): Promise<boolean> {
  const changed = await prisma.shopProduct.updateMany({ where: { slug }, data: { active: false } });
  if (changed.count === 0) return false;
  await prisma.auditLog.create({ data: { actorId, action: "catalog.archive", target: slug, detail: "{}" } });
  return true;
}
