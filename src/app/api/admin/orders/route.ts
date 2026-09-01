import { NextResponse } from "next/server";
import { FORBIDDEN, requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json(FORBIDDEN, { status: 403 });

  const url = new URL(request.url);
  const status = url.searchParams.get("status");
  const query = url.searchParams.get("q")?.trim() ?? "";

  const orders = await prisma.order.findMany({
    where: {
      ...(status && status !== "all" ? { paymentStatus: status } : {}),
      ...(query ? { OR: [{ number: { contains: query.toUpperCase() } }, { email: { contains: query } }] } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { items: true },
  });

  return NextResponse.json(
    {
      orders: orders.map((order) => ({
        id: order.id,
        number: order.number,
        email: order.email,
        name: order.name,
        totalCents: order.totalCents,
        currency: order.currency,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        fulfillmentStatus: order.fulfillmentStatus,
        sandbox: order.sandbox,
        createdAt: order.createdAt.toISOString(),
        items: order.items.map((item) => ({
          title: item.title,
          variantLabel: item.variant,
          quantity: item.quantity,
          unitPriceCents: item.unitCents,
        })),
        address: order.line1
          ? [order.line1, order.line2, order.city, order.postcode, order.country].filter(Boolean).join(", ")
          : null,
      })),
    },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
