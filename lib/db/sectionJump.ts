import { prisma } from "@/lib/prisma";
import { updateStreak } from "@/lib/db/streak";
import { syncAchievements } from "@/lib/db/achievements";

export interface SectionJumpResult {
  skippedLessons: number;
  unlockedAchievements: string[];
}

// Marks every lesson in the sections BEFORE `targetStageSlug` as passed so the
// normal unlock logic opens the target section. Skipped lessons grant no XP —
// jumping ahead (whether via the jump test or the placement survey) must not be
// an XP farm. Returns null if the target stage doesn't exist or is the first
// section (nothing to skip).
export async function unlockPriorSections(
  userId: string,
  targetStageSlug: string
): Promise<SectionJumpResult | null> {
  const target = await prisma.stage.findUnique({
    where: { slug: targetStageSlug },
    select: { id: true, order: true },
  });
  if (!target || target.order === 0) return null;

  const priorLessons = await prisma.lesson.findMany({
    where: { unit: { stage: { order: { lt: target.order } } } },
    select: { id: true },
  });
  const priorIds = priorLessons.map((l) => l.id);

  const alreadyPassed = await prisma.lessonProgress.findMany({
    where: { userId, passed: true, lessonId: { in: priorIds } },
    select: { lessonId: true },
  });
  const passedIds = new Set(alreadyPassed.map((p) => p.lessonId));
  const toMark = priorIds.filter((id) => !passedIds.has(id));

  if (toMark.length > 0) {
    await prisma.lessonProgress.createMany({
      data: toMark.map((lessonId) => ({
        userId,
        lessonId,
        score: 100,
        passed: true,
        attempts: 1,
        xpEarned: 0,
      })),
    });
    await updateStreak(userId);
  }

  // Non-fatal, same as the progress route.
  const unlocked = await syncAchievements(userId).catch(() => [] as string[]);

  return { skippedLessons: toMark.length, unlockedAchievements: unlocked };
}
