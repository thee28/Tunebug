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

  // Idempotent: flip any existing not-yet-passed rows to passed, and only
  // insert rows for lessons with no row at all. LessonProgress has no
  // (userId, lessonId) unique constraint, so a plain createMany over every
  // unpassed lesson would pile up duplicate rows on re-jumps/replays.
  const existing = await prisma.lessonProgress.findMany({
    where: { userId, lessonId: { in: priorIds } },
    select: { lessonId: true, passed: true },
  });
  const passedBefore = new Set(existing.filter((e) => e.passed).map((e) => e.lessonId));
  const hasRow = new Set(existing.map((e) => e.lessonId));

  const toFlip = priorIds.filter((id) => hasRow.has(id) && !passedBefore.has(id));
  const toCreate = priorIds.filter((id) => !hasRow.has(id));
  const newlyPassed = toFlip.length + toCreate.length;

  if (toFlip.length > 0) {
    await prisma.lessonProgress.updateMany({
      where: { userId, passed: false, lessonId: { in: toFlip } },
      data: { passed: true, score: 100 },
    });
  }
  if (toCreate.length > 0) {
    await prisma.lessonProgress.createMany({
      data: toCreate.map((lessonId) => ({
        userId,
        lessonId,
        score: 100,
        passed: true,
        attempts: 1,
        xpEarned: 0,
      })),
    });
  }
  if (newlyPassed > 0) {
    await updateStreak(userId);
  }

  // Non-fatal, same as the progress route.
  const unlocked = await syncAchievements(userId).catch(() => [] as string[]);

  return { skippedLessons: newlyPassed, unlockedAchievements: unlocked };
}
