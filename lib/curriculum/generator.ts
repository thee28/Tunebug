import type { ExerciseConfig, ExerciseType, IntervalName } from "@/types/music";
import {
  NOTE_POOLS,
  INTERVAL_POOLS,
  NOTE_NAMES_BY_DIFFICULTY,
  DIFFICULTY_SETTINGS,
  noteToDisplayName,
  noteToVexKey,
  type Difficulty,
} from "./content";
import { INTERVALS } from "@/lib/music/intervals";

// Seeded LCG — same seed produces identical exercise sequence
function createRng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967295;
  };
}

function pick<T>(arr: T[], rng: () => number): T {
  return arr[Math.floor(rng() * arr.length)];
}

function shuffled<T>(arr: T[], rng: () => number): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

const NOTE_CHROMATIC = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

function midiToNoteStr(midi: number): string {
  return `${NOTE_CHROMATIC[midi % 12]}${Math.floor(midi / 12) - 1}`;
}

function noteStrToMidi(note: string): number {
  const m = note.match(/^([A-G]#?)(\d)$/);
  if (!m) throw new Error(`Invalid note: ${note}`);
  return (parseInt(m[2]) + 1) * 12 + NOTE_CHROMATIC.indexOf(m[1]);
}

export type GeneratedExercise = { type: ExerciseType; config: ExerciseConfig };

function generateOne(type: ExerciseType, difficulty: Difficulty, rng: () => number): GeneratedExercise {
  const s = DIFFICULTY_SETTINGS[difficulty];
  const notePool = NOTE_POOLS[difficulty];
  const intervalPool = INTERVAL_POOLS[difficulty];
  const simpleNames = NOTE_NAMES_BY_DIFFICULTY[difficulty];

  switch (type) {
    case "PITCH_MATCH": {
      const targetNote = pick(notePool, rng);
      return {
        type,
        config: {
          targetNote,
          displayNote: noteToDisplayName(targetNote),
          confidenceThreshold: s.confidenceThreshold,
          timeoutSeconds: s.timeoutSeconds,
        },
      };
    }

    case "EAR_SINGLE": {
      const targetNote = pick(notePool, rng);
      const correct = noteToDisplayName(targetNote);
      const distractors = shuffled(simpleNames.filter((n) => n !== correct), rng).slice(0, s.choiceCount - 1);
      return {
        type,
        config: {
          targetNote,
          choices: shuffled([correct, ...distractors], rng),
          correctAnswer: correct,
        },
      };
    }

    case "EAR_MULTI": {
      const count = difficulty === "beginner" ? 2 : difficulty === "intermediate" ? 3 : 4;
      const targetNotes = shuffled(notePool, rng).slice(0, count);
      const correctAnswers = targetNotes.map(noteToDisplayName);
      const extras = shuffled(simpleNames.filter((n) => !correctAnswers.includes(n)), rng).slice(
        0,
        Math.max(s.choiceCount - count, 2)
      );
      return {
        type,
        config: {
          targetNotes,
          choices: shuffled([...correctAnswers, ...extras], rng),
          correctAnswers,
        },
      };
    }

    case "INTERVAL_ID": {
      const interval = pick(intervalPool, rng) as IntervalName;
      const semitones = INTERVALS.find((i) => i.name === interval)!.semitones;
      const safePool = notePool.filter((n) => noteStrToMidi(n) + semitones <= 84);
      const noteA = pick(safePool.length ? safePool : notePool, rng);
      const noteB = midiToNoteStr(noteStrToMidi(noteA) + semitones);
      const distractors = shuffled(
        (intervalPool as IntervalName[]).filter((i) => i !== interval),
        rng
      ).slice(0, s.choiceCount - 1) as IntervalName[];
      return {
        type,
        config: {
          noteA,
          noteB,
          choices: shuffled([interval, ...distractors], rng) as IntervalName[],
          correctAnswer: interval,
        },
      };
    }

    case "SIGHT_READ_PIANO": {
      const targetNote = pick(notePool, rng);
      return {
        type,
        config: {
          targetNote,
          vexKey: noteToVexKey(targetNote),
          octaveRange: [3, 5] as [number, number],
        },
      };
    }
  }
}

const TYPE_POOLS: Record<Difficulty, ExerciseType[]> = {
  beginner: ["EAR_SINGLE", "EAR_SINGLE", "PITCH_MATCH", "SIGHT_READ_PIANO"],
  intermediate: ["EAR_SINGLE", "EAR_MULTI", "INTERVAL_ID", "PITCH_MATCH", "SIGHT_READ_PIANO"],
  advanced: ["EAR_MULTI", "INTERVAL_ID", "INTERVAL_ID", "PITCH_MATCH", "SIGHT_READ_PIANO"],
};

export function generateDailyExercises(
  difficulty: Difficulty,
  seed: number,
  count = 5
): GeneratedExercise[] {
  const rng = createRng(seed);
  const typePool = TYPE_POOLS[difficulty];
  return Array.from({ length: count }, () => generateOne(pick(typePool, rng), difficulty, rng));
}

export function dateSeed(date: Date): number {
  const y = date.getUTCFullYear();
  const m = date.getUTCMonth() + 1;
  const d = date.getUTCDate();
  return y * 10000 + m * 100 + d;
}

export function difficultyFromCompletedStages(completedStageCount: number): Difficulty {
  if (completedStageCount >= 4) return "advanced";
  if (completedStageCount >= 2) return "intermediate";
  return "beginner";
}
