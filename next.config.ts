import type { NextConfig } from "next";
import { locales } from "./src/i18n/config";
import { legalRedirects } from "./src/lib/destinations";

const nextConfig: NextConfig = {
  /**
   * Self-contained server output, for the container — but never on Vercel.
   *
   * Standalone emits a server bundle carrying only the modules actually
   * imported, so the Docker image ships without `node_modules`. Vercel builds
   * its own output format and expects the default tracing artefacts; with
   * standalone set it finishes all 444 pages and then dies looking for
   * `.next/next-server.js.nft.json`, which standalone never writes.
   *
   * So: on for self-hosting, off on Vercel, decided by the platform's own
   * environment variable rather than by remembering to flip a flag.
   */
  output: process.env.VERCEL ? undefined : "standalone",

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
