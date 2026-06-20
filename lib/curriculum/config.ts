import type { ExerciseType, ExerciseConfig } from "@/types/music";
import type { Difficulty } from "./content";

export interface CurriculumLesson {
  slug: string;
  title: string;
  order: number;
  exerciseType: ExerciseType;
  exerciseConfig: ExerciseConfig;
  secondaryExerciseConfig?: ExerciseConfig;
  consolidationConfigs?: ExerciseConfig[];
  reinforceWithPrior?: boolean; // intro primary note, then mix with consolidationConfigs pool
  passingScore: number;
  xpReward: number;
}

export interface CurriculumUnit {
  slug: string;
  title: string;
  description: string;
  order: number;
  lessons: CurriculumLesson[];
}

export interface CurriculumStage {
  slug: string;
  title: string;
  description: string;
  order: number;
  icon: string;
  difficulty: Difficulty;
  units: CurriculumUnit[];
}

export const CURRICULUM: CurriculumStage[] = [
  // ─────────────────────────────────────────
  // SECTION 1: BEGINNER
  // ─────────────────────────────────────────
  {
    slug: "beginner",
    title: "Beginner",
    description: "Your first steps in music — note names, basic singing, and reading the staff",
    order: 0,
    icon: "🌱",
    difficulty: "beginner",
    units: [
      {
        slug: "beg-note-names",
        title: "What Is a Note?",
        description: "Learn the first notes of the musical alphabet",
        order: 0,
        lessons: [
          {
            // Introduces C and D. Secondary keeps both in mix.
            slug: "beg-nn-1", title: "C and D", order: 0, exerciseType: "EAR_SINGLE",
            exerciseConfig: { targetNote: "C4", choices: ["C", "D", "E", "F"], correctAnswer: "C" },
            secondaryExerciseConfig: { targetNote: "D4", choices: ["C", "D", "E", "F"], correctAnswer: "D" },
            passingScore: 70, xpReward: 10,
          },
          {
            // Introduces E and F. Choices include C and D for retention.
            slug: "beg-nn-2", title: "E and F", order: 1, exerciseType: "EAR_SINGLE",
            exerciseConfig: { targetNote: "E4", choices: ["C", "D", "E", "F"], correctAnswer: "E" },
            secondaryExerciseConfig: { targetNote: "F4", choices: ["C", "D", "E", "F"], correctAnswer: "F" },
            passingScore: 70, xpReward: 10,
          },
          {
            // Consolidates all four notes learned so far.
            slug: "beg-nn-3", title: "C, D, E, F Together", order: 2, exerciseType: "EAR_SINGLE",
            exerciseConfig: { targetNote: "C4", choices: ["C", "D", "E", "F"], correctAnswer: "C" },
            consolidationConfigs: [
              { targetNote: "C4", choices: ["C", "D", "E", "F"], correctAnswer: "C" },
              { targetNote: "D4", choices: ["C", "D", "E", "F"], correctAnswer: "D" },
              { targetNote: "E4", choices: ["C", "D", "E", "F"], correctAnswer: "E" },
              { targetNote: "F4", choices: ["C", "D", "E", "F"], correctAnswer: "F" },
            ],
            passingScore: 70, xpReward: 15,
          },
        ],
      },
      {
        slug: "beg-c-major",
        title: "The C Major Scale",
        description: "Complete the seven notes of the most important scale",
        order: 1,
        lessons: [
          {
            // G is the only new note. After intro, mix G with all prior notes (C,D,E,F) for retention.
            slug: "beg-cm-1", title: "Meet G", order: 0, exerciseType: "EAR_SINGLE",
            exerciseConfig: { targetNote: "G4", choices: ["C", "D", "E", "G"], correctAnswer: "G" },
            reinforceWithPrior: true,
            consolidationConfigs: [
              { targetNote: "G4", choices: ["C", "D", "E", "G"], correctAnswer: "G" },
              { targetNote: "G4", choices: ["C", "D", "E", "G"], correctAnswer: "G" },
              { targetNote: "G4", choices: ["D", "E", "F", "G"], correctAnswer: "G" },
              { targetNote: "C4", choices: ["C", "D", "E", "G"], correctAnswer: "C" },
              { targetNote: "D4", choices: ["C", "D", "E", "G"], correctAnswer: "D" },
              { targetNote: "E4", choices: ["C", "D", "E", "G"], correctAnswer: "E" },
              { targetNote: "F4", choices: ["D", "E", "F", "G"], correctAnswer: "F" },
            ],
            passingScore: 70, xpReward: 10,
          },
          {
            // Introduces A and B. G (now known) is included in choices as context.
            slug: "beg-cm-2", title: "A and B", order: 1, exerciseType: "EAR_SINGLE",
            exerciseConfig: { targetNote: "A4", choices: ["G", "A", "B", "C"], correctAnswer: "A" },
            secondaryExerciseConfig: { targetNote: "B4", choices: ["G", "A", "B", "C"], correctAnswer: "B" },
            passingScore: 70, xpReward: 10,
          },
          {
            // Full scale review — all 7 notes C through B, including unit-1 notes for retention.
            slug: "beg-cm-3", title: "Full Scale Review", order: 2, exerciseType: "EAR_SINGLE",
            exerciseConfig: { targetNote: "G4", choices: ["E", "F", "G", "A"], correctAnswer: "G" },
            consolidationConfigs: [
              { targetNote: "C4", choices: ["C", "D", "E", "G"], correctAnswer: "C" },
              { targetNote: "D4", choices: ["C", "D", "E", "F"], correctAnswer: "D" },
              { targetNote: "E4", choices: ["D", "E", "F", "G"], correctAnswer: "E" },
              { targetNote: "F4", choices: ["E", "F", "G", "A"], correctAnswer: "F" },
              { targetNote: "G4", choices: ["E", "F", "G", "A"], correctAnswer: "G" },
              { targetNote: "A4", choices: ["G", "A", "B", "C"], correctAnswer: "A" },
              { targetNote: "B4", choices: ["G", "A", "B", "C"], correctAnswer: "B" },
            ],
            passingScore: 70, xpReward: 15,
          },
        ],
      },
      {
        slug: "beg-note-values",
        title: "Note Values",
        description: "Learn the shapes that tell you how long to hold a note",
        order: 2,
        lessons: [
          {
            // Introduces quarter note (1 beat) and half note (2 beats) — most common in beginner music.
            slug: "beg-nv-1", title: "Quarter and Half Notes", order: 0, exerciseType: "NOTE_VALUE_ID",
            exerciseConfig: { symbol: "quarter_note", question: "What is this note called?", choices: ["Whole note", "Half note", "Quarter note", "Eighth note"], correctAnswer: "Quarter note" },
            secondaryExerciseConfig: { symbol: "half_note", question: "What is this note called?", choices: ["Whole note", "Half note", "Quarter note", "Eighth note"], correctAnswer: "Half note" },
            passingScore: 70, xpReward: 10,
          },
          {
            // Introduces whole note (4 beats). Reinforces with quarter + half for retention.
            slug: "beg-nv-2", title: "The Whole Note", order: 1, exerciseType: "NOTE_VALUE_ID",
            exerciseConfig: { symbol: "whole_note", question: "What is this note called?", choices: ["Whole note", "Half note", "Quarter note", "Eighth note"], correctAnswer: "Whole note" },
            reinforceWithPrior: true,
            consolidationConfigs: [
              { symbol: "whole_note", question: "What is this note called?", choices: ["Whole note", "Half note", "Quarter note", "Eighth note"], correctAnswer: "Whole note" },
              { symbol: "whole_note", question: "What is this note called?", choices: ["Whole note", "Half note", "Quarter note", "Eighth note"], correctAnswer: "Whole note" },
              { symbol: "quarter_note", question: "What is this note called?", choices: ["Whole note", "Half note", "Quarter note", "Eighth note"], correctAnswer: "Quarter note" },
              { symbol: "half_note", question: "What is this note called?", choices: ["Whole note", "Half note", "Quarter note", "Eighth note"], correctAnswer: "Half note" },
            ],
            passingScore: 70, xpReward: 10,
          },
          {
            // Consolidates whole, half, quarter. Also introduces the eighth note in the pool.
            slug: "beg-nv-3", title: "Note Values Review", order: 2, exerciseType: "NOTE_VALUE_ID",
            exerciseConfig: { symbol: "quarter_note", question: "What is this note called?", choices: ["Whole note", "Half note", "Quarter note", "Eighth note"], correctAnswer: "Quarter note" },
            consolidationConfigs: [
              { symbol: "whole_note", question: "What is this note called?", choices: ["Whole note", "Half note", "Quarter note", "Eighth note"], correctAnswer: "Whole note" },
              { symbol: "half_note", question: "What is this note called?", choices: ["Whole note", "Half note", "Quarter note", "Eighth note"], correctAnswer: "Half note" },
              { symbol: "quarter_note", question: "What is this note called?", choices: ["Whole note", "Half note", "Quarter note", "Eighth note"], correctAnswer: "Quarter note" },
              { symbol: "eighth_note", question: "What is this note called?", choices: ["Whole note", "Half note", "Quarter note", "Eighth note"], correctAnswer: "Eighth note" },
            ],
            passingScore: 70, xpReward: 15,
          },
        ],
      },
      {
        slug: "beg-singing",
        title: "Your Singing Voice",
        description: "Match your voice to notes for the first time",
        order: 3,
        lessons: [
          {
            slug: "beg-sv-1", title: "Sing C and E", order: 0, exerciseType: "PITCH_MATCH",
            exerciseConfig: { targetNote: "C4", displayNote: "C", confidenceThreshold: 0.80, timeoutSeconds: 10 },
            secondaryExerciseConfig: { targetNote: "E4", displayNote: "E", confidenceThreshold: 0.80, timeoutSeconds: 10 },
            passingScore: 70, xpReward: 15,
          },
          {
            slug: "beg-sv-2", title: "Sing G and A", order: 1, exerciseType: "PITCH_MATCH",
            exerciseConfig: { targetNote: "G4", displayNote: "G", confidenceThreshold: 0.80, timeoutSeconds: 10 },
            secondaryExerciseConfig: { targetNote: "A4", displayNote: "A", confidenceThreshold: 0.80, timeoutSeconds: 10 },
            passingScore: 70, xpReward: 15,
          },
          {
            // Singing review now includes D and F alongside C, E, G, A for full retention.
            slug: "beg-sv-3", title: "Singing Review", order: 2, exerciseType: "PITCH_MATCH",
            exerciseConfig: { targetNote: "C4", displayNote: "C", confidenceThreshold: 0.80, timeoutSeconds: 10 },
            consolidationConfigs: [
              { targetNote: "C4", displayNote: "C", confidenceThreshold: 0.80, timeoutSeconds: 10 },
              { targetNote: "D4", displayNote: "D", confidenceThreshold: 0.80, timeoutSeconds: 10 },
              { targetNote: "E4", displayNote: "E", confidenceThreshold: 0.80, timeoutSeconds: 10 },
              { targetNote: "F4", displayNote: "F", confidenceThreshold: 0.80, timeoutSeconds: 10 },
              { targetNote: "G4", displayNote: "G", confidenceThreshold: 0.80, timeoutSeconds: 10 },
              { targetNote: "A4", displayNote: "A", confidenceThreshold: 0.80, timeoutSeconds: 10 },
            ],
            passingScore: 70, xpReward: 20,
          },
        ],
      },
      {
        slug: "beg-octave",
        title: "The Octave",
        description: "Discover the first and most important interval",
        order: 4,
        lessons: [
          {
            slug: "beg-oc-1", title: "The Octave", order: 0, exerciseType: "INTERVAL_ID",
            exerciseConfig: { noteA: "C4", noteB: "C5", choices: ["Perfect 4th", "Perfect 5th", "Major 7th", "Octave"], correctAnswer: "Octave" },
            secondaryExerciseConfig: { noteA: "G4", noteB: "G5", choices: ["Perfect 5th", "Major 6th", "Major 7th", "Octave"], correctAnswer: "Octave" },
            passingScore: 70, xpReward: 15,
          },
          {
            // C5 is the new high note. B4 (known) is secondary so the lesson isn't one note only.
            slug: "beg-oc-2", title: "Hear C5 and B", order: 1, exerciseType: "EAR_SINGLE",
            exerciseConfig: { targetNote: "C5", choices: ["A", "B", "C", "D"], correctAnswer: "C" },
            secondaryExerciseConfig: { targetNote: "B4", choices: ["A", "B", "C", "D"], correctAnswer: "B" },
            passingScore: 70, xpReward: 15,
          },
          {
            // Singing two notes keeps practice varied. A4 is a known review target.
            slug: "beg-oc-3", title: "Sing High C and A", order: 2, exerciseType: "PITCH_MATCH",
            exerciseConfig: { targetNote: "C5", displayNote: "C", confidenceThreshold: 0.80, timeoutSeconds: 12 },
            secondaryExerciseConfig: { targetNote: "A4", displayNote: "A", confidenceThreshold: 0.80, timeoutSeconds: 10 },
            passingScore: 70, xpReward: 20,
          },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────
  // SECTION 2: ELEMENTARY
  // ─────────────────────────────────────────
  {
    slug: "elementary",
    title: "Elementary",
    description: "Expand your palette with sharps, flats, chords, and perfect intervals",
    order: 1,
    icon: "🎵",
    difficulty: "beginner",
    units: [
      {
        slug: "elem-sharps-flats",
        title: "Sharps and Flats",
        description: "Add the black keys — the notes between the notes",
        order: 0,
        lessons: [
          {
            // Secondary is C natural — forces immediate contrast with C#.
            slug: "elem-sf-1", title: "C# vs C", order: 0, exerciseType: "EAR_SINGLE",
            exerciseConfig: { targetNote: "C#4", choices: ["C", "C#", "D", "D#"], correctAnswer: "C#" },
            secondaryExerciseConfig: { targetNote: "C4", choices: ["C", "C#", "D", "D#"], correctAnswer: "C" },
            passingScore: 70, xpReward: 15,
          },
          {
            // Secondary is F natural — reinforces the distinction between F and F#.
            slug: "elem-sf-2", title: "F# vs F", order: 1, exerciseType: "EAR_SINGLE",
            exerciseConfig: { targetNote: "F#4", choices: ["F", "F#", "G", "G#"], correctAnswer: "F#" },
            secondaryExerciseConfig: { targetNote: "F4", choices: ["F", "F#", "G", "G#"], correctAnswer: "F" },
            passingScore: 70, xpReward: 15,
          },
          {
            // Introduces both A# and D# together. Two new sharps in one lesson.
            slug: "elem-sf-3", title: "A# and D#", order: 2, exerciseType: "EAR_SINGLE",
            exerciseConfig: { targetNote: "A#4", choices: ["A", "A#", "B", "C"], correctAnswer: "A#" },
            secondaryExerciseConfig: { targetNote: "D#4", choices: ["D", "D#", "E", "F"], correctAnswer: "D#" },
            passingScore: 70, xpReward: 15,
          },
          {
            // Review all four sharps/flats. Generator picks randomly from pool.
            slug: "elem-sf-4", title: "Sharps & Flats Review", order: 3, exerciseType: "EAR_SINGLE",
            exerciseConfig: { targetNote: "C#4", choices: ["C", "C#", "D", "D#"], correctAnswer: "C#" },
            consolidationConfigs: [
              { targetNote: "C#4", choices: ["C", "C#", "D", "D#"], correctAnswer: "C#" },
              { targetNote: "F#4", choices: ["F", "F#", "G", "G#"], correctAnswer: "F#" },
              { targetNote: "A#4", choices: ["A", "A#", "B", "C"], correctAnswer: "A#" },
              { targetNote: "D#4", choices: ["D", "D#", "E", "F"], correctAnswer: "D#" },
            ],
            passingScore: 70, xpReward: 20,
          },
        ],
      },
      {
        slug: "elem-perfect-intervals",
        title: "Perfect Intervals",
        description: "The foundation of harmony — P4, P5, and octave",
        order: 1,
        lessons: [
          { slug: "elem-pi-1", title: "Perfect Fourth", order: 0, exerciseType: "INTERVAL_ID", exerciseConfig: { noteA: "C4", noteB: "F4", choices: ["Major 3rd", "Perfect 4th", "Perfect 5th", "Octave"], correctAnswer: "Perfect 4th" }, passingScore: 70, xpReward: 20 },
          { slug: "elem-pi-2", title: "Perfect Fifth", order: 1, exerciseType: "INTERVAL_ID", exerciseConfig: { noteA: "C4", noteB: "G4", choices: ["Major 3rd", "Perfect 4th", "Perfect 5th", "Octave"], correctAnswer: "Perfect 5th" }, passingScore: 70, xpReward: 20 },
          { slug: "elem-pi-3", title: "P4 vs P5", order: 2, exerciseType: "INTERVAL_ID", exerciseConfig: { noteA: "G4", noteB: "C5", choices: ["Major 3rd", "Perfect 4th", "Perfect 5th", "Major 6th"], correctAnswer: "Perfect 4th" }, secondaryExerciseConfig: { noteA: "C4", noteB: "G4", choices: ["Major 3rd", "Perfect 4th", "Perfect 5th", "Major 6th"], correctAnswer: "Perfect 5th" }, passingScore: 70, xpReward: 20 },
          { slug: "elem-pi-4", title: "Perfect Intervals Mixed", order: 3, exerciseType: "INTERVAL_ID", exerciseConfig: { noteA: "D4", noteB: "A4", choices: ["Perfect 4th", "Perfect 5th", "Major 6th", "Octave"], correctAnswer: "Perfect 5th" }, passingScore: 70, xpReward: 25 },
        ],
      },
      {
        slug: "elem-chords",
        title: "Hearing Chords",
        description: "Identify notes when played together for the first time",
        order: 2,
        lessons: [
          { slug: "elem-ch-1", title: "Two-Note Chord: C+E", order: 0, exerciseType: "EAR_MULTI", exerciseConfig: { targetNotes: ["C4", "E4"], choices: ["C", "D", "E", "F", "G", "A", "B"], correctAnswers: ["C", "E"] }, passingScore: 70, xpReward: 20 },
          { slug: "elem-ch-2", title: "Power Chord: C+G", order: 1, exerciseType: "EAR_MULTI", exerciseConfig: { targetNotes: ["C4", "G4"], choices: ["C", "D", "E", "F", "G", "A", "B"], correctAnswers: ["C", "G"] }, passingScore: 70, xpReward: 20 },
          { slug: "elem-ch-3", title: "C Major Triad", order: 2, exerciseType: "EAR_MULTI", exerciseConfig: { targetNotes: ["C4", "E4", "G4"], choices: ["C", "D", "E", "F", "G", "A", "B"], correctAnswers: ["C", "E", "G"] }, passingScore: 70, xpReward: 25 },
          { slug: "elem-ch-4", title: "E Major Triad", order: 3, exerciseType: "EAR_MULTI", exerciseConfig: { targetNotes: ["E4", "G#4", "B4"], choices: ["C", "D", "E", "F", "G", "G#", "A", "B"], correctAnswers: ["E", "G#", "B"] }, passingScore: 70, xpReward: 25 },
        ],
      },
      {
        slug: "elem-sight-reading",
        title: "Sight Reading: Natural Notes",
        description: "Read every natural note across the staff",
        order: 3,
        lessons: [
          {
            // A is new to the staff. Secondary reviews F (from beg-st-3) for retention.
            slug: "elem-sr-1", title: "A and F on Staff", order: 0, exerciseType: "SIGHT_READ_PIANO",
            exerciseConfig: { targetNote: "A4", vexKey: "a/4", octaveRange: [3, 5] },
            secondaryExerciseConfig: { targetNote: "F4", vexKey: "f/4", octaveRange: [3, 5] },
            passingScore: 70, xpReward: 15,
          },
          {
            // B is new. Secondary reviews G for retention.
            slug: "elem-sr-2", title: "B and G on Staff", order: 1, exerciseType: "SIGHT_READ_PIANO",
            exerciseConfig: { targetNote: "B4", vexKey: "b/4", octaveRange: [3, 5] },
            secondaryExerciseConfig: { targetNote: "G4", vexKey: "g/4", octaveRange: [3, 5] },
            passingScore: 70, xpReward: 15,
          },
          {
            // C5 is new (high register). Secondary reviews A4 just learned.
            slug: "elem-sr-3", title: "C5 and A on Staff", order: 2, exerciseType: "SIGHT_READ_PIANO",
            exerciseConfig: { targetNote: "C5", vexKey: "c/5", octaveRange: [3, 5] },
            secondaryExerciseConfig: { targetNote: "A4", vexKey: "a/4", octaveRange: [3, 5] },
            passingScore: 70, xpReward: 15,
          },
          {
            // Full staff review — all natural notes including beginner-unit ones.
            slug: "elem-sr-4", title: "All Natural Notes", order: 3, exerciseType: "SIGHT_READ_PIANO",
            exerciseConfig: { targetNote: "E5", vexKey: "e/5", octaveRange: [3, 5] },
            consolidationConfigs: [
              { targetNote: "C4", vexKey: "c/4", octaveRange: [3, 5] },
              { targetNote: "E4", vexKey: "e/4", octaveRange: [3, 5] },
              { targetNote: "G4", vexKey: "g/4", octaveRange: [3, 5] },
              { targetNote: "A4", vexKey: "a/4", octaveRange: [3, 5] },
              { targetNote: "B4", vexKey: "b/4", octaveRange: [3, 5] },
              { targetNote: "C5", vexKey: "c/5", octaveRange: [3, 5] },
              { targetNote: "E5", vexKey: "e/5", octaveRange: [3, 5] },
            ],
            passingScore: 70, xpReward: 20,
          },
        ],
      },
      {
        slug: "elem-singing-steps",
        title: "Singing Steps",
        description: "Expand your vocal range one note at a time",
        order: 4,
        lessons: [
          {
            // D is new. Secondary reviews C so there's always contrast.
            slug: "elem-ss-1", title: "Sing D and C", order: 0, exerciseType: "PITCH_MATCH",
            exerciseConfig: { targetNote: "D4", displayNote: "D", confidenceThreshold: 0.82, timeoutSeconds: 10 },
            secondaryExerciseConfig: { targetNote: "C4", displayNote: "C", confidenceThreshold: 0.82, timeoutSeconds: 10 },
            passingScore: 70, xpReward: 20,
          },
          {
            // F is new. Secondary reviews D (just learned).
            slug: "elem-ss-2", title: "Sing F and D", order: 1, exerciseType: "PITCH_MATCH",
            exerciseConfig: { targetNote: "F4", displayNote: "F", confidenceThreshold: 0.82, timeoutSeconds: 10 },
            secondaryExerciseConfig: { targetNote: "D4", displayNote: "D", confidenceThreshold: 0.82, timeoutSeconds: 10 },
            passingScore: 70, xpReward: 20,
          },
          {
            // B is new. Secondary reviews A (adjacent note — important distinction).
            slug: "elem-ss-3", title: "Sing B and A", order: 2, exerciseType: "PITCH_MATCH",
            exerciseConfig: { targetNote: "B4", displayNote: "B", confidenceThreshold: 0.82, timeoutSeconds: 10 },
            secondaryExerciseConfig: { targetNote: "A4", displayNote: "A", confidenceThreshold: 0.82, timeoutSeconds: 10 },
            passingScore: 70, xpReward: 20,
          },
          {
            // High D is new. Secondary reviews C5 (the octave, already heard in beg-oc).
            slug: "elem-ss-4", title: "Sing High D and C", order: 3, exerciseType: "PITCH_MATCH",
            exerciseConfig: { targetNote: "D5", displayNote: "D", confidenceThreshold: 0.82, timeoutSeconds: 12 },
            secondaryExerciseConfig: { targetNote: "C5", displayNote: "C", confidenceThreshold: 0.82, timeoutSeconds: 12 },
            passingScore: 70, xpReward: 25,
          },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────
  // SECTION 3: INTERMEDIATE
  // ─────────────────────────────────────────
  {
    slug: "intermediate",
    title: "Intermediate",
    description: "Thirds, triads, the tritone, and chromatic singing",
    order: 2,
    icon: "🎸",
    difficulty: "intermediate",
    units: [
      {
        slug: "int-thirds",
        title: "Major & Minor Thirds",
        description: "The building blocks of every chord",
        order: 0,
        lessons: [
          { slug: "int-th-1", title: "Major Third", order: 0, exerciseType: "INTERVAL_ID", exerciseConfig: { noteA: "C4", noteB: "E4", choices: ["Minor 3rd", "Major 3rd", "Perfect 4th", "Perfect 5th"], correctAnswer: "Major 3rd" }, passingScore: 70, xpReward: 20 },
          { slug: "int-th-2", title: "Minor Third", order: 1, exerciseType: "INTERVAL_ID", exerciseConfig: { noteA: "D4", noteB: "F4", choices: ["Minor 2nd", "Major 2nd", "Minor 3rd", "Major 3rd"], correctAnswer: "Minor 3rd" }, passingScore: 70, xpReward: 20 },
          { slug: "int-th-3", title: "Major vs Minor Third", order: 2, exerciseType: "INTERVAL_ID", exerciseConfig: { noteA: "E4", noteB: "G4", choices: ["Minor 3rd", "Major 3rd", "Perfect 4th", "Tritone"], correctAnswer: "Minor 3rd" }, secondaryExerciseConfig: { noteA: "C4", noteB: "E4", choices: ["Minor 3rd", "Major 3rd", "Perfect 4th", "Perfect 5th"], correctAnswer: "Major 3rd" }, passingScore: 70, xpReward: 20 },
          { slug: "int-th-4", title: "Major Sixth", order: 3, exerciseType: "INTERVAL_ID", exerciseConfig: { noteA: "C4", noteB: "A4", choices: ["Perfect 5th", "Minor 6th", "Major 6th", "Octave"], correctAnswer: "Major 6th" }, passingScore: 70, xpReward: 25 },
        ],
      },
      {
        slug: "int-triads",
        title: "Triads",
        description: "Three-note chords — the heart of harmony",
        order: 1,
        lessons: [
          { slug: "int-tr-1", title: "C Major Triad", order: 0, exerciseType: "EAR_MULTI", exerciseConfig: { targetNotes: ["C4", "E4", "G4"], choices: ["C", "D", "E", "F", "G", "A", "B"], correctAnswers: ["C", "E", "G"] }, passingScore: 70, xpReward: 20 },
          { slug: "int-tr-2", title: "D Minor Triad", order: 1, exerciseType: "EAR_MULTI", exerciseConfig: { targetNotes: ["D4", "F4", "A4"], choices: ["C", "D", "E", "F", "G", "A", "B"], correctAnswers: ["D", "F", "A"] }, passingScore: 70, xpReward: 20 },
          { slug: "int-tr-3", title: "G Major Triad", order: 2, exerciseType: "EAR_MULTI", exerciseConfig: { targetNotes: ["G4", "B4", "D5"], choices: ["C", "D", "E", "F", "G", "A", "B"], correctAnswers: ["G", "B", "D"] }, passingScore: 70, xpReward: 25 },
          { slug: "int-tr-4", title: "F Major Triad", order: 3, exerciseType: "EAR_MULTI", exerciseConfig: { targetNotes: ["F4", "A4", "C5"], choices: ["C", "D", "E", "F", "G", "A", "B"], correctAnswers: ["F", "A", "C"] }, passingScore: 70, xpReward: 25 },
        ],
      },
      {
        slug: "int-tritone",
        title: "The Tritone",
        description: "The most dissonant and recognisable interval in music",
        order: 2,
        lessons: [
          { slug: "int-tt-1", title: "Tritone Intro", order: 0, exerciseType: "INTERVAL_ID", exerciseConfig: { noteA: "C4", noteB: "F#4", choices: ["Perfect 4th", "Tritone", "Perfect 5th", "Major 6th"], correctAnswer: "Tritone" }, passingScore: 70, xpReward: 25 },
          { slug: "int-tt-2", title: "Tritone vs Fifth", order: 1, exerciseType: "INTERVAL_ID", exerciseConfig: { noteA: "F4", noteB: "B4", choices: ["Perfect 4th", "Tritone", "Perfect 5th", "Octave"], correctAnswer: "Tritone" }, secondaryExerciseConfig: { noteA: "C4", noteB: "G4", choices: ["Perfect 4th", "Tritone", "Perfect 5th", "Octave"], correctAnswer: "Perfect 5th" }, passingScore: 70, xpReward: 25 },
          {
            // F# is heard as a note here. Secondary is F natural — critical contrast.
            slug: "int-tt-3", title: "Hear F# vs F", order: 2, exerciseType: "EAR_SINGLE",
            exerciseConfig: { targetNote: "F#4", choices: ["F", "F#", "G", "G#"], correctAnswer: "F#" },
            secondaryExerciseConfig: { targetNote: "F4", choices: ["F", "F#", "G", "G#"], correctAnswer: "F" },
            passingScore: 70, xpReward: 20,
          },
          { slug: "int-tt-4", title: "Tritone in Context", order: 3, exerciseType: "INTERVAL_ID", exerciseConfig: { noteA: "B4", noteB: "F5", choices: ["Perfect 4th", "Tritone", "Perfect 5th", "Major 6th"], correctAnswer: "Tritone" }, passingScore: 70, xpReward: 25 },
        ],
      },
      {
        slug: "int-sight-sharps",
        title: "Sight Reading: Sharps",
        description: "Read accidentals on the staff",
        order: 3,
        lessons: [
          { slug: "int-ss-1", title: "F# on Staff", order: 0, exerciseType: "SIGHT_READ_PIANO", exerciseConfig: { targetNote: "F#4", vexKey: "f#/4", octaveRange: [3, 5] }, secondaryExerciseConfig: { targetNote: "F4", vexKey: "f/4", octaveRange: [3, 5] }, passingScore: 70, xpReward: 20 },
          { slug: "int-ss-2", title: "C# on Staff", order: 1, exerciseType: "SIGHT_READ_PIANO", exerciseConfig: { targetNote: "C#4", vexKey: "c#/4", octaveRange: [3, 5] }, secondaryExerciseConfig: { targetNote: "C4", vexKey: "c/4", octaveRange: [3, 5] }, passingScore: 70, xpReward: 20 },
          { slug: "int-ss-3", title: "G# on Staff", order: 2, exerciseType: "SIGHT_READ_PIANO", exerciseConfig: { targetNote: "G#4", vexKey: "g#/4", octaveRange: [3, 5] }, secondaryExerciseConfig: { targetNote: "G4", vexKey: "g/4", octaveRange: [3, 5] }, passingScore: 70, xpReward: 20 },
          {
            slug: "int-ss-4", title: "Sharps on Staff Review", order: 3, exerciseType: "SIGHT_READ_PIANO",
            exerciseConfig: { targetNote: "D#4", vexKey: "d#/4", octaveRange: [3, 5] },
            consolidationConfigs: [
              { targetNote: "C#4", vexKey: "c#/4", octaveRange: [3, 5] },
              { targetNote: "F#4", vexKey: "f#/4", octaveRange: [3, 5] },
              { targetNote: "G#4", vexKey: "g#/4", octaveRange: [3, 5] },
              { targetNote: "D#4", vexKey: "d#/4", octaveRange: [3, 5] },
              { targetNote: "C4",  vexKey: "c/4",  octaveRange: [3, 5] },
              { targetNote: "F4",  vexKey: "f/4",  octaveRange: [3, 5] },
            ],
            passingScore: 70, xpReward: 25,
          },
        ],
      },
      {
        slug: "int-singing-intervals",
        title: "Singing Intervals",
        description: "Move between notes with precision",
        order: 4,
        lessons: [
          {
            // F4 is the "fourth" target. D4 is a review note to keep variety.
            slug: "int-si-1", title: "Sing a Fourth", order: 0, exerciseType: "PITCH_MATCH",
            exerciseConfig: { targetNote: "F4", displayNote: "F", confidenceThreshold: 0.85, timeoutSeconds: 10 },
            secondaryExerciseConfig: { targetNote: "C4", displayNote: "C", confidenceThreshold: 0.85, timeoutSeconds: 10 },
            passingScore: 70, xpReward: 25,
          },
          {
            slug: "int-si-2", title: "Sing a Fifth", order: 1, exerciseType: "PITCH_MATCH",
            exerciseConfig: { targetNote: "G4", displayNote: "G", confidenceThreshold: 0.85, timeoutSeconds: 10 },
            secondaryExerciseConfig: { targetNote: "D4", displayNote: "D", confidenceThreshold: 0.85, timeoutSeconds: 10 },
            passingScore: 70, xpReward: 25,
          },
          {
            slug: "int-si-3", title: "Sing a Third", order: 2, exerciseType: "PITCH_MATCH",
            exerciseConfig: { targetNote: "E4", displayNote: "E", confidenceThreshold: 0.85, timeoutSeconds: 10 },
            secondaryExerciseConfig: { targetNote: "B4", displayNote: "B", confidenceThreshold: 0.85, timeoutSeconds: 10 },
            passingScore: 70, xpReward: 25,
          },
          {
            slug: "int-si-4", title: "Sing High E and C", order: 3, exerciseType: "PITCH_MATCH",
            exerciseConfig: { targetNote: "E5", displayNote: "E", confidenceThreshold: 0.85, timeoutSeconds: 12 },
            secondaryExerciseConfig: { targetNote: "C5", displayNote: "C", confidenceThreshold: 0.85, timeoutSeconds: 12 },
            passingScore: 70, xpReward: 30,
          },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────
  // SECTION 4: UPPER INTERMEDIATE
  // ─────────────────────────────────────────
  {
    slug: "upper-intermediate",
    title: "Upper Intermediate",
    description: "Master all interval types, seventh chords, and chromatic pitch",
    order: 3,
    icon: "🎹",
    difficulty: "intermediate",
    units: [
      {
        slug: "upper-all-intervals",
        title: "All Interval Types",
        description: "All 13 intervals — from unison to octave",
        order: 0,
        lessons: [
          { slug: "upper-ai-1", title: "Major 2nd", order: 0, exerciseType: "INTERVAL_ID", exerciseConfig: { noteA: "C4", noteB: "D4", choices: ["Minor 2nd", "Major 2nd", "Minor 3rd", "Major 3rd"], correctAnswer: "Major 2nd" }, passingScore: 70, xpReward: 25 },
          { slug: "upper-ai-2", title: "Minor 6th", order: 1, exerciseType: "INTERVAL_ID", exerciseConfig: { noteA: "E4", noteB: "C5", choices: ["Perfect 5th", "Minor 6th", "Major 6th", "Minor 7th"], correctAnswer: "Minor 6th" }, passingScore: 70, xpReward: 25 },
          { slug: "upper-ai-3", title: "Minor 7th", order: 2, exerciseType: "INTERVAL_ID", exerciseConfig: { noteA: "C4", noteB: "A#4", choices: ["Major 6th", "Minor 7th", "Major 7th", "Octave"], correctAnswer: "Minor 7th" }, passingScore: 70, xpReward: 25 },
          { slug: "upper-ai-4", title: "Major 7th", order: 3, exerciseType: "INTERVAL_ID", exerciseConfig: { noteA: "C4", noteB: "B4", choices: ["Minor 6th", "Major 6th", "Minor 7th", "Major 7th"], correctAnswer: "Major 7th" }, passingScore: 70, xpReward: 30 },
        ],
      },
      {
        slug: "upper-seventh-chords",
        title: "Seventh Chords",
        description: "Four-note chords that define jazz, blues, and pop",
        order: 1,
        lessons: [
          { slug: "upper-sc-1", title: "Major 7th Chord", order: 0, exerciseType: "EAR_MULTI", exerciseConfig: { targetNotes: ["C4", "E4", "G4", "B4"], choices: ["C", "D", "E", "F", "G", "A", "B"], correctAnswers: ["C", "E", "G", "B"] }, passingScore: 70, xpReward: 30 },
          { slug: "upper-sc-2", title: "Dominant 7th", order: 1, exerciseType: "EAR_MULTI", exerciseConfig: { targetNotes: ["C4", "E4", "G4", "A#4"], choices: ["C", "D", "E", "F", "G", "A", "A#", "B"], correctAnswers: ["C", "E", "G", "A#"] }, passingScore: 70, xpReward: 30 },
          { slug: "upper-sc-3", title: "Minor 7th Chord", order: 2, exerciseType: "EAR_MULTI", exerciseConfig: { targetNotes: ["D4", "F4", "A4", "C5"], choices: ["C", "D", "E", "F", "G", "A", "B"], correctAnswers: ["D", "F", "A", "C"] }, passingScore: 70, xpReward: 30 },
          { slug: "upper-sc-4", title: "G Dominant 7th", order: 3, exerciseType: "EAR_MULTI", exerciseConfig: { targetNotes: ["G4", "B4", "D5", "F5"], choices: ["C", "D", "E", "F", "G", "A", "B"], correctAnswers: ["G", "B", "D", "F"] }, passingScore: 70, xpReward: 35 },
        ],
      },
      {
        slug: "upper-compound-intervals",
        title: "Seconds and Sixths",
        description: "The smaller intervals that add colour and tension",
        order: 2,
        lessons: [
          { slug: "upper-ci-1", title: "Minor 2nd", order: 0, exerciseType: "INTERVAL_ID", exerciseConfig: { noteA: "E4", noteB: "F4", choices: ["Minor 2nd", "Major 2nd", "Minor 3rd", "Major 3rd"], correctAnswer: "Minor 2nd" }, passingScore: 70, xpReward: 25 },
          {
            // Major 2nd — not yet taught; distinct from minor 2nd above.
            slug: "upper-ci-2", title: "Major 2nd", order: 1, exerciseType: "INTERVAL_ID",
            exerciseConfig: { noteA: "C4", noteB: "D4", choices: ["Minor 2nd", "Major 2nd", "Minor 3rd", "Major 3rd"], correctAnswer: "Major 2nd" },
            secondaryExerciseConfig: { noteA: "E4", noteB: "F4", choices: ["Minor 2nd", "Major 2nd", "Minor 3rd", "Major 3rd"], correctAnswer: "Minor 2nd" },
            passingScore: 70, xpReward: 25,
          },
          { slug: "upper-ci-3", title: "Minor vs Major 6th", order: 2, exerciseType: "INTERVAL_ID", exerciseConfig: { noteA: "G4", noteB: "E5", choices: ["Perfect 5th", "Minor 6th", "Major 6th", "Minor 7th"], correctAnswer: "Major 6th" }, secondaryExerciseConfig: { noteA: "E4", noteB: "C5", choices: ["Perfect 5th", "Minor 6th", "Major 6th", "Minor 7th"], correctAnswer: "Minor 6th" }, passingScore: 70, xpReward: 25 },
          { slug: "upper-ci-4", title: "Seconds & Sixths Mixed", order: 3, exerciseType: "INTERVAL_ID", exerciseConfig: { noteA: "D4", noteB: "B4", choices: ["Major 2nd", "Perfect 4th", "Major 6th", "Minor 7th"], correctAnswer: "Major 6th" }, passingScore: 70, xpReward: 30 },
        ],
      },
      {
        slug: "upper-sight-high",
        title: "Advanced Sight Reading",
        description: "Read notes in the higher register and ledger lines",
        order: 3,
        lessons: [
          {
            slug: "upper-sh-1", title: "D5 and C5", order: 0, exerciseType: "SIGHT_READ_PIANO",
            exerciseConfig: { targetNote: "D5", vexKey: "d/5", octaveRange: [4, 6] },
            secondaryExerciseConfig: { targetNote: "C5", vexKey: "c/5", octaveRange: [4, 6] },
            passingScore: 70, xpReward: 25,
          },
          {
            slug: "upper-sh-2", title: "F5 and D5", order: 1, exerciseType: "SIGHT_READ_PIANO",
            exerciseConfig: { targetNote: "F5", vexKey: "f/5", octaveRange: [4, 6] },
            secondaryExerciseConfig: { targetNote: "D5", vexKey: "d/5", octaveRange: [4, 6] },
            passingScore: 70, xpReward: 25,
          },
          {
            slug: "upper-sh-3", title: "A5 and F5", order: 2, exerciseType: "SIGHT_READ_PIANO",
            exerciseConfig: { targetNote: "A5", vexKey: "a/5", octaveRange: [4, 6] },
            secondaryExerciseConfig: { targetNote: "F5", vexKey: "f/5", octaveRange: [4, 6] },
            passingScore: 70, xpReward: 25,
          },
          {
            slug: "upper-sh-4", title: "High Notes Mixed", order: 3, exerciseType: "SIGHT_READ_PIANO",
            exerciseConfig: { targetNote: "G5", vexKey: "g/5", octaveRange: [4, 6] },
            consolidationConfigs: [
              { targetNote: "C5", vexKey: "c/5", octaveRange: [4, 6] },
              { targetNote: "D5", vexKey: "d/5", octaveRange: [4, 6] },
              { targetNote: "F5", vexKey: "f/5", octaveRange: [4, 6] },
              { targetNote: "G5", vexKey: "g/5", octaveRange: [4, 6] },
              { targetNote: "A5", vexKey: "a/5", octaveRange: [4, 6] },
            ],
            passingScore: 70, xpReward: 30,
          },
        ],
      },
      {
        slug: "upper-chromatic-singing",
        title: "Chromatic Singing",
        description: "Hit the black keys with your voice",
        order: 4,
        lessons: [
          {
            slug: "upper-cs-1", title: "Sing A# and A", order: 0, exerciseType: "PITCH_MATCH",
            exerciseConfig: { targetNote: "A#4", displayNote: "A#", confidenceThreshold: 0.85, timeoutSeconds: 10 },
            secondaryExerciseConfig: { targetNote: "A4", displayNote: "A", confidenceThreshold: 0.85, timeoutSeconds: 10 },
            passingScore: 70, xpReward: 30,
          },
          {
            slug: "upper-cs-2", title: "Sing C# and C", order: 1, exerciseType: "PITCH_MATCH",
            exerciseConfig: { targetNote: "C#4", displayNote: "C#", confidenceThreshold: 0.85, timeoutSeconds: 10 },
            secondaryExerciseConfig: { targetNote: "C4", displayNote: "C", confidenceThreshold: 0.85, timeoutSeconds: 10 },
            passingScore: 70, xpReward: 30,
          },
          {
            slug: "upper-cs-3", title: "Sing F# and F", order: 2, exerciseType: "PITCH_MATCH",
            exerciseConfig: { targetNote: "F#4", displayNote: "F#", confidenceThreshold: 0.85, timeoutSeconds: 10 },
            secondaryExerciseConfig: { targetNote: "F4", displayNote: "F", confidenceThreshold: 0.85, timeoutSeconds: 10 },
            passingScore: 70, xpReward: 30,
          },
          {
            slug: "upper-cs-4", title: "Sing B and G", order: 3, exerciseType: "PITCH_MATCH",
            exerciseConfig: { targetNote: "B4", displayNote: "B", confidenceThreshold: 0.85, timeoutSeconds: 12 },
            secondaryExerciseConfig: { targetNote: "G4", displayNote: "G", confidenceThreshold: 0.85, timeoutSeconds: 12 },
            passingScore: 70, xpReward: 35,
          },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────
  // SECTION 5: ADVANCED
  // ─────────────────────────────────────────
  {
    slug: "advanced",
    title: "Advanced",
    description: "Complete mastery — all intervals, complex chords, chromatic singing, and expert ear",
    order: 4,
    icon: "🏆",
    difficulty: "advanced",
    units: [
      {
        slug: "adv-all-intervals",
        title: "All 13 Intervals",
        description: "Identify any interval instantly",
        order: 0,
        lessons: [
          { slug: "adv-ai-1", title: "Tritone vs Minor 6th", order: 0, exerciseType: "INTERVAL_ID", exerciseConfig: { noteA: "C4", noteB: "G#4", choices: ["Tritone", "Perfect 5th", "Minor 6th", "Major 6th"], correctAnswer: "Minor 6th" }, secondaryExerciseConfig: { noteA: "C4", noteB: "F#4", choices: ["Tritone", "Perfect 5th", "Minor 6th", "Major 6th"], correctAnswer: "Tritone" }, passingScore: 70, xpReward: 30 },
          { slug: "adv-ai-2", title: "Minor 7th Sprint", order: 1, exerciseType: "INTERVAL_ID", exerciseConfig: { noteA: "E4", noteB: "D5", choices: ["Minor 6th", "Major 6th", "Minor 7th", "Major 7th"], correctAnswer: "Minor 7th" }, passingScore: 70, xpReward: 30 },
          { slug: "adv-ai-3", title: "Major 6th", order: 2, exerciseType: "INTERVAL_ID", exerciseConfig: { noteA: "C4", noteB: "A4", choices: ["Perfect 5th", "Minor 6th", "Major 6th", "Minor 7th"], correctAnswer: "Major 6th" }, passingScore: 70, xpReward: 30 },
          { slug: "adv-ai-4", title: "Minor 7th to Octave", order: 3, exerciseType: "INTERVAL_ID", exerciseConfig: { noteA: "G4", noteB: "F5", choices: ["Minor 6th", "Minor 7th", "Major 7th", "Octave"], correctAnswer: "Minor 7th" }, passingScore: 70, xpReward: 35 },
        ],
      },
      {
        slug: "adv-complex-chords",
        title: "Complex Chords",
        description: "Diminished, augmented, and extended chords",
        order: 1,
        lessons: [
          { slug: "adv-cc-1", title: "Diminished Triad", order: 0, exerciseType: "EAR_MULTI", exerciseConfig: { targetNotes: ["D4", "F4", "G#4"], choices: ["C", "D", "E", "F", "G", "G#", "A", "B"], correctAnswers: ["D", "F", "G#"] }, passingScore: 70, xpReward: 35 },
          { slug: "adv-cc-2", title: "Augmented Triad", order: 1, exerciseType: "EAR_MULTI", exerciseConfig: { targetNotes: ["C4", "E4", "G#4"], choices: ["C", "D", "E", "F", "G", "G#", "A", "B"], correctAnswers: ["C", "E", "G#"] }, passingScore: 70, xpReward: 35 },
          { slug: "adv-cc-3", title: "Add 9 Chord", order: 2, exerciseType: "EAR_MULTI", exerciseConfig: { targetNotes: ["C4", "E4", "G4", "D5"], choices: ["C", "D", "E", "F", "G", "A", "B"], correctAnswers: ["C", "E", "G", "D"] }, passingScore: 70, xpReward: 35 },
          { slug: "adv-cc-4", title: "Dense 4-Note Chord", order: 3, exerciseType: "EAR_MULTI", exerciseConfig: { targetNotes: ["C4", "E4", "G#4", "B4"], choices: ["C", "D", "E", "F", "G", "G#", "A", "B"], correctAnswers: ["C", "E", "G#", "B"] }, passingScore: 70, xpReward: 40 },
        ],
      },
      {
        slug: "adv-melodic-sight",
        title: "Melodic Sight Singing",
        description: "Read and sing notes from the upper staff",
        order: 2,
        lessons: [
          { slug: "adv-ms-1", title: "Sight Read E5 and C5", order: 0, exerciseType: "SIGHT_READ_PIANO", exerciseConfig: { targetNote: "E5", vexKey: "e/5", octaveRange: [4, 6] }, secondaryExerciseConfig: { targetNote: "C5", vexKey: "c/5", octaveRange: [4, 6] }, passingScore: 70, xpReward: 35 },
          { slug: "adv-ms-2", title: "Sight Read F#5 and D5", order: 1, exerciseType: "SIGHT_READ_PIANO", exerciseConfig: { targetNote: "F#5", vexKey: "f#/5", octaveRange: [4, 6] }, secondaryExerciseConfig: { targetNote: "D5", vexKey: "d/5", octaveRange: [4, 6] }, passingScore: 70, xpReward: 35 },
          { slug: "adv-ms-3", title: "Sight Read G5 and E5", order: 2, exerciseType: "SIGHT_READ_PIANO", exerciseConfig: { targetNote: "G5", vexKey: "g/5", octaveRange: [4, 6] }, secondaryExerciseConfig: { targetNote: "E5", vexKey: "e/5", octaveRange: [4, 6] }, passingScore: 70, xpReward: 35 },
          {
            slug: "adv-ms-4", title: "High Staff Review", order: 3, exerciseType: "SIGHT_READ_PIANO",
            exerciseConfig: { targetNote: "A5", vexKey: "a/5", octaveRange: [4, 6] },
            consolidationConfigs: [
              { targetNote: "C5",  vexKey: "c/5",  octaveRange: [4, 6] },
              { targetNote: "D5",  vexKey: "d/5",  octaveRange: [4, 6] },
              { targetNote: "E5",  vexKey: "e/5",  octaveRange: [4, 6] },
              { targetNote: "F#5", vexKey: "f#/5", octaveRange: [4, 6] },
              { targetNote: "G5",  vexKey: "g/5",  octaveRange: [4, 6] },
              { targetNote: "A5",  vexKey: "a/5",  octaveRange: [4, 6] },
            ],
            passingScore: 70, xpReward: 40,
          },
        ],
      },
      {
        slug: "adv-chromatic-mastery",
        title: "Chromatic Singing Mastery",
        description: "Precise intonation on any note",
        order: 3,
        lessons: [
          {
            slug: "adv-cm-1", title: "Sing D# and C#", order: 0, exerciseType: "PITCH_MATCH",
            exerciseConfig: { targetNote: "D#4", displayNote: "D#", confidenceThreshold: 0.88, timeoutSeconds: 12 },
            secondaryExerciseConfig: { targetNote: "C#4", displayNote: "C#", confidenceThreshold: 0.88, timeoutSeconds: 12 },
            passingScore: 70, xpReward: 35,
          },
          {
            slug: "adv-cm-2", title: "Sing G# and F#", order: 1, exerciseType: "PITCH_MATCH",
            exerciseConfig: { targetNote: "G#4", displayNote: "G#", confidenceThreshold: 0.88, timeoutSeconds: 12 },
            secondaryExerciseConfig: { targetNote: "F#4", displayNote: "F#", confidenceThreshold: 0.88, timeoutSeconds: 12 },
            passingScore: 70, xpReward: 35,
          },
          {
            slug: "adv-cm-3", title: "Sing High E and C", order: 2, exerciseType: "PITCH_MATCH",
            exerciseConfig: { targetNote: "E5", displayNote: "E", confidenceThreshold: 0.88, timeoutSeconds: 12 },
            secondaryExerciseConfig: { targetNote: "C5", displayNote: "C", confidenceThreshold: 0.88, timeoutSeconds: 12 },
            passingScore: 70, xpReward: 40,
          },
          {
            slug: "adv-cm-4", title: "Sing High G and E", order: 3, exerciseType: "PITCH_MATCH",
            exerciseConfig: { targetNote: "G5", displayNote: "G", confidenceThreshold: 0.88, timeoutSeconds: 12 },
            secondaryExerciseConfig: { targetNote: "E5", displayNote: "E", confidenceThreshold: 0.88, timeoutSeconds: 12 },
            passingScore: 70, xpReward: 40,
          },
        ],
      },
      {
        slug: "adv-expert-ear",
        title: "Expert Ear Training",
        description: "Maximum speed, no hints — prove your ears",
        order: 4,
        lessons: [
          {
            slug: "adv-ee-1", title: "Chromatic Note Snap", order: 0, exerciseType: "EAR_SINGLE",
            exerciseConfig: { targetNote: "A#4", choices: ["A", "A#", "B", "C"], correctAnswer: "A#" },
            secondaryExerciseConfig: { targetNote: "F#4", choices: ["F", "F#", "G", "G#"], correctAnswer: "F#" },
            passingScore: 70, xpReward: 35,
          },
          { slug: "adv-ee-2", title: "Dense Chord Sprint", order: 1, exerciseType: "EAR_MULTI", exerciseConfig: { targetNotes: ["E4", "G#4", "B4", "D5"], choices: ["C", "D", "E", "F", "G", "G#", "A", "B"], correctAnswers: ["E", "G#", "B", "D"] }, passingScore: 70, xpReward: 40 },
          { slug: "adv-ee-3", title: "Interval Speed", order: 2, exerciseType: "INTERVAL_ID", exerciseConfig: { noteA: "C4", noteB: "A#4", choices: ["Minor 6th", "Major 6th", "Minor 7th", "Major 7th"], correctAnswer: "Minor 7th" }, passingScore: 70, xpReward: 40 },
          { slug: "adv-ee-4", title: "Final Challenge", order: 3, exerciseType: "EAR_MULTI", exerciseConfig: { targetNotes: ["C4", "E4", "G#4", "B4"], choices: ["C", "D", "E", "F", "G", "G#", "A", "A#", "B"], correctAnswers: ["C", "E", "G#", "B"] }, passingScore: 70, xpReward: 40 },
        ],
      },
    ],
  },
];
