import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n";
import { TerrifitProductPage } from "@/components/platform/TerrifitProductPage";
import { destinations, isDestination } from "@/lib/destinations";

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
  if (!isLocale(locale) || !isDestination(destination)) notFound();
  return <TerrifitProductPage locale={locale} destination={destination} copy={getDictionary(locale)} />;
}
