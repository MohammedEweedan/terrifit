import type { MetadataRoute } from "next";
import { locales } from "@/i18n/config";
import { destinations } from "@/lib/destinations";
import { LEGAL_DOCUMENTS } from "@/lib/legal/content";
import { listProducts } from "@/lib/shop/catalog-store";

/**
 * The sitemap.
 *
 * Every locale gets every page, cross-linked with `alternates.languages` so
 * search engines serve the Spanish page to Spanish searchers instead of picking
 * one at random. Private pages — the account area, checkout, the reset flow —
 * are deliberately absent; there is nothing there to index, and a reset link in
 * an index would be a security bug.
 */
const base = (process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://terrifit.com").replace(/\/$/, "");

const PUBLIC_PATHS = [
  "",
  "app",
  "coaching",
  "membership",
  "band",
  "maps",
  "creators",
  "shop",
  "contact",
  "fitness-age",
  ...destinations,
  ...LEGAL_DOCUMENTS.map((document) => `legal/${document.slug}`),
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const products = await listProducts();
  const paths = [...new Set([...PUBLIC_PATHS, ...products.map((product) => `shop/${product.slug}`)])];

  return paths.flatMap((path) =>
    locales.map((locale) => ({
      url: `${base}/${locale}${path ? `/${path}` : ""}`,
      lastModified: now,
      // The home page and the two things we sell outrank the rest.
      priority: path === "" ? 1 : path === "band" || path === "shop" ? 0.9 : 0.6,
      changeFrequency: (path.startsWith("legal/") ? "yearly" : "weekly") as "yearly" | "weekly",
      alternates: {
        languages: Object.fromEntries(
          locales.map((other) => [other, `${base}/${other}${path ? `/${path}` : ""}`]),
        ),
      },
    })),
  );
}
