import { NextResponse } from "next/server";
import { z } from "zod";
import { getRequestUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { notify } from "@/lib/push";

export const runtime = "nodejs";

/** Membership is the authorisation check for everything in this file. */
async function memberOf(conversationId: string, userId: string): Promise<boolean> {
  const thread = await prisma.conversation.findFirst({
    where: { id: conversationId, members: { some: { id: userId } } },
    select: { id: true },
  });
  return thread !== null;
}

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getRequestUser(request);
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const { id } = await context.params;
  if (!(await memberOf(id, user.id))) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const [thread, messages] = await Promise.all([
    prisma.conversation.findUnique({
      where: { id },
      include: { members: { select: { id: true, name: true, handle: true, role: true } } },
    }),
    prisma.message.findMany({ where: { conversationId: id }, orderBy: { createdAt: "asc" }, take: 200 }),
  ]);

  // Opening a thread is reading it.
  await prisma.message.updateMany({
    where: { conversationId: id, senderId: { not: user.id }, readAt: null },
    data: { readAt: new Date() },
  });

  const others = (thread?.members ?? []).filter((member) => member.id !== user.id);

  return NextResponse.json(
    {
      id,
      title: others.map((member) => member.name).join(", ") || "You",
      members: others,
      messages: messages.map((message) => ({
        id: message.id,
        body: message.body,
        mine: message.senderId === user.id,
        createdAt: message.createdAt.toISOString(),
      })),
    },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}

const sendSchema = z.object({ body: z.string().trim().min(1).max(2000) });

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getRequestUser(request);
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const { id } = await context.params;
  if (!(await memberOf(id, user.id))) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const parsed = sendSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "validation" }, { status: 422 });

  const [message] = await prisma.$transaction([
    prisma.message.create({ data: { conversationId: id, senderId: user.id, body: parsed.data.body } }),
    prisma.conversation.update({ where: { id }, data: { lastMessageAt: new Date() } }),
  ]);

  const others = await prisma.user.findMany({
    where: { memberships: { some: { id } }, NOT: { id: user.id } },
    select: { id: true },
  });
  if (others.length > 0) {
    await Promise.all(
      others.map((member) =>
        notify({
          userId: member.id,
          kind: "message",
          title: `${user.name} messaged you`,
          body: parsed.data.body.slice(0, 120),
          path: `/thread/${id}`,
        }),
      ),
    );
  }

  return NextResponse.json(
    { id: message.id, body: message.body, mine: true, createdAt: message.createdAt.toISOString() },
    { status: 201 },
  );
}
