import { NextResponse } from "next/server";
import { z } from "zod";
import { getRequestUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

/** Every thread this member is in, most recently active first. */
export async function GET(request: Request) {
  const user = await getRequestUser(request);
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const conversations = await prisma.conversation.findMany({
    where: { members: { some: { id: user.id } } },
    orderBy: { lastMessageAt: "desc" },
    take: 50,
    include: {
      members: { select: { id: true, name: true, handle: true, role: true } },
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  return NextResponse.json(
    {
      conversations: conversations.map((thread) => {
        const others = thread.members.filter((member) => member.id !== user.id);
        const last = thread.messages[0];
        return {
          id: thread.id,
          // A thread is named by whoever else is in it, which is what people
          // actually scan for.
          title: others.map((member) => member.name).join(", ") || "You",
          members: others,
          lastMessage: last
            ? { body: last.body, createdAt: last.createdAt.toISOString(), mine: last.senderId === user.id }
            : null,
          unread: last ? last.senderId !== user.id && last.readAt === null : false,
          lastMessageAt: thread.lastMessageAt.toISOString(),
        };
      }),
    },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}

const startSchema = z.object({
  /** Handle or id of the person to talk to. */
  to: z.string().trim().min(1).max(64),
  body: z.string().trim().min(1).max(2000).optional(),
});

/** Opens a thread with someone, reusing the existing one if there is one. */
export async function POST(request: Request) {
  const user = await getRequestUser(request);
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = startSchema.safeParse(raw);
  if (!parsed.success) return NextResponse.json({ error: "validation" }, { status: 422 });

  const target = await prisma.user.findFirst({
    where: { OR: [{ handle: parsed.data.to }, { id: parsed.data.to }] },
    select: { id: true, name: true },
  });
  if (!target) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (target.id === user.id) return NextResponse.json({ error: "cannot_message_self" }, { status: 409 });

  // Two members, both present — an existing pair thread rather than a new one
  // every time someone taps Message.
  const existing = await prisma.conversation.findFirst({
    where: { AND: [{ members: { some: { id: user.id } } }, { members: { some: { id: target.id } } }] },
    select: { id: true },
  });

  const conversation =
    existing ??
    (await prisma.conversation.create({
      data: { members: { connect: [{ id: user.id }, { id: target.id }] } },
      select: { id: true },
    }));

  if (parsed.data.body) {
    await prisma.$transaction([
      prisma.message.create({
        data: { conversationId: conversation.id, senderId: user.id, body: parsed.data.body },
      }),
      prisma.conversation.update({ where: { id: conversation.id }, data: { lastMessageAt: new Date() } }),
      prisma.notification.create({
        data: {
          userId: target.id,
          kind: "message",
          title: `${user.name} messaged you`,
          body: parsed.data.body.slice(0, 120),
        },
      }),
    ]);
  }

  return NextResponse.json({ id: conversation.id }, { status: existing ? 200 : 201 });
}
