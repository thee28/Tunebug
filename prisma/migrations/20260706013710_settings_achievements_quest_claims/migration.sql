-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AchievementType" ADD VALUE 'XP_250';
ALTER TYPE "AchievementType" ADD VALUE 'XP_1000';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "personalizedRecs" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "publicProfile" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "QuestClaim" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "questId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "xpAwarded" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuestClaim_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "QuestClaim_userId_date_idx" ON "QuestClaim"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "QuestClaim_userId_questId_date_key" ON "QuestClaim"("userId", "questId", "date");

-- AddForeignKey
ALTER TABLE "QuestClaim" ADD CONSTRAINT "QuestClaim_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
