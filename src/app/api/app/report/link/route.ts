import { createHash, randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getRequestUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { REPORT_SECTIONS, type ReportSection } from "@/lib/health/report";

export const runtime = "nodejs";

/** Long enough to open and print, short enough that a stale link is useless. */
const TTL_MINUTES = 15;

const hash = (token: string) => createHash("sha256").update(token).digest("hex");

const schema = z.object({
  days: z.number().int().min(7).max(365).default(90),
  sections: z.array(z.string()).optional(),
});

function siteOrigin(request: Request): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) return configured.replace(/\/$/, "");
  const origin = request.headers.get("origin");
  if (origin && /^https?:\/\//.test(origin)) return origin.replace(/\/$/, "");
  return "http://localhost:3000";
}

/**
 * Hands a report from the app to a browser, so it can be printed.
 *
 * The app authenticates with a bearer token the browser has no way to see, so
 * "print this" needs a handover. This mints a single-use link rather than
 * putting the session token in a URL — a URL ends up in history, in a share
 * sheet, and in whatever the OS decides to sync.
 */
export async function POST(request: Request) {
  const user = await getRequestUser(request);
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  if (!(await rateLimit(`reportlink:${user.id}:${clientKey(request)}`, 10, 60_000))) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const parsed = schema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "validation" }, { status: 422 });

  const sections = (parsed.data.sections ?? REPORT_SECTIONS).filter(
    (section): section is ReportSection => REPORT_SECTIONS.includes(section as ReportSection),
  );

  const token = randomBytes(32).toString("base64url");
  await prisma.reportLink.create({
    data: {
      userId: user.id,
      tokenHash: hash(token),
      sections: JSON.stringify(sections.length > 0 ? sections : REPORT_SECTIONS),
      days: parsed.data.days,
      expiresAt: new Date(Date.now() + TTL_MINUTES * 60_000),
    },
  });

  return NextResponse.json({
    url: `${siteOrigin(request)}/report/${token}`,
    expiresInMinutes: TTL_MINUTES,
  });
}
