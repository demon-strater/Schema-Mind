import { PrismaClient } from "@prisma/client";
import { EVENT_TYPES } from "../lib/study/events";
const prisma = new PrismaClient();
async function main(): Promise<void> {
  const fixtures = [{ id: "study-c", condition: "C" }, { id: "study-a", condition: "A" }, { id: "study-at", condition: "A-timed" }, { id: "study-f", condition: "F" }, { id: "demo", condition: "F" }];
  for (const [index, fixture] of fixtures.entries()) {
    await prisma.participant.upsert({ where: { id: fixture.id }, update: { condition: fixture.condition }, create: { ...fixture, assignmentBlock: index } });
    await prisma.studySession.upsert({ where: { participantId_sessionDay: { participantId: fixture.id, sessionDay: 1 } }, update: {}, create: { participantId: fixture.id, sessionDay: 1, accessTokenHash: `seed-token-${fixture.id}`, startedAt: new Date() } });
  }
  const session = await prisma.studySession.findUniqueOrThrow({ where: { participantId_sessionDay: { participantId: "study-f", sessionDay: 1 } } });
  for (const [index, type] of EVENT_TYPES.entries()) {
    await prisma.studyEvent.upsert({ where: { id: `seed-event-${type}` }, update: {}, create: { id: `seed-event-${type}`, participantId: "study-f", sessionId: session.id, condition: "F", sessionDay: 1, type, payload: { seeded: true, durationMs: 1000, depth: Math.min(5, index + 1), nodeId: `node-${index}` }, clientTs: index * 100 } });
  }
  console.info(`Seeded ${fixtures.length} participants and ${EVENT_TYPES.length} event fixtures.`);
}
main().finally(() => prisma.$disconnect());
