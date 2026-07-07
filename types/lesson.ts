import type { ExerciseType, ExerciseConfig, NoteSymbol } from "./music";

export type StageStatus = "locked" | "available" | "complete";

export type { Difficulty } from "@/lib/curriculum/content";

export interface TeachStep {
  kind: "teach";
  icon: string;
  title: string;
  body: string;
  playNote?: string;
  playNotes?: string[];
  playInterval?: [string, string];
  // When set, the slide shows the actual notation being introduced instead
  // of the generic icon: a rhythm symbol glyph, or a note on the staff.
  symbol?: NoteSymbol;
  vexKey?: string;
}

export interface ExerciseStep {
  kind: "exercise";
  type: ExerciseType;
  config: ExerciseConfig;
  // Tagged by the slot generator so the LessonRunner can record per-concept
  // mastery on every answer. Optional for backwards compatibility with any
  // call site that builds steps directly.
  conceptId?: string;
}

export type LessonStep = TeachStep | ExerciseStep;

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
