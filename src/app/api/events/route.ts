import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { eventSchema } from "@/lib/validation";
import { clientKey, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function POST(request: Request) {
  // Analytics never reports failure to the client — it must not affect the UI.
  if (!(await rateLimit(`events:${clientKey(request)}`, 120, 60_000))) {
    return new NextResponse(null, { status: 204 });
  }

  try {
    const parsed = eventSchema.safeParse(await request.json());
    if (parsed.success) {
      const event = parsed.data;
      await prisma.analyticsEvent.create({
        data: {
          name: event.name,
          sessionId: event.sessionId,
          locale: event.locale ?? null,
          path: event.path ?? null,
          props: JSON.stringify(event.props),
        },
      });
    }
  } catch {
    // Swallowed by design.
  }

  return new NextResponse(null, { status: 204 });
}
