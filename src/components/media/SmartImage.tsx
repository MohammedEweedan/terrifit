"use client";

import Image, { type ImageProps } from "next/image";
import { useState } from "react";
import { mediaUrl } from "@/lib/media";

/**
 * `next/image` that serves from Cloudflare R2 and survives R2 being down.
 *
 * The optimiser stays in the path — Vercel still resizes, re-encodes to AVIF or
 * WebP and caches the result at the edge — so R2 is only reached on a cache
 * miss. If that miss fails (R2 outage, a bucket permission change, a file that
 * was never synced) the browser reports an error and we re-request the original
 * `/media/...` path, which is still in `public/` and served by Vercel.
 *
 * The retry is one-shot: once `failed` is set the local path is used verbatim,
 * so a genuinely missing file surfaces as a broken image instead of looping.
 */
export function SmartImage({ src, onError, ...rest }: Omit<ImageProps, "src"> & { src: string }) {
  const [failed, setFailed] = useState(false);

  return (
    // `alt` is required by ImageProps and forwarded through ...rest; the rule
    // only recognises a literal attribute.
    // eslint-disable-next-line jsx-a11y/alt-text
    <Image
      {...rest}
      src={failed ? src : mediaUrl(src)}
      onError={(event) => {
        if (!failed) setFailed(true);
        onError?.(event);
      }}
    />
  );
}
