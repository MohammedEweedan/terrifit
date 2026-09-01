import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteShell } from "@/components/layout/SiteShell";
import { ResetForm } from "@/components/account/ResetForm";
import { isLocale, locales } from "@/i18n/config";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export const metadata: Metadata = {
  title: "Reset your password · Terrifit",
  description: "Set a new password for your Terrifit account.",
  // A reset link is private and single-use; it has no business in an index.
  robots: { index: false, follow: false },
};

export default async function ResetPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return (
    <SiteShell locale={locale}>
      <ResetForm locale={locale} />
    </SiteShell>
  );
}
