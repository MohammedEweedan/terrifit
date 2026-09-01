import { notFound } from "next/navigation";
import { TerrifitLanding } from "@/components/landing/TerrifitLanding";
import { getDictionary } from "@/i18n";
import { isLocale, locales } from "@/i18n/config";
import { getMarkets } from "@/lib/markets";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LandingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const marketGroups = getMarkets(locale);
  const copy = getDictionary(locale);

  return (
    <>
      <a className="sr-only focus:not-sr-only" href="#waitlist">
        Skip to waitlist
      </a>
      <TerrifitLanding
        locale={locale}
        markets={[...marketGroups.priority, ...marketGroups.rest]}
        copy={copy}
      />
    </>
  );
}
