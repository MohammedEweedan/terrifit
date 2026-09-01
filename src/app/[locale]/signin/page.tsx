import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { AuthForm } from "@/components/account/AuthForm";
import { SiteShell } from "@/components/layout/SiteShell";
import { isLocale } from "@/i18n/config";
import { getPagesCopy } from "@/i18n/pages";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const { meta } = getPagesCopy(locale).account.signin;
  return { title: meta.title, description: meta.description, alternates: { canonical: `/${locale}/signin` } };
}

export default async function SigninPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  if (await getCurrentUser()) redirect(`/${locale}/account`);

  return (
    <SiteShell locale={locale}>
      <AuthForm locale={locale} mode="signin" copy={getPagesCopy(locale).account} />
    </SiteShell>
  );
}
