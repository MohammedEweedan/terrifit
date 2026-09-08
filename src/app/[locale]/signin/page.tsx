import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { AuthForm } from "@/components/account/AuthForm";
import { SiteShell } from "@/components/layout/SiteShell";
import { isLocale } from "@/i18n/config";
import { getPagesCopy } from "@/i18n/pages";
import { getCurrentUser } from "@/lib/auth";
import { safeNext } from "@/lib/safe-next";

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

export default async function SigninPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ next?: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  // `/nimda` and other guarded pages send people here with `?next=`, and it was
  // being ignored: everyone landed on the customer account page regardless of
  // what they were trying to reach. Validated, because forwarding to an
  // arbitrary URL after a login is an open redirect.
  const { next } = await searchParams;
  const destination = safeNext(next, `/${locale}/account`);

  if (await getCurrentUser()) redirect(destination);

  return (
    <SiteShell locale={locale}>
      <AuthForm locale={locale} mode="signin" copy={getPagesCopy(locale).account} next={destination} />
    </SiteShell>
  );
}
