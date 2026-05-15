import type { ExerciseType, ExerciseConfig } from "./music";

export type StageStatus = "locked" | "available" | "complete";

export interface Stage {
  id: string;
  slug: string;
  title: string;
  description: string;
  order: number;
  icon: string | null;
  lessons: Lesson[];
  status?: StageStatus;
  completedLessons?: number;
}

export interface Lesson {
  id: string;
  stageId: string;
  slug: string;
  title: string;
  order: number;
  exerciseType: ExerciseType;
  exerciseConfig: ExerciseConfig;
  passingScore: number;
  xpReward: number;
  unlocked?: boolean;
  passed?: boolean;
  bestScore?: number;
}

export type Difficulty = "easy" | "medium" | "hard";
