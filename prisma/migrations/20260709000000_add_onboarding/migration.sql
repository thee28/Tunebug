-- AlterTable
ALTER TABLE "User" ADD COLUMN     "dailyXpGoal" INTEGER NOT NULL DEFAULT 10,
ADD COLUMN     "skillLevel" TEXT,
ADD COLUMN     "onboardedAt" TIMESTAMP(3);

-- Existing users predate the placement survey; treat them as already onboarded
-- so they aren't bounced into /onboarding on their next visit.
UPDATE "User" SET "onboardedAt" = "createdAt" WHERE "onboardedAt" IS NULL;
