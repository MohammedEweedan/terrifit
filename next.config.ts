import type { NextConfig } from "next";
import { locales } from "./src/i18n/config";
import { legalRedirects } from "./src/lib/destinations";

const nextConfig: NextConfig = {
  /**
   * Emits a self-contained server bundle with only the modules actually
   * imported, so the container ships without `node_modules`. Without it the
   * image carries the full dependency tree — several hundred megabytes that
   * have to be pushed to the registry and pulled on every deploy.
   */
  output: "standalone",

  /**
   * The old marketing pages at /privacy, /terms, /health and /affiliate are now
   * the real policies under /legal. Permanent, so the old URLs — which are in
   * the wild on old footers and in App Store listings — end up at the document
   * that actually says something, and search engines follow.
   */
  async redirects() {
    return locales.flatMap((locale) =>
      legalRedirects.map((slug) => ({
        source: `/${locale}/${slug}`,
        destination: `/${locale}/legal/${slug}`,
        permanent: true,
      })),
    );
  },
};

export default nextConfig;
