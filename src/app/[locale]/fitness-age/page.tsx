import { notFound } from "next/navigation";
import { isLocale, locales } from "@/i18n/config";
import { FitnessAgeCalculator } from "@/components/tools/FitnessAgeCalculator";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const title = "What's your fitness age? — Terrifit";
  const description =
    "Your resting heart rate says more about your fitness than your birthday does. Work out your fitness age in about ten seconds, free, and see exactly how the number was reached.";
  return {
    title,
    description,
    alternates: { canonical: `/${locale}/fitness-age` },
    openGraph: { title, description, type: "website" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function FitnessAgePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return <FitnessAgeCalculator locale={locale} />;
}
