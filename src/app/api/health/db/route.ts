import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Says why the database is not working, without saying anything secret.
 *
 * Every failure so far — the waitlist 500, the checkout 500, the empty shop
 * catalogue — has been the same unreachable database, and diagnosing it took
 * guesswork because a deployment cannot be asked what it thinks DATABASE_URL
 * is. This answers that in one request.
 *
 * It deliberately returns no credentials: the host is reduced to a fingerprint
 * that can be compared against the expected one, and the connection flags are
 * reported as booleans. `uselibpqcompat` matters because without it the driver
 * treats `sslmode=require` as full verification and DigitalOcean's CA is not in
 * Node's trust store, which fails as `self-signed certificate in chain` and
 * looks nothing like a configuration problem.
 */
export async function GET() {
  const url = process.env.DATABASE_URL;

  if (!url) {
    return NextResponse.json(
      { configured: false, reachable: false, reason: "DATABASE_URL is not set on this deployment" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }

  let host: string | null = null;
  let flags: Record<string, boolean> = {};
  try {
    const parsed = new URL(url);
    // Eight characters is enough to compare two hosts, not enough to be one.
    host = createHash("sha256").update(parsed.hostname).digest("hex").slice(0, 8);
    flags = {
      sslmode: parsed.searchParams.get("sslmode") === "require",
      uselibpqcompat: parsed.searchParams.get("uselibpqcompat") === "true",
      pgbouncer: parsed.searchParams.get("pgbouncer") === "true",
    };
  } catch {
    return NextResponse.json(
      { configured: true, reachable: false, reason: "DATABASE_URL is not a valid URL" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    await prisma.$queryRaw`select 1`;
    return NextResponse.json(
      { configured: true, reachable: true, hostFingerprint: host, flags },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      {
        configured: true,
        reachable: false,
        hostFingerprint: host,
        flags,
        // The driver's own wording, trimmed. Names the failure class
        // (DatabaseNotReachable, self-signed certificate, auth) without echoing
        // the connection string back to a public endpoint.
        reason: message.split("\n").find((line) => line.trim())?.slice(0, 200) ?? "unknown",
      },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
