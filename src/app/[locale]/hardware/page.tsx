import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteShell } from "@/components/layout/SiteShell";
import { isLocale } from "@/i18n/config";
import { hardwareCopy } from "@/i18n/hardware";
import { PRICING } from "@/lib/health/plan";
import bandRender from "../../../../public/media/band/colourways-v2/ember.png";
import scaleRender from "../../../../public/media/scale/black-v1.png";

/**
 * The two devices, presented as one system rather than two listings.
 *
 * The argument the page has to make is that neither reading is worth much on
 * its own: a wearable says how hard the month was, a scale says what the month
 * did, and only together do they answer "is this working". So the products are
 * introduced separately and then explicitly joined, and the free tier is stated
 * before either price — buying hardware must not read as buying a subscription.
 */

/** Retail, in cents, alongside the subscription prices they sit next to. */
const BAND_CENTS = 19_900;
const SCALE_CENTS = 7_500;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const copy = hardwareCopy(locale);
  return {
    title: `${copy.title} — Terrifit`,
    description: copy.lede,
    alternates: { canonical: `/${locale}/hardware` },
  };
}

export default async function HardwarePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const copy = hardwareCopy(locale);
  const money = (cents: number) =>
    new Intl.NumberFormat(locale, { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(cents / 100);

  const devices = [
    { ...copy.band, price: BAND_CENTS, href: `/${locale}/band`, art: bandRender, alt: copy.band.name },
    { ...copy.scale, price: SCALE_CENTS, href: `/${locale}/scale`, art: scaleRender, alt: copy.scale.name },
  ];

  return (
    <SiteShell locale={locale}>
      <div className="rf-page hw-page">
        <header className="rf-hero rf-shell">
          <p className="rf-kicker">TERRIFIT / {copy.eyebrow}</p>
          <h1>{copy.title}</h1>
          <p className="rf-lede">{copy.lede}</p>
        </header>

        <section className="rf-section">
          <div className="rf-shell hw-devices">
            {devices.map((device) => (
              <article key={device.name} className="hw-device">
                <div className="hw-device-art">
                  {device.art ? (
                    <Image src={device.art} alt={device.alt} sizes="(max-width: 960px) 90vw, 420px" placeholder="blur" />
                  ) : (
                    // The Scale has no render yet. A labelled placeholder is
                    // honest; a stock photograph of somebody else's scale is not.
                    <span className="hw-device-pending" aria-hidden>{device.name}</span>
                  )}
                </div>
                <div className="hw-device-body">
                  <h2>{device.name}</h2>
                  <p className="hw-device-tagline">{device.tagline}</p>
                  <p>{device.body}</p>
                  <ul>{device.points.map((point) => <li key={point}>{point}</li>)}</ul>
                  <p className="hw-device-price numeric">
                    <strong>{money(device.price)}</strong>
                  </p>
                  <Link className="tf-button" href={device.href}>{copy.preorder} ↗</Link>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="rf-section hw-together">
          <div className="rf-shell">
            <p className="rf-kicker">{copy.together.eyebrow}</p>
            <h2>{copy.together.title}</h2>
            <p className="rf-lede">{copy.together.body}</p>
            <ul className="hw-readouts">
              {copy.together.points.map((point) => <li key={point}>{point}</li>)}
            </ul>
          </div>
        </section>

        <section className="rf-section">
          <div className="rf-shell hw-plan">
            <p className="rf-kicker">{copy.plan.eyebrow}</p>
            <h2>{copy.plan.title}</h2>
            <div className="hw-plan-grid">
              <article>
                <h3>{copy.plan.freeTitle}</h3>
                <strong className="rf-amount numeric">{money(0)}</strong>
                <p>{copy.plan.freeBody}</p>
              </article>
              <article className="hw-plan-pro">
                <h3>{copy.plan.proTitle}</h3>
                <strong className="rf-amount numeric">{money(PRICING.yearly.cents)}</strong>
                <p>{copy.plan.proBody}</p>
              </article>
            </div>
            <div className="rf-actions">
              <Link className="rf-link" href={`/${locale}/membership`}>{copy.plan.cta} →</Link>
              <Link className="rf-link" href={`/${locale}/app`}>{copy.seeApp} →</Link>
            </div>
            <p className="rf-note">{copy.note}</p>
          </div>
        </section>
      </div>
    </SiteShell>
  );
}
