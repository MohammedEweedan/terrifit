import { NextResponse } from "next/server";
import { z } from "zod";
import { getRequestUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { findProduct } from "@/lib/shop/catalog";

export const runtime = "nodejs";

/**
 * Reviews for one product.
 *
 * The rating shown is computed from the rows that exist, not from the
 * catalogue's launch figure — a product with three reviews shows the average of
 * those three, so the star count on the page is always one a customer could
 * read for themselves. Products with none say so plainly rather than borrowing
 * a number from nowhere.
 */
export async function GET(request: Request) {
  const user = await getRequestUser(request);
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const slug = new URL(request.url).searchParams.get("slug") ?? "";
  if (!findProduct(slug)) return NextResponse.json({ error: "unknown_product" }, { status: 404 });

  const rows = await prisma.productReview.findMany({
    where: { slug, hidden: false },
    orderBy: [{ verified: "desc" }, { createdAt: "desc" }],
    take: 50,
    select: {
      id: true, rating: true, title: true, body: true, verified: true, createdAt: true, userId: true,
      user: { select: { name: true, handle: true } },
    },
  });

  const counts = [0, 0, 0, 0, 0];
  for (const row of rows) counts[Math.min(4, Math.max(0, row.rating - 1))] += 1;
  const average = rows.length
    ? rows.reduce((total, row) => total + row.rating, 0) / rows.length
    : null;

  return NextResponse.json(
    {
      average,
      total: rows.length,
      /** Index 0 is one star, index 4 is five. */
      counts,
      /** Whether this member has already written one, so the app can say "Edit". */
      mine: rows.find((row) => row.userId === user.id)?.id ?? null,
      reviews: rows.map((row) => ({
        id: row.id,
        rating: row.rating,
        title: row.title,
        body: row.body,
        verified: row.verified,
        // First name only. A review is public and a surname is not needed to
        // make it credible.
        author: row.user.handle ?? row.user.name.split(" ")[0],
        date: row.createdAt.toISOString(),
        mine: row.userId === user.id,
      })),
    },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}

const schema = z.object({
  slug: z.string().trim().min(1).max(80),
  rating: z.number().int().min(1).max(5),
  title: z.string().trim().min(2).max(80),
  body: z.string().trim().min(10).max(2000),
});

export async function POST(request: Request) {
  const user = await getRequestUser(request);
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  if (!rateLimit(`review:${user.id}:${clientKey(request)}`, 5, 60_000)) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "validation", fields: parsed.error.issues.slice(0, 5).map((issue) => issue.path.join(".")) },
      { status: 422 },
    );
  }

  const { slug, rating, title, body } = parsed.data;
  if (!findProduct(slug)) return NextResponse.json({ error: "unknown_product" }, { status: 404 });

  // Verified is derived here and never accepted from the request: it is the
  // only thing separating a review that means something from one that does not.
  const purchase = await prisma.order.findFirst({
    where: { email: user.email, paymentStatus: "paid", items: { some: { slug } } },
    select: { id: true },
  });

  const review = await prisma.productReview.upsert({
    where: { slug_userId: { slug, userId: user.id } },
    update: { rating, title, body, verified: Boolean(purchase) },
    create: { slug, userId: user.id, rating, title, body, verified: Boolean(purchase) },
    select: { id: true, verified: true },
  });

  return NextResponse.json({ id: review.id, verified: review.verified }, { status: 201 });
}
