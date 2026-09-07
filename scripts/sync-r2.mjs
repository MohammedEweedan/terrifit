/**
 * Mirrors public/media to a Cloudflare R2 bucket.
 *
 * The files stay in the repository — they are the fallback the pages retry
 * against when R2 does not answer — so this is a mirror, not a move. It is safe
 * to run repeatedly: every object is compared by MD5 against the ETag R2
 * already holds, and unchanged files are skipped, so a normal run after a small
 * change uploads only that change rather than 124MB.
 *
 *   node scripts/sync-r2.mjs --dry-run
 *   node scripts/sync-r2.mjs
 *
 * Required environment:
 *   R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET
 */
import { createHash } from "node:crypto";
import { readdir, readFile, stat } from "node:fs/promises";
import { join, relative, extname } from "node:path";
import { fileURLToPath } from "node:url";
import { S3Client, PutObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";

const root = fileURLToPath(new URL("..", import.meta.url));
const source = join(root, "public/media");
const dryRun = process.argv.includes("--dry-run");

const required = ["R2_ACCOUNT_ID", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "R2_BUCKET"];
const missing = required.filter((name) => !process.env[name]);
if (missing.length) {
  console.error(`Missing environment: ${missing.join(", ")}`);
  process.exit(1);
}

/** Browsers refuse to decode media served as application/octet-stream. */
const TYPES = {
  ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp",
  ".avif": "image/avif", ".gif": "image/gif", ".svg": "image/svg+xml", ".ico": "image/x-icon",
  ".mp4": "video/mp4", ".webm": "video/webm", ".mov": "video/quicktime",
  ".woff2": "font/woff2", ".woff": "font/woff", ".json": "application/json",
  ".md": "text/markdown; charset=utf-8", ".txt": "text/plain; charset=utf-8",
};

const client = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});
const Bucket = process.env.R2_BUCKET;

async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.name.startsWith(".")) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else yield full;
  }
}

/** R2 reports a plain MD5 for single-part uploads, quoted. */
const etagOf = (buffer) => createHash("md5").update(buffer).digest("hex");

async function unchanged(Key, hash, size) {
  try {
    const head = await client.send(new HeadObjectCommand({ Bucket, Key }));
    return head.ETag?.replaceAll('"', "") === hash && head.ContentLength === size;
  } catch {
    // Absent, or no permission to stat it — either way, upload.
    return false;
  }
}

try {
  await stat(source);
} catch {
  console.error(`No media directory at ${source}`);
  process.exit(1);
}

let uploaded = 0, skipped = 0, bytes = 0, failed = 0;
for await (const file of walk(source)) {
  // The key mirrors the public path exactly, so /media/x.png is <base>/media/x.png.
  const Key = `media/${relative(source, file).split("\\").join("/")}`;
  const body = await readFile(file);
  const hash = etagOf(body);

  if (await unchanged(Key, hash, body.byteLength)) {
    skipped += 1;
    continue;
  }
  if (dryRun) {
    console.log(`  would upload  ${Key}  (${(body.byteLength / 1024).toFixed(0)}KB)`);
    uploaded += 1; bytes += body.byteLength;
    continue;
  }
  try {
    await client.send(new PutObjectCommand({
      Bucket, Key, Body: body,
      ContentType: TYPES[extname(file).toLowerCase()] ?? "application/octet-stream",
      // Matches the header Next serves the public/ copy with, so a file behaves
      // identically whichever origin answered.
      CacheControl: "public, max-age=31536000, immutable",
    }));
    uploaded += 1; bytes += body.byteLength;
  } catch (error) {
    failed += 1;
    console.error(`  FAILED ${Key}: ${error.message}`);
  }
}

const mb = (bytes / 1024 / 1024).toFixed(1);
console.log(`${dryRun ? "[dry run] " : ""}uploaded ${uploaded} (${mb}MB), skipped ${skipped} unchanged, ${failed} failed`);
process.exit(failed ? 1 : 0);
