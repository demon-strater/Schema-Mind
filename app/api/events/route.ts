import { db } from "@/lib/db";
import { eventInputSchema } from "@/lib/study/events";
import type { Prisma } from "@prisma/client";
export async function POST(request: Request) {
  const parsed = eventInputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "invalid_event", details: parsed.error.flatten() }, { status: 400 });
  const event = parsed.data;
  const participant = await db.participant.findUnique({ where: { id: event.participantId } });
  if (!participant || participant.condition !== event.condition) return Response.json({ error: "condition_mismatch" }, { status: 403 });
  const session = await db.studySession.findUnique({ where: { participantId_sessionDay: { participantId: event.participantId, sessionDay: event.sessionDay } } });
  if (!session) return Response.json({ error: "session_not_found" }, { status: 404 });
  const payload = JSON.parse(JSON.stringify(event.payload)) as Prisma.InputJsonValue;
  await db.studyEvent.create({ data: { ...event, payload, sessionId: session.id } });
  if (event.type === "task_end") {
    const completedAt = new Date();
    await db.studySession.update({ where: { id: session.id }, data: { completedAt } });
    await db.participant.update({ where: { id: event.participantId }, data: event.sessionDay === 1 ? { day1CompletedAt: completedAt } : { day8CompletedAt: completedAt } });
  }
  return Response.json({ accepted: true }, { status: 201 });
}
