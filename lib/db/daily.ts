import { prisma } from "@/lib/prisma";
import { generateDailyExercises, dateSeed, difficultyFromCompletedStages } from "@/lib/curriculum/generator";
import type { Difficulty } from "@/lib/curriculum/content";
import type { ExerciseConfig, ExerciseType } from "@/types/music";

function utcDayStart(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

export interface DailyStageExercise {
  type: ExerciseType;
  config: ExerciseConfig;
}

export interface DailyStageData {
  id: string;
  date: Date;
  difficulty: Difficulty;
  exercises: DailyStageExercise[];
  completed: boolean;
  score: number | null;
  xpEarned: number;
}

export async function getTodaysDailyStage(userId: string): Promise<DailyStageData> {
  const today = utcDayStart(new Date());

  const existing = await prisma.dailyStage.findUnique({
    where: { userId_date: { userId, date: today } },
  });

  if (existing) {
    return {
      id: existing.id,
      date: existing.date,
      difficulty: existing.difficulty as Difficulty,
      exercises: existing.exercises as unknown as DailyStageExercise[],
      completed: existing.completed,
      score: existing.score,
      xpEarned: existing.xpEarned,
    };
  }

  const [stages, passedRows] = await Promise.all([
    prisma.stage.findMany({ include: { lessons: { select: { id: true } } } }),
    prisma.lessonProgress.findMany({
      where: { userId, passed: true },
      select: { lessonId: true },
    }),
  ]);
  const passedIds = new Set(passedRows.map((r) => r.lessonId));
  const completedStageCount = stages.filter((s) =>
    s.lessons.every((l) => passedIds.has(l.id))
  ).length;

  const difficulty = difficultyFromCompletedStages(completedStageCount);
  const seed = dateSeed(today);
  const exercises = generateDailyExercises(difficulty, seed);

  const created = await prisma.dailyStage.create({
    data: { userId, date: today, difficulty, exercises: exercises as never },
  });

  return {
    id: created.id,
    date: created.date,
    difficulty,
    exercises,
    completed: false,
    score: null,
    xpEarned: 0,
  };
}

export async function completeDailyStage(
  id: string,
  userId: string,
  score: number
): Promise<{ xpEarned: number }> {
  const stage = await prisma.dailyStage.findUnique({ where: { id } });
  if (!stage || stage.userId !== userId) throw new Error("Not found");
  if (stage.completed) return { xpEarned: stage.xpEarned };

  const xpEarned = score >= 70 ? 25 : 10;

  await prisma.$transaction([
    prisma.dailyStage.update({ where: { id }, data: { completed: true, score, xpEarned } }),
    prisma.user.update({ where: { id: userId }, data: { xp: { increment: xpEarned } } }),
  ]);

  return { xpEarned };
}
