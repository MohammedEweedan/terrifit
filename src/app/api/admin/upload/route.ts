import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { FORBIDDEN, requireAdmin, audit } from "@/lib/admin";

export const runtime = "nodejs";

const MAX_BYTES = 8 * 1024 * 1024;
/** Only formats a browser will actually decode, and only ones we can serve. */
const TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};

const env = (key: string) => process.env[key]?.trim() ?? "";

/**
 * Uploads one image to R2 and returns the URL to store against a look.
 *
 * The bytes go straight to object storage rather than the deployment: a
 * serverless filesystem is ephemeral, so anything written there is gone at the
 * next cold start — an upload feature that silently loses files is worse than
 * none. If R2 is not configured the endpoint says so plainly instead of
 * pretending to have saved something.
 */
export async function POST(request: Request) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json(FORBIDDEN, { status: 403 });

  const account = env("R2_ACCOUNT_ID");
  const bucket = env("R2_BUCKET");
  const key = env("R2_ACCESS_KEY_ID");
  const secret = env("R2_SECRET_ACCESS_KEY");
  const base = env("NEXT_PUBLIC_MEDIA_BASE").replace(/\/+$/, "");
  if (!account || !bucket || !key || !secret || !base) {
    return NextResponse.json(
      { error: "storage_unconfigured", detail: "Set R2_ACCOUNT_ID, R2_BUCKET, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY and NEXT_PUBLIC_MEDIA_BASE." },
      { status: 503 },
    );
  }

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "no_file" }, { status: 422 });

  const extension = TYPES[file.type];
  if (!extension) return NextResponse.json({ error: "unsupported_type", type: file.type }, { status: 415 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "too_large", max: MAX_BYTES }, { status: 413 });

  const body = Buffer.from(await file.arrayBuffer());
  // Content-addressed: the same image uploaded twice occupies one object and
  // keeps one URL, and a name can never collide with an existing file.
  const digest = createHash("sha256").update(body).digest("hex").slice(0, 20);
  const objectKey = `media/lookbook/${digest}.${extension}`;

  const client = new S3Client({
    region: "auto",
    endpoint: `https://${account}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: key, secretAccessKey: secret },
  });

  try {
    await client.send(new PutObjectCommand({
      Bucket: bucket,
      Key: objectKey,
      Body: body,
      ContentType: file.type,
      CacheControl: "public, max-age=31536000, immutable",
    }));
  } catch (error) {
    console.error("lookbook upload failed", error);
    return NextResponse.json({ error: "upload_failed" }, { status: 502 });
  }

  await audit(admin.id, "lookbook.upload", objectKey, { bytes: body.byteLength, type: file.type });
  return NextResponse.json({ url: `${base}/${objectKey}` }, { status: 201 });
}
