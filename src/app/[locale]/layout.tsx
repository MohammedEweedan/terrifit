import type { Metadata } from "next";
import { Anton, Inter, Noto_Kufi_Arabic } from "next/font/google";
import { notFound } from "next/navigation";
import "../globals.css";
import "../refinements.css";
import "../storefront.css";
import "../design-system.css";
import { getDictionary } from "@/i18n";
import { isLocale, localeMeta, locales } from "@/i18n/config";
import { themeScript } from "@/lib/theme";
import { CartProvider } from "@/lib/shop/cart";
import { CartDrawer } from "@/components/shop/CartDrawer";
import { listProductsOrSeed } from "@/lib/shop/catalog-store";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

// Condensed heavy grotesque for hero-scale headlines only.
const anton = Anton({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-anton",
  display: "swap",
});

// IBM Plex Sans Arabic: a designed companion to a Latin grotesque, with a
// real weight range — unlike a fallback face, it can carry headlines.
const kufiArabic = Noto_Kufi_Arabic({
  subsets: ["arabic"],
  weight: ["500", "600", "700", "800", "900"],
  variable: "--font-arabic",
  display: "swap",
});

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};

  const d = getDictionary(locale);
  const meta = localeMeta[locale];

  return {
    title: d.meta.title,
    description: d.meta.description,
    // Search engines need to know the page exists in every locale.
    alternates: {
      canonical: `/${locale}`,
      languages: Object.fromEntries(
        locales.map((code) => [localeMeta[code].htmlLang, `/${code}`]),
      ),
    },
    openGraph: {
      title: d.meta.title,
      description: d.meta.description,
      locale: meta.htmlLang,
      type: "website",
      siteName: "Terrifit",
    },
    twitter: {
      card: "summary_large_image",
      title: d.meta.title,
      description: d.meta.description,
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const meta = localeMeta[locale];
  const catalog = await listProductsOrSeed();

  return (
    <html
      lang={meta.htmlLang}
      dir={meta.dir}
      className={`${inter.variable} ${anton.variable} ${kufiArabic.variable} h-full`}
      // The inline theme script mutates data-theme before React hydrates.
      suppressHydrationWarning
    >
      <head>
        {/*
          A raw <script>, deliberately, not `next/script`.

          React logs "Encountered a script tag while rendering React component"
          for this in development. The warning is about client rendering —
          scripts in components do not execute on a client navigation — and it
          does not apply here: this only ever has to run once, in the
          server-rendered HTML, before the browser paints anything.

          `next/script` with `strategy="beforeInteractive"` is the documented
          alternative and is wrong for this case. It does not emit the script
          inline; it pushes it onto Next's loader queue
          (`self.__next_s.push(...)`), so it runs *after* first paint and the
          site flashes the wrong theme on every load. Verified by diffing the
          served HTML both ways.

          The warning is stripped from production builds and the production
          HTML carries this inline in <head>, which is the whole point.
        */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full">
        {/* The bag wraps every route, not just the shop: adding the V1 from the
            band page has to survive navigating to the shop to check out. */}
        <CartProvider catalog={catalog}>
          {children}
          <CartDrawer locale={locale} />
        </CartProvider>
      </body>
    </html>
  );
}
