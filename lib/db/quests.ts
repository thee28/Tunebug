import { prisma } from "@/lib/prisma";
import { startOfDayUTC } from "@/lib/utils";

export interface QuestProgress {
  xpToday: number;
  lessonsToday: number;
  highScoreToday: number;
}

/** Quest ids the user has already claimed rewards for today (UTC). */
export async function getTodayClaimedQuestIds(userId: string): Promise<string[]> {
  const today = startOfDayUTC(new Date());
  const claims = await prisma.questClaim.findMany({
    where: { userId, date: today },
    select: { questId: true },
  });
  return claims.map((c) => c.questId);
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
