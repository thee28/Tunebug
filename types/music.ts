export type NoteName = "C" | "C#" | "D" | "D#" | "E" | "F" | "F#" | "G" | "G#" | "A" | "A#" | "B";

export interface PitchResult {
  frequency: number;
  note: string;      // e.g. "C4"
  noteName: NoteName;
  octave: number;
  cents: number;     // deviation from perfect pitch, -50 to +50
  confidence: number; // 0-1
}

export interface Note {
  name: NoteName;
  octave: number;
  frequency: number;
  vexKey: string;    // e.g. "c/4"
}

export type IntervalName =
  | "Unison"
  | "Minor 2nd"
  | "Major 2nd"
  | "Minor 3rd"
  | "Major 3rd"
  | "Perfect 4th"
  | "Tritone"
  | "Perfect 5th"
  | "Minor 6th"
  | "Major 6th"
  | "Minor 7th"
  | "Major 7th"
  | "Octave";

export type ExerciseType =
  | "PITCH_MATCH"
  | "SIGHT_READ_PIANO"
  | "EAR_SINGLE"
  | "EAR_MULTI"
  | "INTERVAL_ID"
  | "NOTE_VALUE_ID"
  | "SAME_DIFFERENT"
  | "HIGHER_LOWER"
  | "ODD_ONE_OUT"
  | "FREE_PICK_KEYBOARD";

export type NoteSymbol =
  | "whole_note"
  | "half_note"
  | "quarter_note"
  | "eighth_note"
  | "whole_rest"
  | "half_rest"
  | "quarter_rest";

export interface NoteValueConfig {
  symbol: NoteSymbol;
  question: string;
  choices: string[];
  correctAnswer: string;
}

// exerciseConfig shapes per type
export interface PitchMatchConfig {
  targetNote: string;       // e.g. "C4"
  displayNote: string;      // e.g. "C"
  confidenceThreshold: number;
  timeoutSeconds: number;
}

export interface SightReadPianoConfig {
  targetNote: string;       // e.g. "E4"
  vexKey: string;           // e.g. "e/4"
  octaveRange: [number, number];
}

export interface EarSingleConfig {
  targetNote: string;
  choices: string[];        // note names
  correctAnswer: string;
}

export interface EarMultiConfig {
  targetNotes: string[];
  choices: string[];
  correctAnswers: string[];
}

export interface IntervalIdConfig {
  noteA: string;
  noteB: string;
  choices: IntervalName[];
  correctAnswer: IntervalName;
}

export interface SameDifferentConfig {
  noteA: string;
  noteB: string;
  correctAnswer: "Same" | "Different";
}

export interface HigherLowerConfig {
  noteA: string;
  noteB: string;
  correctAnswer: "Higher" | "Lower";
}

export interface OddOneOutConfig {
  notes: string[];     // 3 notes; two identical, one different
  oddIndex: number;    // position of the odd note
}

export interface FreePickKeyboardConfig {
  targetNote: string;
  octaveRange: [number, number];
}

export type ExerciseConfig =
  | PitchMatchConfig
  | SightReadPianoConfig
  | EarSingleConfig
  | EarMultiConfig
  | IntervalIdConfig
  | NoteValueConfig
  | SameDifferentConfig
  | HigherLowerConfig
  | OddOneOutConfig
  | FreePickKeyboardConfig;
