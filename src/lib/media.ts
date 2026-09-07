/**
 * Where media is served from.
 *
 * Images, video and posters live in `public/media` in the repository and are
 * mirrored to Cloudflare R2 by `scripts/sync-r2.mjs`. When
 * `NEXT_PUBLIC_MEDIA_BASE` is set the pages request them from R2; when it is
 * not — local development, a preview without the variable, a deployment made
 * before the first sync — every path stays exactly as it is written and Vercel
 * serves the file from `public/`.
 *
 * That is the whole fallback story, and it is deliberate: the files are never
 * removed from the repository, so R2 is an accelerator rather than a single
 * point of failure. `SmartImage` closes the remaining gap by retrying the local
 * path when a request to R2 fails in the browser.
 */

/** Trailing slashes would produce `//media/...`, which R2 treats as a miss. */
const base = (process.env.NEXT_PUBLIC_MEDIA_BASE ?? "").trim().replace(/\/+$/, "");

/** True when media should be requested from R2 rather than from `public/`. */
export const mediaIsRemote = base.length > 0;

/**
 * Resolves a repository-relative media path to wherever it is actually served.
 *
 * Anything that is not a local `/media/...` path is returned untouched: absolute
 * URLs, data URIs and the `/_next` assets Next.js manages itself must not be
 * rewritten.
 */
export function mediaUrl(src: string): string {
  if (!mediaIsRemote) return src;
  if (!src.startsWith("/media/")) return src;
  return `${base}${src}`;
}

/** The path a failed remote request should retry, i.e. the file in `public/`. */
export function mediaFallback(src: string): string {
  if (!base || !src.startsWith(`${base}/media/`)) return src;
  return src.slice(base.length);
}
