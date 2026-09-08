import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { OnboardingFlow } from "@/components/onboarding/OnboardingFlow";
import { isLocale, locales } from "@/i18n/config";
import { onboardingCopy } from "@/i18n/onboarding";
import { getMarkets } from "@/lib/markets";

export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const copy = onboardingCopy(locale);
  return {
    title: `${copy.eyebrow} · Terrifit`,
    description: copy.steps.persona.sub,
    alternates: { canonical: `/${locale}/onboarding` },
  };
}

export default async function OnboardingPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ ref?: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  // A referral code arrives in the link, so it has to survive the funnel and
  // reach the waitlist call at the end — that is the whole point of sharing it.
  const { ref } = await searchParams;
  const markets = getMarkets(locale);

  return (
    <OnboardingFlow
      locale={locale}
      copy={onboardingCopy(locale)}
      markets={[...markets.priority, ...markets.rest]}
      referral={ref}
    />
  );
}
