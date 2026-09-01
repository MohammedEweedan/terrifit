import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteShell } from "@/components/layout/SiteShell";
import { CheckoutForm } from "@/components/shop/CheckoutForm";
import { isLocale } from "@/i18n/config";
import { getPagesCopy } from "@/i18n/pages";
import { getMarkets } from "@/lib/markets";
import { availableMethods, methodConfigured } from "@/lib/shop/payments";

export const metadata: Metadata = {
  title: "Checkout — Terrifit",
  robots: { index: false, follow: false },
};

// Which payment rails exist is read from the environment on every request, so a
// key added in production takes effect without a rebuild.
export const dynamic = "force-dynamic";

export default async function CheckoutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const markets = getMarkets(locale);
  const countries = [...markets.priority, ...markets.rest].map((market) => ({
    code: market.code,
    label: market.name,
  }));
  const methods = availableMethods();

  return (
    <SiteShell locale={locale} className="sh-site">
      <CheckoutForm
        locale={locale}
        copy={getPagesCopy(locale).shop}
        countries={countries}
        methods={methods}
        sandboxMethods={methods.filter((method) => !methodConfigured(method))}
      />
    </SiteShell>
  );
}
