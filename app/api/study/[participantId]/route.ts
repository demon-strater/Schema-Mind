import { createHash } from "node:crypto";
import { db } from "@/lib/db";
import { deterministicCondition } from "@/lib/condition";
export async function GET(_request: Request, context: RouteContext<"/api/study/[participantId]">) {
  const { participantId } = await context.params;
  const condition = deterministicCondition(participantId);
  const participant = await db.participant.upsert({ where: { id: participantId }, update: {}, create: { id: participantId, condition, assignmentBlock: Math.abs(participantId.length % 45) } });
  const sessionDay = participant.day1CompletedAt && Date.now() - participant.day1CompletedAt.getTime() >= 7 * 86_400_000 ? 8 : 1;
  const token = createHash("sha256").update(`${participantId}:${sessionDay}:${process.env.SESSION_TOKEN_SECRET ?? "dev"}`).digest("hex");
  const session = await db.studySession.upsert({ where: { participantId_sessionDay: { participantId, sessionDay } }, update: { startedAt: new Date() }, create: { participantId, sessionDay, accessTokenHash: token, startedAt: new Date() } });
  return Response.json({ participantId, condition: participant.condition, sessionDay, sessionId: session.id });
}
