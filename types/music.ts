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
  | "FREE_PICK_KEYBOARD"
  | "COUNT_BEATS"
  | "SAME_DIFFERENT_RHYTHM"
  | "FILL_BLANK_RHYTHM"
  | "BUILD_RHYTHM"
  | "TAP_ALONG"
  | "NAME_IT"
  | "TRUE_FALSE"
  | "ERROR_SPOTTING"
  | "MATCHING_PAIRS"
  | "SEQUENCE_RECALL";

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

export interface CountBeatsConfig {
  symbol: NoteSymbol;
  correctBeats: number;
  choices: number[];
}

export interface SameDifferentRhythmConfig {
  patternA: NoteSymbol[];
  patternB: NoteSymbol[];
  correctAnswer: "Same" | "Different";
}

export interface FillBlankRhythmConfig {
  pattern: NoteSymbol[];     // full pattern (the answer's location is highlighted)
  blankIndex: number;
  choices: NoteSymbol[];
  correctAnswer: NoteSymbol;
}

export interface BuildRhythmConfig {
  targetBeats: number;       // total beats the user must reach
  palette: NoteSymbol[];     // available icons
}

export interface TapAlongConfig {
  pattern: NoteSymbol[];     // beat durations to tap along
  bpm: number;
  toleranceMs: number;       // tap-window radius
}

// Show notation cue, user picks the letter name from buttons (no audio).
export interface NameItConfig {
  targetNote: string;        // e.g. "E4"
  vexKey: string;            // e.g. "e/4"
  choices: string[];         // note-letter options ("C", "D", ...)
  correctAnswer: string;     // letter name only
}

// Generic claim/T-F. audioNote, if set, plays before the claim is shown.
export interface TrueFalseConfig {
  prompt: string;            // e.g. "Listen and answer"
  claim: string;             // e.g. "The note you just heard is a D"
  audioNote?: string;        // e.g. "C4" — optional playback
  correctAnswer: boolean;    // is the claim true?
}

// Show staff with a (possibly wrong) label; user marks correct/wrong.
// If wrong they pick the actual letter name from the choices.
export interface ErrorSpottingConfig {
  shownLabel: string;        // the displayed letter (e.g. "F")
  actualNote: string;        // the actual note shown on staff (e.g. "E4")
  vexKey: string;
  choices: string[];         // letter-name options for the "what is it actually" follow-up
}

// Memory grid — tiles are face-down note slots. Tap to play a note.
// Match two with the same note to lock them in.
export interface MatchingPairsConfig {
  notes: string[];           // unique notes in this round (pairs derived)
}

// Play a sequence of notes; user must tap the same notes in order on the keyboard.
export interface SequenceRecallConfig {
  sequence: string[];        // note names with octave
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
  | FreePickKeyboardConfig
  | CountBeatsConfig
  | SameDifferentRhythmConfig
  | FillBlankRhythmConfig
  | BuildRhythmConfig
  | TapAlongConfig
  | NameItConfig
  | TrueFalseConfig
  | ErrorSpottingConfig
  | MatchingPairsConfig
  | SequenceRecallConfig;
