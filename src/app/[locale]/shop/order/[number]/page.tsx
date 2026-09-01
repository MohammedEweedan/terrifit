import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteShell } from "@/components/layout/SiteShell";
import { isLocale } from "@/i18n/config";
import { getPagesCopy } from "@/i18n/pages";
import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/shop/money";

export const metadata: Metadata = {
  title: "Order confirmed — Terrifit",
  // An order page is somebody's receipt. It must never reach an index.
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function OrderPage({
  params,
}: {
  params: Promise<{ locale: string; number: string }>;
}) {
  const { locale, number } = await params;
  if (!isLocale(locale)) notFound();

  const copy = getPagesCopy(locale).shop;
  const order = await prisma.order.findUnique({
    where: { number: number.toUpperCase() },
    include: { items: true },
  });

  if (!order) {
    return (
      <SiteShell locale={locale} className="sh-site">
        <div className="sh-page">
          <div className="tf-shell sh-cart-empty">
            <h1>{copy.order.notFound}</h1>
            <p>{copy.order.notFoundBody}</p>
            <Link className="sh-button" href={`/${locale}/contact`}>
              {copy.order.supportCta}
            </Link>
          </div>
        </div>
      </SiteShell>
    );
  }

  const paid = order.paymentStatus === "paid";

  return (
    <SiteShell locale={locale} className="sh-site">
      <div className="sh-page">
        <div className="tf-shell sh-order">
          <p className="sh-eyebrow">{paid ? copy.order.paid : copy.order.pending}</p>
          <h1>{copy.order.title}</h1>
          <p className="sh-lede">{copy.order.body}</p>

          {order.sandbox ? <p className="sh-sandbox is-banner">{copy.checkout.testMode}</p> : null}

          <dl className="sh-order-facts">
            <div>
              <dt>{copy.order.numberLabel}</dt>
              <dd className="numeric">{order.number}</dd>
            </div>
            <div>
              <dt>{copy.order.emailLabel}</dt>
              <dd>{order.email}</dd>
            </div>
            <div>
              <dt>{copy.order.totalLabel}</dt>
              <dd className="numeric">{formatMoney(order.totalCents, locale, order.currency)}</dd>
            </div>
            <div>
              <dt>{copy.order.methodLabel}</dt>
              <dd>{copy.checkout.methods[order.paymentMethod as keyof typeof copy.checkout.methods]?.label ?? order.paymentMethod}</dd>
            </div>
          </dl>

          <section className="sh-order-items">
            <h2>{copy.order.itemsLabel}</h2>
            <ul>
              {order.items.map((item) => (
                <li key={item.id}>
                  <div>
                    <strong>{item.title}</strong>
                    {item.variant ? <span>{item.variant}</span> : null}
                  </div>
                  <span className="numeric">×{item.quantity}</span>
                  <b className="numeric">{formatMoney(item.unitCents * item.quantity, locale, order.currency)}</b>
                </li>
              ))}
            </ul>
          </section>

          <section className="sh-order-next">
            <h2>{copy.order.nextTitle}</h2>
            <ol>
              {copy.order.next.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </section>

          <div className="sh-order-actions">
            <Link className="sh-button" href={`/${locale}/shop`}>
              {copy.order.continue}
            </Link>
            <Link className="sh-text-link" href={`/${locale}/contact`}>
              {copy.order.support}
            </Link>
          </div>
        </div>
      </div>
    </SiteShell>
  );
}
