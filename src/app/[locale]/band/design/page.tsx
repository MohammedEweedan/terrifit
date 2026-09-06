import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { SiteShell } from "@/components/layout/SiteShell";
import { BandViewer } from "@/components/band/BandViewer";
import { isLocale } from "@/i18n/config";

export const metadata: Metadata = { title: "Terrifit Band · 360° design studio", description: "Explore the Terrifit Band in seven woven colourways. Rotate the band and inspect its sensor design." };

export default async function BandDesignPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return <SiteShell locale={locale}><div className="tf-shell" style={{ paddingTop: 48, paddingBottom: 60, maxWidth: 1080 }}><Link href={`/${locale}/band`} style={{ fontSize: 12 }}>← Terrifit Band</Link><BandViewer locale={locale} /></div></SiteShell>;
}
