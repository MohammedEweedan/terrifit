import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email/send";
import { orderReceipt } from "@/lib/email/templates";
import { isLocale, type Locale } from "@/i18n/config";
import { currencyForLocale, findCurrency, priceIn, type Currency } from "./currency";
import { findCountry, validPostal } from "@/lib/shop/countries";
import { randomInt } from "node:crypto";
import { findProduct, findVariant, unitPriceCents, type Product } from "./catalog";
import { orderTotalCents } from "./shipping";
import type { CheckoutInput } from "@/lib/validation";

/**
 * Turns the cart the browser sent into priced lines using the catalogue as the
 * only source of truth for money. The request carries slugs, variants and
 * quantities; every figure below is computed here.
 */
export type PricedLine = {
  slug: string;
  variantId: string | null;
  title: string;
  variant: string | null;
  unitCents: number;
  quantity: number;
  subscribe: boolean;
  product: Product;
};

export function priceCart(items: CheckoutInput["items"]): {
  lines: PricedLine[];
  subtotalCents: number;
  hasPhysical: boolean;
} {
  const lines: PricedLine[] = [];

  for (const item of items) {
    const product = findProduct(item.slug);
    // A line naming a product that no longer exists is dropped rather than
    // failing the whole order — the customer keeps the rest of their bag.
    if (!product) continue;

    const variant = findVariant(product, item.variantId);
    const base = unitPriceCents(product, variant?.id);
    const discount = item.subscribe ? (product.subscription?.discountPercent ?? 0) : 0;

    lines.push({
      slug: product.slug,
      variantId: variant?.id ?? null,
      title: product.name,
      variant: variant?.label ?? null,
      unitCents: Math.round(base * (1 - discount / 100)),
      quantity: item.quantity,
      subscribe: item.subscribe && Boolean(product.subscription),
      product,
    });
  }

  return {
    lines,
    subtotalCents: lines.reduce((total, line) => total + line.unitCents * line.quantity, 0),
    hasPhysical: lines.some((line) => line.product.fulfilment === "ship"),
  };
}

export function totalsFor(subtotalCents: number, hasPhysical: boolean) {
  return orderTotalCents(subtotalCents, hasPhysical);
}

// No I, O, 0 or 1: these get read aloud down a phone line and typed back in.
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/** A short reference a customer can quote. Collisions are caught by the unique index. */
export function generateOrderNumber(): string {
  let code = "";
  for (let index = 0; index < 6; index += 1) code += ALPHABET[randomInt(ALPHABET.length)];
  return `TF-${code}`;
}

/** A one-line description of the whole order, for the payment gateway. */
export function orderDescription(lines: PricedLine[]): string {
  const first = lines[0];
  if (!first) return "Terrifit order";
  const extra = lines.length - 1;
  return extra > 0 ? `${first.title} and ${extra} more` : first.title;
}

/* -------------------------------------------------------------------------- */

/**
 * Writes an order from a validated checkout payload.
 *
 * Shared by the browser rail and the app's native rail so there is exactly one
 * place that decides what an order costs. Every line is re-resolved from the
 * catalogue inside `priceCart`, so nothing the client sends about price is
 * trusted, and the row exists before any gateway is called — a customer who is
 * charged always has a record here to reconcile against.
 */
export async function writeOrder(input: CheckoutInput): Promise<{
  id: string;
  number: string;
  lines: ReturnType<typeof priceCart>["lines"];
  totals: ReturnType<typeof totalsFor>;
  hasPhysical: boolean;
  /** The currency actually charged, and the total expressed in it. */
  currency: Currency;
  chargeAmount: number;
} | null> {
  const { lines, subtotalCents, hasPhysical } = priceCart(input.items);
  if (lines.length === 0) return null;

  const totals = totalsFor(subtotalCents, hasPhysical);
  const number = generateOrderNumber();

  // Resolved from the table, never taken on trust: an unknown code would be
  // rejected by Stripe after the order row already existed.
  const currency =
    findCurrency(input.currency ?? "")
    ?? currencyForLocale((isLocale(input.locale) ? input.locale : "en") as Locale);
  const chargeAmount = priceIn(totals.totalCents, currency);

  const order = await prisma.order.create({
    data: {
      number,
      email: input.email,
      name: input.name,
      phone: input.phone || null,
      line1: input.line1 || null,
      line2: input.line2 || null,
      city: input.city || null,
      postcode: input.postcode || null,
      country: input.country || null,
      subtotalCents: totals.subtotalCents,
      shippingCents: totals.shippingCents,
      taxCents: totals.taxCents,
      totalCents: totals.totalCents,
      paymentMethod: input.paymentMethod,
      currency: currency.code,
      locale: input.locale,
      items: {
        create: lines.map((line) => ({
          slug: line.slug,
          variantId: line.variantId,
          title: line.title,
          variant: line.variant,
          unitCents: line.unitCents,
          quantity: line.quantity,
          subscribe: line.subscribe,
        })),
      },
    },
    select: { id: true },
  });

  return { id: order.id, number, lines, totals, hasPhysical, currency, chargeAmount };
}

/**
 * The address rules, in one place so the two rails cannot drift.
 * Returns the fields that are wrong, or an empty list when it is fine.
 */
export function addressProblems(input: CheckoutInput, hasPhysical: boolean): string[] {
  if (!hasPhysical) return [];

  const missing = (["line1", "city", "postcode", "country"] as const).filter((field) => !input[field]);
  if (missing.length > 0) return missing;

  // The client checks these too, but the client is not the authority: a
  // postcode that does not match its country produces an undeliverable parcel,
  // and the carrier bills us either way.
  if (!findCountry(input.country ?? "")) return ["country"];
  if (!validPostal(input.country ?? "", input.postcode ?? "")) return ["postcode"];
  return [];
}


/**
 * Sends the receipt.
 *
 * Deliberately never throws and never blocks the response: a receipt that fails
 * to send is an annoyance, and an order that fails to complete because of one
 * is a lost sale. The result is returned so a caller can log it.
 */
export async function sendReceipt(orderId: string): Promise<{ sent: boolean; skipped: boolean }> {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        number: true, name: true, email: true, locale: true,
        subtotalCents: true, shippingCents: true, taxCents: true, totalCents: true,
        line1: true, line2: true, city: true, postcode: true, country: true,
        items: { select: { title: true, variant: true, quantity: true, unitCents: true } },
      },
    });
    if (!order) return { sent: false, skipped: true };

    const shipsTo = order.line1
      ? [order.line1, order.line2, order.city, order.postcode, order.country].filter(Boolean).join(", ")
      : null;

    const message = orderReceipt({
      number: order.number,
      name: order.name,
      locale: (isLocale(order.locale) ? order.locale : "en") as Locale,
      lines: order.items,
      subtotalCents: order.subtotalCents,
      shippingCents: order.shippingCents,
      taxCents: order.taxCents,
      totalCents: order.totalCents,
      shipsTo,
    });

    const result = await sendEmail({ to: order.email, ...message });
    return { sent: result.sent, skipped: result.skipped };
  } catch {
    return { sent: false, skipped: true };
  }
}
