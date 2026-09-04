import { notFound } from "next/navigation";
import { TerrifitLanding } from "@/components/landing/TerrifitLanding";
import { getDictionary } from "@/i18n";
import { isLocale, locales } from "@/i18n/config";
import { getMarkets } from "@/lib/markets";
import { prisma } from "@/lib/db";
import { launchOfferState, FOUNDING_ORDERS } from "@/lib/shop/launch-offer";
import type { Announcement } from "@/components/marketing/AnnouncementBar";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

/**
 * The signup counter on this page is a real query, so the page cannot be fully
 * static. Everything else on it is, and the count is cheap.
 */
export const revalidate = 60;

async function countWaitlist(): Promise<number> {
  // A landing page must render even when the database is asleep, so a failed
  // count is zero — which hides the card — rather than a 500.
  try {
    return await prisma.waitlistEntry.count();
  } catch {
    return 0;
  }
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
  const waitlistCount = await countWaitlist();
  const offer = await launchOfferState();
  // The only changing number on the marketing site, and it is a real one. The
  // id carries the count so the bar reappears as places go, rather than staying
  // dismissed at a figure that is no longer true.
  const announcement: Announcement | null = offer.open
    ? {
        id: `founding-${offer.remaining}`,
        text: `Founding hundred: ${offer.remaining} of ${FOUNDING_ORDERS} places left. Terrifuel over $150 earns a Terrifits tee, a V1 earns the hoodie.`,
        href: `/${locale}/shop`,
        cta: "See the shop →",
      }
    : null;

  return (
    <>
      <a className="sr-only focus:not-sr-only" href="#waitlist">
        Skip to waitlist
      </a>
      <TerrifitLanding
        locale={locale}
        markets={[...marketGroups.priority, ...marketGroups.rest]}
        copy={copy}
        waitlistCount={waitlistCount}
        announcement={announcement}
      />
    </>
  );
}
