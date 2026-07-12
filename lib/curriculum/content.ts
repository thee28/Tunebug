import type { IntervalName } from "@/types/music";

export type Difficulty = "beginner" | "intermediate" | "advanced";

export interface DifficultySettings {
  allowedDeviation: number;
  holdDuration: number;
  confidenceThreshold: number;
  timeoutSeconds: number;
  choiceCount: number;
}

export const DIFFICULTY_SETTINGS: Record<Difficulty, DifficultySettings> = {
  beginner: {
    allowedDeviation: 45,
    holdDuration: 1,
    confidenceThreshold: 0.80,
    timeoutSeconds: 12,
    choiceCount: 4,
  },
  intermediate: {
    allowedDeviation: 30,
    holdDuration: 2,
    confidenceThreshold: 0.85,
    timeoutSeconds: 12,
    choiceCount: 4,
  },
  advanced: {
    allowedDeviation: 20,
    holdDuration: 3,
    confidenceThreshold: 0.88,
    timeoutSeconds: 14,
    choiceCount: 6,
  },
};

export const NOTE_POOLS: Record<Difficulty, string[]> = {
  beginner: ["C4", "D4", "E4", "F4", "G4", "A4", "B4"],
  intermediate: [
    "C4", "D4", "E4", "F4", "G4", "A4", "B4",
    "C#4", "D#4", "F#4", "G#4", "A#4",
    "C5", "D5", "E5",
  ],
  advanced: [
    "C3", "D3", "E3", "F3", "G3", "A3", "B3",
    "C4", "D4", "E4", "F4", "G4", "A4", "B4",
    "C#4", "D#4", "F#4", "G#4", "A#4",
    "C5", "D5", "E5", "F5", "G5", "A5",
  ],
};

export const INTERVAL_POOLS: Record<Difficulty, IntervalName[]> = {
  beginner: ["Perfect 4th", "Perfect 5th", "Octave"],
  intermediate: [
    "Major 3rd", "Perfect 4th", "Perfect 5th", "Major 6th", "Octave",
  ],
  advanced: [
    "Minor 2nd", "Major 2nd", "Minor 3rd", "Major 3rd",
    "Perfect 4th", "Tritone", "Perfect 5th",
    "Minor 6th", "Major 6th", "Minor 7th", "Major 7th", "Octave",
  ],
};

export const NOTE_NAMES_BY_DIFFICULTY: Record<Difficulty, string[]> = {
  beginner: ["C", "D", "E", "F", "G", "A", "B"],
  intermediate: ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"],
  advanced: ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"],
};

export function noteToDisplayName(note: string): string {
  return note.replace(/\d$/, "");
}

export function noteToVexKey(note: string): string {
  const match = note.match(/^([A-G]#?)(\d)$/);
  if (!match) return note;
  return `${match[1].toLowerCase()}/${match[2]}`;
}
