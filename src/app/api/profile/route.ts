import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { profileSchema } from "@/lib/validation";
import { clientKey, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const profile = await prisma.profile.findUnique({ where: { userId: user.id } });
  return NextResponse.json({ user, profile });
}

export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  if (!(await rateLimit(`profile:${clientKey(request)}`, 30, 60_000))) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = profileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "validation", fields: parsed.error.issues.map((issue) => issue.path.join(".")) },
      { status: 422 },
    );
  }

  const input = parsed.data;
  // An empty string from a cleared form field means "unset", not "save an empty
  // string" — otherwise a blank select would persist as a value.
  const blankToNull = (value: string | undefined) => (value && value.length > 0 ? value : null);
  const dateOfBirth = input.dateOfBirth ? new Date(input.dateOfBirth) : null;

  if (dateOfBirth && Number.isNaN(dateOfBirth.getTime())) {
    return NextResponse.json({ error: "validation", fields: ["dateOfBirth"] }, { status: 422 });
  }

  try {
    if (input.handle) {
      const taken = await prisma.user.findFirst({
        where: { handle: input.handle, NOT: { id: user.id } },
        select: { id: true },
      });
      if (taken) return NextResponse.json({ error: "handle_taken" }, { status: 409 });
    }

    if (input.name || input.handle !== undefined) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          ...(input.name ? { name: input.name } : {}),
          ...(input.handle !== undefined ? { handle: blankToNull(input.handle) } : {}),
        },
      });
    }

    const data = {
      dateOfBirth,
      sex: blankToNull(input.sex),
      heightCm: input.heightCm ?? null,
      weightKg: input.weightKg ?? null,
      units: input.units,
      timezone: blankToNull(input.timezone),
      goal: blankToNull(input.goal),
      activityLevel: blankToNull(input.activityLevel),
      trainingDays: input.trainingDays ?? null,
      bio: blankToNull(input.bio),
      ...(input.shareWithCreators === undefined ? {} : { shareWithCreators: input.shareWithCreators }),
    };

    const profile = await prisma.profile.upsert({
      where: { userId: user.id },
      update: data,
      create: { userId: user.id, ...data },
    });

    return NextResponse.json({ profile });
  } catch {
    return NextResponse.json({ error: "server" }, { status: 500 });
  }
}
