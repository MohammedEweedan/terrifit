"use client";

import { useState } from "react";
import { mediaUrl } from "@/lib/media";

/**
 * An image slot that is honest about being empty.
 *
 * Every photograph and render on the new product pages is a slot waiting for
 * generated art. Pointing `next/image` at a file that does not exist yet would
 * fail the build (static import) or show a broken-image glyph (string src), so
 * this renders a plain <img> and swaps in a designed placeholder the moment the
 * file 404s. The placeholder prints the exact filename and the alt text it was
 * specced from, which is what someone generating the image actually needs.
 *
 * Drop the real file at `src` and the placeholder disappears — no code change.
 */
export function Shot({
  src,
  alt,
  ratio = 1,
  className = "",
  sizes,
  priority = false,
  fit = "cover",
  position,
  fallback,
}: {
  src: string;
  alt: string;
  /** width / height. Drives the reserved box so nothing shifts on load. */
  ratio?: number;
  className?: string;
  sizes?: string;
  priority?: boolean;
  fit?: "cover" | "contain";
  position?: string;
  /**
   * What to draw instead of the art brief when the file is missing. Marketing
   * slots want the brief; a shop grid does not — twelve dashed boxes reading
   * "shoot this" is worse than twelve branded tiles, and the manifest already
   * tracks what still needs shooting.
   */
  fallback?: { label: string; sub?: string };
}) {
  // Two sources, tried in order: Cloudflare R2, then the copy that is still in
  // public/. Only when both fail is the slot genuinely empty and the brief (or
  // the branded tile) drawn instead. Resetting on a changed `src` is derived
  // during render rather than in an effect, which this codebase does not allow.
  const [attempt, setAttempt] = useState({ key: src, url: mediaUrl(src), failed: false });
  const current = attempt.key === src ? attempt : { key: src, url: mediaUrl(src), failed: false };
  const failed = current.failed;
  const file = src.split("/").pop() ?? src;

  return (
    <div
      className={`tf-shot ${failed ? "is-empty" : ""} ${className}`}
      style={{ aspectRatio: String(ratio) }}
      data-media={src}
    >
      {failed && fallback ? (
        <div className="tf-shot-tile" role="img" aria-label={alt}>
          <span className="tf-shot-tile-mark" aria-hidden>
            <i /><i /><i /><i />
          </span>
          <strong>{fallback.label}</strong>
          {fallback.sub ? <span>{fallback.sub}</span> : null}
        </div>
      ) : failed ? (
        <div className="tf-shot-placeholder" role="img" aria-label={alt}>
          <svg viewBox="0 0 48 48" aria-hidden="true">
            <path d="M8 34l9-11 7 8 5-6 11 13H8z" />
            <circle cx="17" cy="16" r="4" />
          </svg>
          <p>{alt}</p>
          <code>{file}</code>
        </div>
      ) : (
        /* The file is expected to be missing during art production, and
           next/image cannot recover from a 404 — these slots are all
           art-directed anyway. */
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={current.url}
          src={current.url}
          alt={alt}
          sizes={sizes}
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : undefined}
          decoding="async"
          onError={() =>
            // R2 missed: retry the local file before giving up on the slot.
            setAttempt(
              current.url === src
                ? { key: src, url: src, failed: true }
                : { key: src, url: src, failed: false },
            )
          }
          style={{ objectFit: fit, objectPosition: position }}
        />
      )}
    </div>
  );
}
