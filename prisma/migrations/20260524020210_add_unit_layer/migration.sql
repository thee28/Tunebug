/*
  Warnings:

  - You are about to drop the column `stageId` on the `Lesson` table. All the data in the column will be lost.
  - Added the required column `unitId` to the `Lesson` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Lesson" DROP CONSTRAINT "Lesson_stageId_fkey";

-- DropIndex
DROP INDEX "Lesson_stageId_order_idx";

-- AlterTable
ALTER TABLE "Lesson" DROP COLUMN "stageId",
ADD COLUMN     "unitId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "Unit" (
    "id" TEXT NOT NULL,
    "stageId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Unit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Unit_slug_key" ON "Unit"("slug");

-- CreateIndex
CREATE INDEX "Unit_stageId_order_idx" ON "Unit"("stageId", "order");

-- CreateIndex
CREATE INDEX "Lesson_unitId_order_idx" ON "Lesson"("unitId", "order");

-- AddForeignKey
ALTER TABLE "Unit" ADD CONSTRAINT "Unit_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "Stage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lesson" ADD CONSTRAINT "Lesson_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
