import { prisma } from "@/lib/prisma";
import type { ConceptMastery } from "@prisma/client";

// EMA weight for the new sample. Higher = react faster to recent answers.
const MASTERY_EMA_ALPHA = 0.3;
// SM-2-ish interval growth on a correct answer.
const INTERVAL_GROWTH = 2.5;
const INTERVAL_MIN_DAYS = 1;
const INTERVAL_MAX_DAYS = 60;
// Floor mastery decay when wrong (don't reset to 0 — it's noisy).
const WRONG_MASTERY_FLOOR = 0.0;

export interface MasteryUpdate {
  userId: string;
  conceptId: string;
  isCorrect: boolean;
  lessonSlug?: string;
}

export async function recordAnswer({ userId, conceptId, isCorrect, lessonSlug }: MasteryUpdate): Promise<ConceptMastery> {
  const existing = await prisma.conceptMastery.findUnique({
    where: { userId_conceptId: { userId, conceptId } },
  });

  const now = new Date();
  const prevScore = existing?.masteryScore ?? 0;
  const prevInterval = existing?.reviewIntervalDays ?? INTERVAL_MIN_DAYS;
  const prevStreak = existing?.currentStreak ?? 0;
  const sample = isCorrect ? 1 : 0;

  const newScore = isCorrect
    ? MASTERY_EMA_ALPHA * 1 + (1 - MASTERY_EMA_ALPHA) * prevScore
    : Math.max(WRONG_MASTERY_FLOOR, MASTERY_EMA_ALPHA * 0 + (1 - MASTERY_EMA_ALPHA) * prevScore);

  const newStreak = isCorrect ? prevStreak + 1 : 0;
  const newInterval = isCorrect
    ? Math.min(INTERVAL_MAX_DAYS, prevInterval * INTERVAL_GROWTH)
    : INTERVAL_MIN_DAYS;
  const nextReviewAt = new Date(now.getTime() + newInterval * 24 * 60 * 60 * 1000);

  return prisma.conceptMastery.upsert({
    where: { userId_conceptId: { userId, conceptId } },
    create: {
      userId,
      conceptId,
      timesSeen: 1,
      timesCorrect: sample,
      currentStreak: newStreak,
      lastSeenAt: now,
      lastSeenLessonSlug: lessonSlug ?? null,
      reviewIntervalDays: newInterval,
      nextReviewAt,
      masteryScore: newScore,
    },
    update: {
      timesSeen: { increment: 1 },
      timesCorrect: { increment: sample },
      currentStreak: newStreak,
      lastSeenAt: now,
      lastSeenLessonSlug: lessonSlug ?? null,
      reviewIntervalDays: newInterval,
      nextReviewAt,
      masteryScore: newScore,
    },
  });
}

export async function getMasteryMap(userId: string): Promise<Map<string, ConceptMastery>> {
  const rows = await prisma.conceptMastery.findMany({ where: { userId } });
  return new Map(rows.map((r) => [r.conceptId, r]));
}

// Concepts the user has been seen for but whose nextReviewAt is in the past.
export async function getDueConcepts(userId: string, asOf: Date = new Date()): Promise<ConceptMastery[]> {
  return prisma.conceptMastery.findMany({
    where: { userId, nextReviewAt: { lte: asOf } },
    orderBy: [{ masteryScore: "asc" }, { nextReviewAt: "asc" }],
  });
}
