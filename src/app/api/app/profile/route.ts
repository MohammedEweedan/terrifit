import { NextResponse } from "next/server";
import { z } from "zod";
import { getRequestUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ACTIVITY_LEVELS, GOALS, SEXES } from "@/lib/validation";

export const runtime = "nodejs";

/** JSON-encoded arrays, per the schema note about staying portable to Postgres. */
function parseList(value: string | null): string[] {
  if (!value) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

export async function GET(request: Request) {
  const currentUser = await getRequestUser(request);
  if (!currentUser) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const [user, profile, counts] = await Promise.all([
    prisma.user.findUnique({
      where: { id: currentUser.id },
      select: {
        id: true, name: true, email: true, handle: true, role: true, locale: true,
        plan: true, isAdmin: true, createdAt: true,
      },
    }),
    prisma.profile.findUnique({ where: { userId: currentUser.id } }),
    Promise.all([
      prisma.post.count({ where: { authorId: currentUser.id } }),
      prisma.follow.count({ where: { followeeId: currentUser.id } }),
      prisma.follow.count({ where: { followerId: currentUser.id } }),
    ]),
  ]);

  const [posts, followers, following] = counts;

  return NextResponse.json(
    {
      user,
      profile: profile
        ? {
            ...profile,
            dateOfBirth: profile.dateOfBirth?.toISOString() ?? null,
            onboardedAt: profile.onboardedAt?.toISOString() ?? null,
            updatedAt: profile.updatedAt.toISOString(),
            activities: parseList(profile.activities),
            healthConditions: parseList(profile.healthConditions),
          }
        : null,
      stats: { posts, followers, following },
    },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}

const patchSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  handle: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9_]{3,24}$/, "handles are 3–24 characters of a–z, 0–9 or _")
    .optional()
    .nullable(),
  bio: z.string().trim().max(400).optional().nullable(),
  /**
   * A data URI. Capped at 400 KB of base64 because it lives in a row that is
   * read on every profile load — anything larger belongs in object storage,
   * and the app downscales before sending.
   */
  avatarImage: z
    .string()
    .trim()
    .max(400_000)
    .regex(/^data:image\/(jpeg|png|webp);base64,/, "not_an_image")
    .optional()
    .nullable(),
  /** One emoji. Length is in code points, not UTF-16 units, so 👩🏽‍🦰 counts as one. */
  avatarEmoji: z
    .string()
    .trim()
    .refine((value) => value.length === 0 || [...new Intl.Segmenter().segment(value)].length === 1, "not_one_emoji")
    .optional()
    .nullable(),
  dateOfBirth: z.string().datetime().optional().nullable(),
  sex: z.enum(SEXES).optional().nullable(),
  heightCm: z.coerce.number().min(80).max(260).optional().nullable(),
  weightKg: z.coerce.number().min(25).max(400).optional().nullable(),
  units: z.enum(["metric", "imperial"]).optional(),
  timezone: z.string().max(80).refine(value => { try { new Intl.DateTimeFormat("en", { timeZone: value }); return true; } catch { return false; } }, "invalid_timezone").optional(),
  goal: z.enum(GOALS).optional().nullable(),
  activityLevel: z.enum(ACTIVITY_LEVELS).optional().nullable(),
  trainingDays: z.coerce.number().int().min(0).max(7).optional().nullable(),
  experience: z.enum(["new", "returning", "steady", "advanced"]).optional().nullable(),
  activities: z.array(z.string().trim().min(1).max(40)).max(20).optional(),
  healthConditions: z.array(z.string().trim().min(1).max(80)).max(20).optional(),
  shareWithCreators: z.boolean().optional(),
  /** Set once, by the last step of onboarding. */
  finishOnboarding: z.boolean().optional(),
});

export async function PATCH(request: Request) {
  const currentUser = await getRequestUser(request);
  if (!currentUser) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = patchSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "validation",
        fields: parsed.error.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message })),
      },
      { status: 422 },
    );
  }

  const { name, handle, finishOnboarding, activities, healthConditions, dateOfBirth, ...profileFields } = parsed.data;

  if (handle) {
    const taken = await prisma.user.findFirst({
      where: { handle, NOT: { id: currentUser.id } },
      select: { id: true },
    });
    if (taken) return NextResponse.json({ error: "handle_taken" }, { status: 409 });
  }

  if (name !== undefined || handle !== undefined) {
    await prisma.user.update({
      where: { id: currentUser.id },
      data: { ...(name !== undefined ? { name } : {}), ...(handle !== undefined ? { handle } : {}) },
    });
  }

  // Exactly one avatar at a time. Setting a photo clears the emoji and vice
  // versa, so nothing downstream has to decide which of two set values wins.
  const avatar =
    profileFields.avatarImage
      ? { avatarImage: profileFields.avatarImage, avatarEmoji: null }
      : profileFields.avatarEmoji
        ? { avatarEmoji: profileFields.avatarEmoji, avatarImage: null }
        : profileFields.avatarImage === null || profileFields.avatarEmoji === null
          ? { avatarImage: null, avatarEmoji: null }
          : {};

  const data = {
    ...profileFields,
    ...avatar,
    ...(dateOfBirth !== undefined ? { dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null } : {}),
    ...(activities !== undefined ? { activities: JSON.stringify(activities) } : {}),
    ...(healthConditions !== undefined ? { healthConditions: JSON.stringify(healthConditions) } : {}),
    ...(finishOnboarding ? { onboardedAt: new Date() } : {}),
  };

  await prisma.profile.upsert({
    where: { userId: currentUser.id },
    update: data,
    create: { userId: currentUser.id, ...data },
  });

  return NextResponse.json({ ok: true });
}
