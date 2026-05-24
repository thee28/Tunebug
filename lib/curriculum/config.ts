import type { ExerciseType, ExerciseConfig } from "@/types/music";
import type { Difficulty } from "./content";

export interface CurriculumLesson {
  slug: string;
  title: string;
  order: number;
  exerciseType: ExerciseType;
  exerciseConfig: ExerciseConfig;
  passingScore: number;
  xpReward: number;
}

export interface CurriculumStage {
  slug: string;
  title: string;
  description: string;
  order: number;
  icon: string;
  difficulty: Difficulty;
  lessons: CurriculumLesson[];
}

export const CURRICULUM: CurriculumStage[] = [
  {
    slug: "beginner",
    title: "Beginner",
    description: "Learn note names and basic pitch matching",
    order: 0,
    icon: "🌱",
    difficulty: "beginner",
    lessons: [
      {
        slug: "beginner-note-c",
        title: "The Note C",
        order: 0,
        exerciseType: "EAR_SINGLE",
        exerciseConfig: { targetNote: "C4", choices: ["C", "D", "E", "F"], correctAnswer: "C" },
        passingScore: 70,
        xpReward: 10,
      },
      {
        slug: "beginner-note-d-e",
        title: "Notes D and E",
        order: 1,
        exerciseType: "EAR_SINGLE",
        exerciseConfig: { targetNote: "D4", choices: ["C", "D", "E", "F"], correctAnswer: "D" },
        passingScore: 70,
        xpReward: 10,
      },
      {
        slug: "beginner-sight-c",
        title: "Sight Read: C",
        order: 2,
        exerciseType: "SIGHT_READ_PIANO",
        exerciseConfig: { targetNote: "C4", vexKey: "c/4", octaveRange: [3, 5] },
        passingScore: 70,
        xpReward: 15,
      },
      {
        slug: "beginner-pitch-c",
        title: "Sing the Note C",
        order: 3,
        exerciseType: "PITCH_MATCH",
        exerciseConfig: { targetNote: "C4", displayNote: "C", confidenceThreshold: 0.8, timeoutSeconds: 10 },
        passingScore: 70,
        xpReward: 15,
      },
    ],
  },
  {
    slug: "elementary",
    title: "Elementary",
    description: "Major scale notes and simple sight reading",
    order: 1,
    icon: "🎵",
    difficulty: "beginner",
    lessons: [
      {
        slug: "elementary-c-major-scale",
        title: "C Major Scale",
        order: 0,
        exerciseType: "EAR_SINGLE",
        exerciseConfig: { targetNote: "G4", choices: ["E", "F", "G", "A"], correctAnswer: "G" },
        passingScore: 70,
        xpReward: 15,
      },
      {
        slug: "elementary-sight-e",
        title: "Sight Read: E and G",
        order: 1,
        exerciseType: "SIGHT_READ_PIANO",
        exerciseConfig: { targetNote: "E4", vexKey: "e/4", octaveRange: [3, 5] },
        passingScore: 70,
        xpReward: 15,
      },
      {
        slug: "elementary-ear-chord",
        title: "Hear a Chord",
        order: 2,
        exerciseType: "EAR_MULTI",
        exerciseConfig: {
          targetNotes: ["C4", "E4", "G4"],
          choices: ["C", "D", "E", "F", "G", "A", "B"],
          correctAnswers: ["C", "E", "G"],
        },
        passingScore: 70,
        xpReward: 20,
      },
      {
        slug: "elementary-pitch-g",
        title: "Sing the Note G",
        order: 3,
        exerciseType: "PITCH_MATCH",
        exerciseConfig: { targetNote: "G4", displayNote: "G", confidenceThreshold: 0.82, timeoutSeconds: 10 },
        passingScore: 70,
        xpReward: 20,
      },
    ],
  },
  {
    slug: "intermediate",
    title: "Intermediate",
    description: "Intervals and multi-note ear training",
    order: 2,
    icon: "🎸",
    difficulty: "intermediate",
    lessons: [
      {
        slug: "intermediate-perfect-fifth",
        title: "Perfect Fifth",
        order: 0,
        exerciseType: "INTERVAL_ID",
        exerciseConfig: {
          noteA: "C4", noteB: "G4",
          choices: ["Major 3rd", "Perfect 4th", "Perfect 5th", "Octave"],
          correctAnswer: "Perfect 5th",
        },
        passingScore: 70,
        xpReward: 20,
      },
      {
        slug: "intermediate-major-third",
        title: "Major Third",
        order: 1,
        exerciseType: "INTERVAL_ID",
        exerciseConfig: {
          noteA: "C4", noteB: "E4",
          choices: ["Minor 3rd", "Major 3rd", "Perfect 4th", "Perfect 5th"],
          correctAnswer: "Major 3rd",
        },
        passingScore: 70,
        xpReward: 20,
      },
      {
        slug: "intermediate-ear-multi",
        title: "Two-Note Chord",
        order: 2,
        exerciseType: "EAR_MULTI",
        exerciseConfig: {
          targetNotes: ["C4", "G4"],
          choices: ["C", "D", "E", "F", "G", "A", "B"],
          correctAnswers: ["C", "G"],
        },
        passingScore: 70,
        xpReward: 25,
      },
      {
        slug: "intermediate-pitch-e",
        title: "Sing the Note E",
        order: 3,
        exerciseType: "PITCH_MATCH",
        exerciseConfig: { targetNote: "E4", displayNote: "E", confidenceThreshold: 0.85, timeoutSeconds: 10 },
        passingScore: 70,
        xpReward: 25,
      },
    ],
  },
  {
    slug: "upper-intermediate",
    title: "Upper Intermediate",
    description: "Complex intervals and sight reading",
    order: 3,
    icon: "🎹",
    difficulty: "intermediate",
    lessons: [
      {
        slug: "upper-sight-read-g",
        title: "Sight Read in Treble Clef",
        order: 0,
        exerciseType: "SIGHT_READ_PIANO",
        exerciseConfig: { targetNote: "G4", vexKey: "g/4", octaveRange: [3, 5] },
        passingScore: 70,
        xpReward: 25,
      },
      {
        slug: "upper-octave",
        title: "Octave Leap",
        order: 1,
        exerciseType: "INTERVAL_ID",
        exerciseConfig: {
          noteA: "C4", noteB: "C5",
          choices: ["Perfect 5th", "Major 6th", "Major 7th", "Octave"],
          correctAnswer: "Octave",
        },
        passingScore: 70,
        xpReward: 25,
      },
      {
        slug: "upper-ear-triad",
        title: "Identify the Triad",
        order: 2,
        exerciseType: "EAR_MULTI",
        exerciseConfig: {
          targetNotes: ["E4", "G#4", "B4"],
          choices: ["C", "D", "E", "F", "G", "A", "B"],
          correctAnswers: ["E", "G", "B"],
        },
        passingScore: 70,
        xpReward: 30,
      },
      {
        slug: "upper-pitch-a",
        title: "Sing the Note A",
        order: 3,
        exerciseType: "PITCH_MATCH",
        exerciseConfig: { targetNote: "A4", displayNote: "A", confidenceThreshold: 0.85, timeoutSeconds: 10 },
        passingScore: 70,
        xpReward: 30,
      },
    ],
  },
  {
    slug: "advanced",
    title: "Advanced",
    description: "Complex chords, fast ear training, and intervals",
    order: 4,
    icon: "🏆",
    difficulty: "advanced",
    lessons: [
      {
        slug: "advanced-tritone",
        title: "The Tritone",
        order: 0,
        exerciseType: "INTERVAL_ID",
        exerciseConfig: {
          noteA: "C4", noteB: "F#4",
          choices: ["Perfect 4th", "Tritone", "Perfect 5th", "Major 6th"],
          correctAnswer: "Tritone",
        },
        passingScore: 70,
        xpReward: 30,
      },
      {
        slug: "advanced-ear-seventh",
        title: "Seventh Chord",
        order: 1,
        exerciseType: "EAR_MULTI",
        exerciseConfig: {
          targetNotes: ["C4", "E4", "G4", "B4"],
          choices: ["C", "D", "E", "F", "G", "A", "B"],
          correctAnswers: ["C", "E", "G", "B"],
        },
        passingScore: 70,
        xpReward: 35,
      },
      {
        slug: "advanced-sight-complex",
        title: "Advanced Sight Reading",
        order: 2,
        exerciseType: "SIGHT_READ_PIANO",
        exerciseConfig: { targetNote: "B4", vexKey: "b/4", octaveRange: [3, 6] },
        passingScore: 70,
        xpReward: 35,
      },
      {
        slug: "advanced-pitch-high",
        title: "Pitch Control",
        order: 3,
        exerciseType: "PITCH_MATCH",
        exerciseConfig: { targetNote: "E5", displayNote: "E", confidenceThreshold: 0.88, timeoutSeconds: 12 },
        passingScore: 70,
        xpReward: 40,
      },
    ],
  },
];
