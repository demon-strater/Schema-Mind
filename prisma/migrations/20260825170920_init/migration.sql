-- CreateTable
CREATE TABLE "Participant" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "condition" TEXT NOT NULL,
    "assignmentBlock" INTEGER NOT NULL,
    "enrolledAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "day1CompletedAt" DATETIME,
    "day8CompletedAt" DATETIME,
    "droppedOutAt" DATETIME
);

-- CreateTable
CREATE TABLE "StudySession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "participantId" TEXT NOT NULL,
    "sessionDay" INTEGER NOT NULL,
    "accessTokenHash" TEXT NOT NULL,
    "startedAt" DATETIME,
    "completedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StudySession_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "Participant" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "StudyEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "participantId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "condition" TEXT NOT NULL,
    "sessionDay" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "clientTs" REAL NOT NULL,
    "serverTs" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StudyEvent_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "Participant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "StudyEvent_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "StudySession" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "KNode" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "label" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "layer" INTEGER NOT NULL,
    "scope" TEXT NOT NULL,
    "sourceUrl" TEXT,
    "sourceTitle" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "participantId" TEXT NOT NULL,
    CONSTRAINT "KNode_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "Participant" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "KEdge" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fromId" TEXT NOT NULL,
    "toId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "confidence" REAL NOT NULL,
    "proposedBy" TEXT NOT NULL,
    "confirmedAt" DATETIME,
    "participantId" TEXT NOT NULL,
    CONSTRAINT "KEdge_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "Participant" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "KEdge_fromId_fkey" FOREIGN KEY ("fromId") REFERENCES "KNode" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "KEdge_toId_fkey" FOREIGN KEY ("toId") REFERENCES "KNode" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UnanchoredItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nodeId" TEXT NOT NULL,
    "deferredAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reproposeAt" DATETIME NOT NULL,
    "resolvedAt" DATETIME,
    CONSTRAINT "UnanchoredItem_nodeId_fkey" FOREIGN KEY ("nodeId") REFERENCES "KNode" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LlmCache" (
    "key" TEXT NOT NULL PRIMARY KEY,
    "normalizedKey" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "promptVersion" TEXT NOT NULL,
    "response" JSONB NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "LlmUsage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "participantId" TEXT,
    "model" TEXT NOT NULL,
    "promptVersion" TEXT NOT NULL,
    "inputTokens" INTEGER NOT NULL,
    "outputTokens" INTEGER NOT NULL,
    "estimatedUsd" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LlmUsage_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "Participant" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AssessmentResponse" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "participantId" TEXT NOT NULL,
    "sessionDay" INTEGER NOT NULL,
    "instrument" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "response" JSONB NOT NULL,
    "score" REAL,
    "submittedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AssessmentResponse_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "Participant" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CitationClaim" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "participantId" TEXT NOT NULL,
    "claimText" TEXT NOT NULL,
    "sourceUrl" TEXT,
    "sourceTitle" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CitationClaim_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "Participant" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CitationRating" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "claimId" TEXT NOT NULL,
    "raterId" TEXT NOT NULL,
    "supports" BOOLEAN NOT NULL,
    "ratedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "supersedesId" TEXT,
    CONSTRAINT "CitationRating_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "CitationClaim" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Participant_condition_idx" ON "Participant"("condition");

-- CreateIndex
CREATE UNIQUE INDEX "StudySession_accessTokenHash_key" ON "StudySession"("accessTokenHash");

-- CreateIndex
CREATE UNIQUE INDEX "StudySession_participantId_sessionDay_key" ON "StudySession"("participantId", "sessionDay");

-- CreateIndex
CREATE INDEX "StudyEvent_participantId_serverTs_idx" ON "StudyEvent"("participantId", "serverTs");

-- CreateIndex
CREATE INDEX "StudyEvent_type_idx" ON "StudyEvent"("type");

-- CreateIndex
CREATE INDEX "KNode_participantId_scope_idx" ON "KNode"("participantId", "scope");

-- CreateIndex
CREATE INDEX "KEdge_participantId_state_idx" ON "KEdge"("participantId", "state");

-- CreateIndex
CREATE INDEX "KEdge_fromId_toId_idx" ON "KEdge"("fromId", "toId");

-- CreateIndex
CREATE INDEX "UnanchoredItem_reproposeAt_resolvedAt_idx" ON "UnanchoredItem"("reproposeAt", "resolvedAt");

-- CreateIndex
CREATE INDEX "LlmCache_normalizedKey_model_promptVersion_idx" ON "LlmCache"("normalizedKey", "model", "promptVersion");

-- CreateIndex
CREATE INDEX "LlmUsage_participantId_createdAt_idx" ON "LlmUsage"("participantId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "AssessmentResponse_participantId_sessionDay_instrument_itemId_key" ON "AssessmentResponse"("participantId", "sessionDay", "instrument", "itemId");

-- CreateIndex
CREATE INDEX "CitationClaim_participantId_idx" ON "CitationClaim"("participantId");

-- CreateIndex
CREATE INDEX "CitationRating_claimId_raterId_idx" ON "CitationRating"("claimId", "raterId");
