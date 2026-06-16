import { prisma } from "@/lib/prisma";

export interface QuestProgress {
  xpToday: number;
  lessonsToday: number;
  highScoreToday: number;
}

export async function getTodayQuestProgress(userId: string): Promise<QuestProgress> {
  const todayUtc = new Date();
  todayUtc.setUTCHours(0, 0, 0, 0);

  const rows = await prisma.lessonProgress.findMany({
    where: { userId, completedAt: { gte: todayUtc } },
    select: { xpEarned: true, passed: true, score: true, lessonId: true },
  });

  const xpToday = rows.reduce((sum, r) => sum + r.xpEarned, 0);
  const passedLessonIds = new Set(rows.filter(r => r.passed).map(r => r.lessonId));
  const lessonsToday = passedLessonIds.size;
  const highScoreToday = rows.some(r => r.score >= 80) ? 1 : 0;

  return { xpToday, lessonsToday, highScoreToday };
}
