-- Run this on the VPS database, then run: npx prisma generate
ALTER TABLE "Attachment"
  ADD COLUMN IF NOT EXISTS "review" TEXT,
  ADD COLUMN IF NOT EXISTS "reviewedAt" TIMESTAMP(3);
