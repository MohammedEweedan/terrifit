import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n";
import { TerrifitProductPage } from "@/components/platform/TerrifitProductPage";
import { destinations, isDestination, movedDestinations } from "@/lib/destinations";

export function generateStaticParams() {
  return destinations.map((destination) => ({ destination }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; destination: string }> }): Promise<Metadata> {
  const { destination } = await params;
  const title = destination.charAt(0).toUpperCase() + destination.slice(1);
  return { title: `${title} — Terrifit`, description: `${title} on the Terrifit performance platform.` };
}

export default async function DestinationPage({ params }: { params: Promise<{ locale: string; destination: string }> }) {
  const { locale, destination } = await params;
  if (!isLocale(locale)) notFound();

  // /platform was renamed /app when the navigation started calling it that.
  // A 308 rather than a soft link so search engines move the ranking across
  // instead of treating the two as duplicates.
  const moved = movedDestinations[destination];
  if (moved) permanentRedirect(`/${locale}/${moved}`);

  if (!isDestination(destination)) notFound();
  return <TerrifitProductPage locale={locale} destination={destination} copy={getDictionary(locale)} />;
}
