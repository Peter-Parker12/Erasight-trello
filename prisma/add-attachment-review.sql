-- Run this on the VPS database, then run: npx prisma generate
ALTER TABLE "Attachment"
  ADD COLUMN IF NOT EXISTS "review" TEXT,
  ADD COLUMN IF NOT EXISTS "reviewedAt" TIMESTAMP(3);

CREATE TABLE IF NOT EXISTS "BoardAiConfig" (
  "id"           TEXT NOT NULL,
  "boardId"      TEXT NOT NULL,
  "reviewListId" TEXT,
  "enabled"      BOOLEAN NOT NULL DEFAULT true,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "BoardAiConfig_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "BoardAiConfig_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "Board"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "BoardAiConfig_boardId_key" ON "BoardAiConfig"("boardId");
