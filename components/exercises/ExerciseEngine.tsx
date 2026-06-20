"use client";

import type {
  ExerciseType,
  ExerciseConfig,
  PitchMatchConfig,
  SightReadPianoConfig,
  EarSingleConfig,
  EarMultiConfig,
  IntervalIdConfig,
  NoteValueConfig,
} from "@/types/music";
import type { Difficulty } from "@/lib/curriculum/content";
import { EarSingleExercise } from "./EarSingleExercise";
import { EarMultiExercise } from "./EarMultiExercise";
import { IntervalIdExercise } from "./IntervalIdExercise";
import { PitchMatchExercise } from "./PitchMatchExercise";
import { SightReadExercise } from "./SightReadExercise";
import { NoteValueExercise } from "./NoteValueExercise";

export interface ExerciseResult {
  score: number;
  passed: boolean;
  correctAnswerText?: string;
}

interface Props {
  type: ExerciseType;
  config: ExerciseConfig;
  difficulty: Difficulty;
  submitted: boolean;
  onAnswerChange: (hasAnswer: boolean) => void;
  onComplete: (result: ExerciseResult) => void;
}

export function ExerciseEngine({ type, config, difficulty, submitted, onAnswerChange, onComplete }: Props) {
  const shared = { difficulty, submitted, onAnswerChange, onComplete };

  switch (type) {
    case "EAR_SINGLE":
      return <EarSingleExercise config={config as EarSingleConfig} {...shared} />;
    case "EAR_MULTI":
      return <EarMultiExercise config={config as EarMultiConfig} {...shared} />;
    case "INTERVAL_ID":
      return <IntervalIdExercise config={config as IntervalIdConfig} {...shared} />;
    case "PITCH_MATCH":
      return <PitchMatchExercise config={config as PitchMatchConfig} {...shared} />;
    case "SIGHT_READ_PIANO":
      return <SightReadExercise config={config as SightReadPianoConfig} {...shared} />;
    case "NOTE_VALUE_ID":
      return <NoteValueExercise config={config as NoteValueConfig} {...shared} />;
    default:
      return <div style={{ color: "var(--c-muted)" }}>Unknown exercise type</div>;
  }
}
