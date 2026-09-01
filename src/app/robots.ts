import type { MetadataRoute } from "next";

const base = (process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://terrifit.com").replace(/\/$/, "");

/**
 * Everything public is crawlable; everything with somebody's data behind it is
 * not. `/reset` matters most: a password-reset link carries a working token in
 * its query string and must never end up in an index.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/*/account", "/*/reset", "/*/admin", "/*/shop/checkout", "/*/shop/order/"],
    },
    sitemap: `${base}/sitemap.xml`,
  };
}
