import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function saveProgress({
  userId,
  lessonId,
  score,
  passed,
  xpReward,
}: {
  userId: string;
  lessonId: string;
  score: number;
  passed: boolean;
  xpReward: number;
}) {
  // Serializable so two concurrent submissions can't both see "never passed"
  // and each grant first-pass XP. On serialization conflict, retry once.
  const run = () =>
    prisma.$transaction(
      async (tx) => {
        const [attemptsSoFar, everPassed] = await Promise.all([
          tx.lessonProgress.count({ where: { userId, lessonId } }),
          tx.lessonProgress.findFirst({
            where: { userId, lessonId, passed: true },
            select: { id: true },
          }),
        ]);

        const xpEarned = passed && !everPassed ? xpReward : 0;

        const progress = await tx.lessonProgress.create({
          data: {
            userId,
            lessonId,
            score,
            passed,
            attempts: attemptsSoFar + 1,
            xpEarned,
          },
        });

        if (xpEarned > 0) {
          await tx.user.update({
            where: { id: userId },
            data: { xp: { increment: xpEarned } },
          });
        }

        return { progress, xpEarned };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
    );

  try {
    return await run();
  } catch (e) {
    // P2034 = transaction failed due to serialization conflict — safe to retry.
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2034") {
      return run();
    }
    throw e;
  }
}

export async function getUserProgress(userId: string) {
  return prisma.lessonProgress.findMany({
    where: { userId },
    orderBy: { completedAt: "desc" },
    select: {
      lessonId: true,
      score: true,
      passed: true,
      attempts: true,
      xpEarned: true,
      completedAt: true,
    },
  });
}
