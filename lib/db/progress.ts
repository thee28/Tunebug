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
  const existing = await prisma.lessonProgress.findFirst({
    where: { userId, lessonId },
    orderBy: { completedAt: "desc" },
  });

  const alreadyPassed = existing?.passed ?? false;
  const xpEarned = passed && !alreadyPassed ? xpReward : 0;

  const [progress] = await prisma.$transaction([
    prisma.lessonProgress.create({
      data: {
        userId,
        lessonId,
        score,
        passed,
        attempts: (existing?.attempts ?? 0) + 1,
        xpEarned,
      },
    }),
    ...(xpEarned > 0
      ? [prisma.user.update({ where: { id: userId }, data: { xp: { increment: xpEarned } } })]
      : []),
  ]);

  return { progress, xpEarned };
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
