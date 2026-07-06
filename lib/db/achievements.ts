import { prisma } from "@/lib/prisma";
import {
  ACHIEVEMENT_DEFS,
  earnedTypes,
  type AchievementStats,
  type AchievementView,
} from "@/lib/achievements";

async function collectStats(userId: string): Promise<AchievementStats> {
  const [user, passedLessons, perfect, streak, stageRows, passedIds] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { xp: true } }),
    prisma.lessonProgress.count({ where: { userId, passed: true } }),
    prisma.lessonProgress.findFirst({ where: { userId, score: 100 }, select: { id: true } }),
    prisma.dailyStreak.findUnique({ where: { userId } }),
    prisma.stage.findMany({
      select: { id: true, units: { select: { lessons: { select: { id: true } } } } },
    }),
    prisma.lessonProgress.findMany({
      where: { userId, passed: true },
      select: { lessonId: true },
      distinct: ["lessonId"],
    }),
  ]);

  const passed = new Set(passedIds.map((p) => p.lessonId));
  const stageLessonIds = stageRows.map((s) => s.units.flatMap((u) => u.lessons.map((l) => l.id)));
  const completedStages = stageLessonIds.filter(
    (ids) => ids.length > 0 && ids.every((id) => passed.has(id))
  ).length;

  return {
    passedLessons,
    hasPerfectScore: !!perfect,
    longestStreak: streak?.longestStreak ?? 0,
    totalXP: user?.xp ?? 0,
    completedStages,
    totalStages: stageRows.length,
  };
}

/**
 * Recompute the user's stats and persist any newly earned achievements.
 * Idempotent — the (userId, type) unique constraint plus skipDuplicates makes
 * concurrent calls safe. Returns the types unlocked by this call.
 */
export async function syncAchievements(userId: string): Promise<string[]> {
  const stats = await collectStats(userId);
  const earned = earnedTypes(stats);
  if (earned.length === 0) return [];

  const existing = await prisma.achievement.findMany({
    where: { userId, type: { in: earned } },
    select: { type: true },
  });
  const have = new Set(existing.map((a) => a.type));
  const missing = earned.filter((t) => !have.has(t));
  if (missing.length === 0) return [];

  await prisma.achievement.createMany({
    data: missing.map((type) => ({ userId, type })),
    skipDuplicates: true,
  });
  return missing;
}

/** Full achievement list with live progress + unlock timestamps, for the profile page. */
export async function getAchievementViews(userId: string): Promise<AchievementView[]> {
  const [stats, unlocked] = await Promise.all([
    collectStats(userId),
    prisma.achievement.findMany({ where: { userId }, select: { type: true, unlockedAt: true } }),
  ]);
  const unlockedAt = new Map(unlocked.map((a) => [a.type, a.unlockedAt]));

  return ACHIEVEMENT_DEFS.map((d) => ({
    type: d.type,
    name: d.name,
    description: d.description,
    icon: d.icon,
    iconBg: d.iconBg,
    iconColor: d.iconColor,
    goal: d.goal,
    current: d.current(stats),
    unlockedAt: unlockedAt.get(d.type)?.toISOString() ?? null,
  }));
}
