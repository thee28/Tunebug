import type {
  ExerciseConfig,
  ExerciseType,
  IntervalName,
  NoteValueConfig,
} from "@/types/music";
import type { LessonStep } from "@/types/lesson";
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
import { CURRICULUM } from "./config";
import {
  deriveConcepts,
  newConceptsFor,
  getPriorConcepts,
  getConceptRecency,
} from "./concepts";
import { generateSlotPlan, type MasterySnapshot } from "./slotGenerator";

// Seeded LCG — same seed produces identical exercise sequence
export function createRng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    // Divide by 2^32 so result stays in [0, 1) — 2^32-1 lets rng() hit
    // exactly 1.0, which makes pick() index past the end of the array.
    return s / 4294967296;
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

    case "NOTE_VALUE_ID": {
      const symbols: { symbol: NoteValueConfig["symbol"]; name: string }[] = [
        { symbol: "whole_note",   name: "Whole note" },
        { symbol: "half_note",    name: "Half note" },
        { symbol: "quarter_note", name: "Quarter note" },
        { symbol: "eighth_note",  name: "Eighth note" },
      ];
      const chosen = pick(symbols, rng);
      return {
        type,
        config: {
          symbol: chosen.symbol,
          question: "What is this note called?",
          choices: shuffled(symbols.map((s) => s.name), rng),
          correctAnswer: chosen.name,
        },
      };
    }
    default:
      throw new Error(`generateOne: unsupported daily exercise type ${type}`);
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

// FNV-1a hash — converts a lesson slug to a deterministic seed
function slugToSeed(slug: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < slug.length; i++) {
    h ^= slug.charCodeAt(i);
    h = (Math.imul(h, 0x01000193)) >>> 0;
  }
  return h;
}

// Slot-based lesson generator. Looks the lesson up in CURRICULUM by slug to
// derive its concepts, gathers prior-lesson concepts for review interleaving,
// then delegates to the slot algorithm. The legacy positional params are
// accepted for backwards-compatibility with existing callers but only the
// slug and difficulty are used.
export function generateLessonSteps(
  lessonSlug: string,
  _exerciseType?: ExerciseType,
  _exerciseConfig?: ExerciseConfig,
  difficulty: Difficulty = "beginner",
  _secondaryExerciseConfig?: ExerciseConfig,
  _consolidationConfigs?: ExerciseConfig[],
  _reinforceWithPrior?: boolean,
  masteryMap?: Map<string, MasterySnapshot>
): LessonStep[] {
  void _exerciseType; void _exerciseConfig; void _secondaryExerciseConfig;
  void _consolidationConfigs; void _reinforceWithPrior;

  const lesson = CURRICULUM
    .flatMap((s) => s.units.flatMap((u) => u.lessons))
    .find((l) => l.slug === lessonSlug);

  if (!lesson) {
    throw new Error(`Unknown lesson slug: ${lessonSlug}`);
  }

  const allConcepts = deriveConcepts(lesson);
  const newConcepts = newConceptsFor(lesson);
  const newIds = new Set(newConcepts.map((c) => c.id));
  const reviewPoolConcepts = allConcepts.filter((c) => !newIds.has(c.id));
  const priorConcepts = getPriorConcepts(lessonSlug);
  const recency = getConceptRecency(lessonSlug);

  return generateSlotPlan({
    newConcepts,
    reviewPoolConcepts,
    priorConcepts,
    recency,
    difficulty,
    seed: slugToSeed(lessonSlug),
    slotCount: 12,
    masteryMap,
  });
}
