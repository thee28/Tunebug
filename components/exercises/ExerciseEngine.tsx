"use client";

import type {
  ExerciseType,
  ExerciseConfig,
  PitchMatchConfig,
  SightReadPianoConfig,
  EarSingleConfig,
  EarMultiConfig,
  IntervalIdConfig,
} from "@/types/music";
import type { Difficulty } from "@/lib/curriculum/content";
import { EarSingleExercise } from "./EarSingleExercise";
import { EarMultiExercise } from "./EarMultiExercise";
import { IntervalIdExercise } from "./IntervalIdExercise";
import { PitchMatchExercise } from "./PitchMatchExercise";
import { SightReadExercise } from "./SightReadExercise";

export interface ExerciseResult {
  score: number;   // 0–100
  passed: boolean;
}

interface Props {
  type: ExerciseType;
  config: ExerciseConfig;
  difficulty: Difficulty;
  onComplete: (result: ExerciseResult) => void;
}

export function ExerciseEngine({ type, config, difficulty, onComplete }: Props) {
  const shared = { difficulty, onComplete };

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
    default:
      return <div style={{ color: "#938F99" }}>Unknown exercise type</div>;
  }
}
