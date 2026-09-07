import type { NextConfig } from "next";
import { locales } from "./src/i18n/config";
import { legalRedirects } from "./src/lib/destinations";

/**
 * Media origin. Empty until the R2 bucket is wired up, which is the same
 * signal `src/lib/media.ts` uses, so config and runtime cannot disagree.
 */
const mediaBase = (process.env.NEXT_PUBLIC_MEDIA_BASE ?? "").trim().replace(/\/+$/, "");
const mediaHost = mediaBase ? new URL(mediaBase) : null;

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

  images: {
    /**
     * R2 is the origin, not the delivery path. Keeping the optimiser in front
     * of it means the bucket is read on a cache miss and nothing else: the
     * resized AVIF/WebP variants are what browsers actually receive, and they
     * are served from the edge. It also means an R2 outage degrades to stale
     * cache first, and only then to the `public/` copy that SmartImage and Shot
     * retry against.
     */
    remotePatterns: mediaHost
      ? [{ protocol: mediaHost.protocol.replace(":", "") as "https" | "http", hostname: mediaHost.hostname, pathname: "/media/**" }]
      : [],
    formats: ["image/avif", "image/webp"],
    // Media is content-addressed by deploy, never edited in place, so the
    // optimiser has no reason to re-fetch it for a year.
    minimumCacheTTL: 31_536_000,
  },

  /**
   * The copies in `public/media` are the R2 fallback, and they are immutable —
   * a changed image gets a new filename via the manifest rather than a new body
   * at the same path. Without this they are served with Vercel's short default
   * and re-fetched constantly, which is exactly the cost R2 was meant to remove.
   */
  async headers() {
    return [
      {
        source: "/media/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ];
  },

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
