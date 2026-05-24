import type { ExerciseType, ExerciseConfig } from "./music";

export type StageStatus = "locked" | "available" | "complete";

export type { Difficulty } from "@/lib/curriculum/content";

export interface Lesson {
  id: string;
  unitId: string;
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

export interface Unit {
  id: string;
  stageId: string;
  slug: string;
  title: string;
  description?: string | null;
  order: number;
  lessons: Lesson[];
  completedLessons?: number;
  totalLessons?: number;
  status?: StageStatus;
}

export interface Stage {
  id: string;
  slug: string;
  title: string;
  description: string;
  order: number;
  icon: string | null;
  units: Unit[];
  status?: StageStatus;
  completedLessons?: number;
  totalLessons?: number;
}
