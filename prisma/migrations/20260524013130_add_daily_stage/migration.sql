-- CreateTable
CREATE TABLE "DailyStage" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "difficulty" TEXT NOT NULL,
    "exercises" JSONB NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "score" INTEGER,
    "xpEarned" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DailyStage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DailyStage_userId_date_idx" ON "DailyStage"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "DailyStage_userId_date_key" ON "DailyStage"("userId", "date");

-- AddForeignKey
ALTER TABLE "DailyStage" ADD CONSTRAINT "DailyStage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
