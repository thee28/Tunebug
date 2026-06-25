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
  SameDifferentConfig,
  HigherLowerConfig,
  OddOneOutConfig,
  FreePickKeyboardConfig,
  CountBeatsConfig,
  SameDifferentRhythmConfig,
  FillBlankRhythmConfig,
  BuildRhythmConfig,
  TapAlongConfig,
} from "@/types/music";
import type { Difficulty } from "@/lib/curriculum/content";
import { EarSingleExercise } from "./EarSingleExercise";
import { EarMultiExercise } from "./EarMultiExercise";
import { IntervalIdExercise } from "./IntervalIdExercise";
import { PitchMatchExercise } from "./PitchMatchExercise";
import { SightReadExercise } from "./SightReadExercise";
import { NoteValueExercise } from "./NoteValueExercise";
import { SameDifferentExercise } from "./SameDifferentExercise";
import { HigherLowerExercise } from "./HigherLowerExercise";
import { OddOneOutExercise } from "./OddOneOutExercise";
import { FreePickKeyboardExercise } from "./FreePickKeyboardExercise";
import { CountBeatsExercise } from "./CountBeatsExercise";
import { SameDifferentRhythmExercise } from "./SameDifferentRhythmExercise";
import { FillBlankRhythmExercise } from "./FillBlankRhythmExercise";
import { BuildRhythmExercise } from "./BuildRhythmExercise";
import { TapAlongExercise } from "./TapAlongExercise";

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
    case "SAME_DIFFERENT":
      return <SameDifferentExercise config={config as SameDifferentConfig} {...shared} />;
    case "HIGHER_LOWER":
      return <HigherLowerExercise config={config as HigherLowerConfig} {...shared} />;
    case "ODD_ONE_OUT":
      return <OddOneOutExercise config={config as OddOneOutConfig} {...shared} />;
    case "FREE_PICK_KEYBOARD":
      return <FreePickKeyboardExercise config={config as FreePickKeyboardConfig} {...shared} />;
    case "COUNT_BEATS":
      return <CountBeatsExercise config={config as CountBeatsConfig} {...shared} />;
    case "SAME_DIFFERENT_RHYTHM":
      return <SameDifferentRhythmExercise config={config as SameDifferentRhythmConfig} {...shared} />;
    case "FILL_BLANK_RHYTHM":
      return <FillBlankRhythmExercise config={config as FillBlankRhythmConfig} {...shared} />;
    case "BUILD_RHYTHM":
      return <BuildRhythmExercise config={config as BuildRhythmConfig} {...shared} />;
    case "TAP_ALONG":
      return <TapAlongExercise config={config as TapAlongConfig} {...shared} />;
    default:
      return <div style={{ color: "var(--c-muted)" }}>Unknown exercise type</div>;
  }
}
