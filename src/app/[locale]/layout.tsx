import type { Metadata } from "next";
import { Anton, Inter, Noto_Kufi_Arabic } from "next/font/google";
import { notFound } from "next/navigation";
import "../globals.css";
import { getDictionary } from "@/i18n";
import { isLocale, localeMeta, locales } from "@/i18n/config";
import { themeScript } from "@/lib/theme";
import { CartProvider } from "@/lib/shop/cart";
import { CartDrawer } from "@/components/shop/CartDrawer";
import { listProducts } from "@/lib/shop/catalog-store";

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
  const catalog = await listProducts();

  return (
    <html
      lang={meta.htmlLang}
      dir={meta.dir}
      className={`${inter.variable} ${anton.variable} ${kufiArabic.variable} h-full`}
      // The inline theme script mutates data-theme before React hydrates.
      suppressHydrationWarning
    >
      <head>
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
