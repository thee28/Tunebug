import type { User, LessonProgress, DailyStreak, Achievement } from "@prisma/client";

export type UserPublic = Pick<User, "id" | "name" | "image" | "xp">;

export type ProgressRecord = Pick<
  LessonProgress,
  "id" | "lessonId" | "score" | "passed" | "attempts" | "xpEarned" | "completedAt"
>;

export type StreakData = Pick<
  DailyStreak,
  "currentStreak" | "longestStreak" | "lastActivityDate"
>;
