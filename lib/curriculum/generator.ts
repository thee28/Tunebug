import type {
  ExerciseConfig,
  ExerciseType,
  IntervalName,
  EarSingleConfig,
  PitchMatchConfig,
  SightReadPianoConfig,
  EarMultiConfig,
  IntervalIdConfig,
} from "@/types/music";
import type { LessonStep, TeachStep, ExerciseStep } from "@/types/lesson";
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

// Generates a single exercise locked to the lesson's primary concept.
// EAR_SINGLE/PITCH_MATCH/SIGHT_READ_PIANO: same target note, randomized distractors.
// INTERVAL_ID: same interval type, randomized root note (hears the interval from different starting pitches).
// EAR_MULTI: same target chord, shuffled choice order.
function generateLockedExercise(
  type: ExerciseType,
  baseConfig: ExerciseConfig,
  difficulty: Difficulty,
  rng: () => number
): ExerciseStep {
  const s = DIFFICULTY_SETTINGS[difficulty];
  const notePool = NOTE_POOLS[difficulty];
  const intervalPool = INTERVAL_POOLS[difficulty];
  const simpleNames = NOTE_NAMES_BY_DIFFICULTY[difficulty];

  switch (type) {
    case "EAR_SINGLE": {
      const cfg = baseConfig as EarSingleConfig;
      const correct = noteToDisplayName(cfg.targetNote);
      const distractors = shuffled(simpleNames.filter((n) => n !== correct), rng).slice(0, s.choiceCount - 1);
      return {
        kind: "exercise",
        type,
        config: {
          targetNote: cfg.targetNote,
          choices: shuffled([correct, ...distractors], rng),
          correctAnswer: correct,
        },
      };
    }
    case "PITCH_MATCH": {
      return { kind: "exercise", type, config: baseConfig };
    }
    case "SIGHT_READ_PIANO": {
      return { kind: "exercise", type, config: baseConfig };
    }
    case "INTERVAL_ID": {
      const cfg = baseConfig as IntervalIdConfig;
      const interval = cfg.correctAnswer;
      const semitones = INTERVALS.find((i) => i.name === interval)!.semitones;
      const safePool = notePool.filter((n) => noteStrToMidi(n) + semitones <= 84);
      const noteA = pick(safePool.length ? safePool : notePool, rng);
      const noteB = midiToNoteStr(noteStrToMidi(noteA) + semitones);
      const distractors = shuffled(
        (intervalPool as IntervalName[]).filter((i) => i !== interval),
        rng
      ).slice(0, s.choiceCount - 1) as IntervalName[];
      return {
        kind: "exercise",
        type,
        config: {
          noteA,
          noteB,
          choices: shuffled([interval, ...distractors], rng) as IntervalName[],
          correctAnswer: interval,
        },
      };
    }
    case "EAR_MULTI": {
      const cfg = baseConfig as EarMultiConfig;
      return {
        kind: "exercise",
        type,
        config: { ...cfg, choices: shuffled(cfg.choices, rng) },
      };
    }
  }
}

// Like generateLockedExercise but for the mix phase of a two-phase lesson.
// For EAR_SINGLE/INTERVAL_ID: guarantees both lesson concepts appear in the choices so
// the learner must actively distinguish between them, not guess from unrelated distractors.
function generateMixExercise(
  type: ExerciseType,
  configA: ExerciseConfig,
  configB: ExerciseConfig,
  difficulty: Difficulty,
  rng: () => number,
  forcedTarget?: ExerciseConfig
): ExerciseStep {
  const s = DIFFICULTY_SETTINGS[difficulty];
  const simpleNames = NOTE_NAMES_BY_DIFFICULTY[difficulty];
  const intervalPool = INTERVAL_POOLS[difficulty];
  const notePool = NOTE_POOLS[difficulty];
  const targetConfig = forcedTarget ?? pick([configA, configB], rng);
  const otherConfig = targetConfig === configA ? configB : configA;

  switch (type) {
    case "EAR_SINGLE": {
      const cfg = targetConfig as EarSingleConfig;
      const correct = noteToDisplayName(cfg.targetNote);
      const mandatory = noteToDisplayName((otherConfig as EarSingleConfig).targetNote);
      const remaining = shuffled(
        simpleNames.filter((n) => n !== correct && n !== mandatory),
        rng
      ).slice(0, Math.max(0, s.choiceCount - 2));
      return {
        kind: "exercise",
        type,
        config: {
          targetNote: cfg.targetNote,
          choices: shuffled([correct, mandatory, ...remaining], rng),
          correctAnswer: correct,
        },
      };
    }
    case "PITCH_MATCH":
      return { kind: "exercise", type, config: targetConfig };
    case "SIGHT_READ_PIANO":
      return { kind: "exercise", type, config: targetConfig };
    case "INTERVAL_ID": {
      const cfg = targetConfig as IntervalIdConfig;
      const interval = cfg.correctAnswer;
      const otherInterval = (otherConfig as IntervalIdConfig).correctAnswer;
      const semitones = INTERVALS.find((i) => i.name === interval)!.semitones;
      const safePool = notePool.filter((n) => noteStrToMidi(n) + semitones <= 84);
      const noteA = pick(safePool.length ? safePool : notePool, rng);
      const noteB = midiToNoteStr(noteStrToMidi(noteA) + semitones);
      const distractors: IntervalName[] =
        interval !== otherInterval
          ? [
              otherInterval as IntervalName,
              ...shuffled(
                (intervalPool as IntervalName[]).filter((i) => i !== interval && i !== otherInterval),
                rng
              ).slice(0, Math.max(0, s.choiceCount - 2)),
            ]
          : (shuffled(
              (intervalPool as IntervalName[]).filter((i) => i !== interval),
              rng
            ).slice(0, s.choiceCount - 1) as IntervalName[]);
      return {
        kind: "exercise",
        type,
        config: {
          noteA,
          noteB,
          choices: shuffled([interval as IntervalName, ...distractors], rng) as IntervalName[],
          correctAnswer: interval,
        },
      };
    }
    case "EAR_MULTI": {
      const cfg = targetConfig as EarMultiConfig;
      return { kind: "exercise", type, config: { ...cfg, choices: shuffled(cfg.choices, rng) } };
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

// FNV-1a hash — converts a lesson slug to a deterministic seed
function slugToSeed(slug: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < slug.length; i++) {
    h ^= slug.charCodeAt(i);
    h = (Math.imul(h, 0x01000193)) >>> 0;
  }
  return h;
}

function buildConsolidationTeachSlide(exerciseType: ExerciseType, position: "intro" | "mid" | "challenge"): TeachStep {
  if (position === "mid") {
    return {
      kind: "teach",
      icon: "tips_and_updates",
      title: "Halfway There",
      body: "Keep going. You are training your ear to recognize multiple sounds automatically.",
    };
  }
  if (position === "challenge") {
    return {
      kind: "teach",
      icon: "emoji_events",
      title: "Final Stretch",
      body: "Last exercises. Everything from this unit is in the mix. Trust what you have learned.",
    };
  }
  const intros: Record<ExerciseType, string> = {
    EAR_SINGLE: "Review time. Every note from this unit is in the mix. Listen carefully and name what you hear.",
    PITCH_MATCH: "Singing review. All the notes from this unit. Match your pitch each time.",
    INTERVAL_ID: "Interval review. All the intervals from this unit, in random order. Identify each one.",
    SIGHT_READ_PIANO: "Staff reading review. Every note position from this unit. Read and click the right key.",
    EAR_MULTI: "Chord review. All the chords from this unit. Pick out every note you hear.",
  };
  return {
    kind: "teach",
    icon: "cached",
    title: "Review",
    body: intros[exerciseType],
  };
}

function buildTeachSlide(
  exerciseType: ExerciseType,
  exerciseConfig: ExerciseConfig,
  position: "intro" | "mid" | "challenge" | "mix"
): TeachStep {
  if (position === "mix") {
    const mixTexts: Record<ExerciseType, string> = {
      EAR_SINGLE: "Both notes mixed now. Listen and identify which one you hear each time.",
      PITCH_MATCH: "Now mix both notes. You will be asked to sing either one. Stay focused.",
      INTERVAL_ID: "Both intervals together now. Same process, trust your ears.",
      SIGHT_READ_PIANO: "Notes from both parts of this lesson on the staff. Read each one.",
      EAR_MULTI: "Chords from both sections. Identify all notes you hear.",
    };
    return {
      kind: "teach",
      icon: "shuffle",
      title: "Mix Time",
      body: mixTexts[exerciseType],
    };
  }

  if (position === "mid") {
    const tips: Record<ExerciseType, string> = {
      EAR_SINGLE: "Tip: Before answering, hum the note quietly to yourself. It helps lock the sound in memory.",
      EAR_MULTI: "Tip: Listen for each note individually. Let the chord fade, then pick out the highest and lowest pitch first.",
      INTERVAL_ID: "Tip: Each interval has a unique personality. A perfect 5th sounds stable and powerful while a tritone sounds tense and unsettled.",
      PITCH_MATCH: "Tip: If you miss, listen again before your next attempt. Ear feedback is more useful than guessing.",
      SIGHT_READ_PIANO: "Tip: Use landmarks. C4 (middle C) sits just below the staff on a small ledger line. Build out from there.",
    };
    return {
      kind: "teach",
      icon: "tips_and_updates",
      title: "Halfway There",
      body: tips[exerciseType],
    };
  }

  if (position === "challenge") {
    return {
      kind: "teach",
      icon: "emoji_events",
      title: "Final Stretch",
      body: "Last set of exercises. You've been building this skill and now it's time to prove it. Stay focused and trust your ears.",
    };
  }

  // intro — explain the concept; depth depends on what needs introduction
  switch (exerciseType) {
    case "EAR_SINGLE": {
      const cfg = exerciseConfig as EarSingleConfig;
      const noteName = noteToDisplayName(cfg.targetNote);
      const isC = noteName === "C";
      const isNatural = !noteName.includes("#");
      return {
        kind: "teach",
        icon: "hearing",
        title: `Meet Note ${noteName}`,
        body: isC
          ? `Music uses 7 letter names: C D E F G A B, and then it repeats. C is the first and most important of these. Press play and listen carefully, trying to memorize that exact sound.`
          : isNatural
          ? `Note ${noteName} is a natural note, one of the 7 letters in the musical alphabet. It has its own distinct pitch. Press play and listen. Your goal is to recognize it by ear alone.`
          : `Note ${noteName} is a chromatic note that sits between two natural notes, like a black key on a piano. Press play and listen closely. Notice the subtle difference from the natural notes around it.`,
        playNote: cfg.targetNote,
      };
    }
    case "PITCH_MATCH": {
      const cfg = exerciseConfig as PitchMatchConfig;
      const isC = cfg.displayNote === "C";
      return {
        kind: "teach",
        icon: "mic",
        title: `Sing Note ${cfg.displayNote}`,
        body: isC
          ? `Time to use your own voice. Press play to hear note C, then hum or sing along. Your microphone measures how close your pitch is. You don't need to be a singer because even humming quietly works.`
          : `Press play to hear note ${cfg.displayNote}, then match it with your voice. Hum, sing, or whistle. Any pitch counts and your mic will track how well you match.`,
        playNote: cfg.targetNote,
      };
    }
    case "INTERVAL_ID": {
      const cfg = exerciseConfig as IntervalIdConfig;
      const intervalInfo = INTERVALS.find((i) => i.name === cfg.correctAnswer);
      const semitones = intervalInfo?.semitones ?? 0;
      const isFirst = cfg.correctAnswer === "Octave";
      return {
        kind: "teach",
        icon: "piano",
        title: `The ${cfg.correctAnswer}`,
        body: isFirst
          ? `An interval is the distance between two notes. The Octave is the most fundamental of them all. It's the same note name at a higher or lower pitch, spanning 12 semitones. Press play to hear both notes.`
          : `A ${cfg.correctAnswer} spans ${semitones} semitone${semitones !== 1 ? "s" : ""}. Every interval has its own character, so learn to recognize this one's sound. Press play.`,
        playInterval: [cfg.noteA, cfg.noteB],
      };
    }
    case "SIGHT_READ_PIANO": {
      const cfg = exerciseConfig as SightReadPianoConfig;
      const noteName = noteToDisplayName(cfg.targetNote);
      const isC = noteName === "C";
      return {
        kind: "teach",
        icon: "music_note",
        title: `Reading ${noteName} on the Staff`,
        body: isC
          ? `Sheet music places notes on a staff with 5 lines and 4 spaces. Each position is a different note. Middle C (C4) sits on a small ledger line just below the staff. You'll see a note displayed and your job is to click the matching piano key.`
          : `Find note ${noteName} on the staff below. Each line and space represents a specific note, so use middle C as your anchor and count up or down from there. Then click the matching key on the piano.`,
      };
    }
    case "EAR_MULTI": {
      const cfg = exerciseConfig as EarMultiConfig;
      const noteNames = cfg.correctAnswers.join(" + ");
      const isFirst = cfg.targetNotes.length === 2;
      return {
        kind: "teach",
        icon: "queue_music",
        title: `Chord: ${noteNames}`,
        body: isFirst
          ? `A chord is multiple notes played at the exact same time. Instead of a single pitch, you hear them all blend together. Press play to hear this ${cfg.targetNotes.length}-note chord and try to pick out each note inside it.`
          : `You'll hear ${cfg.targetNotes.length} notes at once. Listen for each pitch individually as the chord fades. Press play, then identify all the notes.`,
        playNotes: cfg.targetNotes,
      };
    }
  }
}

// Generates 15 lesson steps with one of three structures:
// - Consolidation (consolidationConfigs provided): [teach, ex×4, teach, ex×5, teach, ex×3] — random from pool
// - Two-phase (secondaryExerciseConfig provided): [teachA, exA×4, teachB, exB×4, teachMix, exAB×4]
// - Single (default): [teach, ex×4, teach, ex×5, teach, ex×3]
export function generateLessonSteps(
  lessonSlug: string,
  exerciseType: ExerciseType,
  exerciseConfig: ExerciseConfig,
  difficulty: Difficulty,
  secondaryExerciseConfig?: ExerciseConfig,
  consolidationConfigs?: ExerciseConfig[]
): LessonStep[] {
  const seed = slugToSeed(lessonSlug);
  const rng = createRng(seed);

  if (consolidationConfigs && consolidationConfigs.length > 0) {
    const makeEx = (): ExerciseStep =>
      generateLockedExercise(exerciseType, pick(consolidationConfigs, rng), difficulty, rng);
    return [
      buildConsolidationTeachSlide(exerciseType, "intro"),
      ...Array.from({ length: 4 }, makeEx),
      buildConsolidationTeachSlide(exerciseType, "mid"),
      ...Array.from({ length: 5 }, makeEx),
      buildConsolidationTeachSlide(exerciseType, "challenge"),
      ...Array.from({ length: 3 }, makeEx),
    ];
  }

  if (secondaryExerciseConfig) {
    const exA: ExerciseStep[] = [
      { kind: "exercise", type: exerciseType, config: exerciseConfig },
      ...Array.from({ length: 3 }, () => generateLockedExercise(exerciseType, exerciseConfig, difficulty, rng)),
    ];
    const exB: ExerciseStep[] = [
      { kind: "exercise", type: exerciseType, config: secondaryExerciseConfig },
      ...Array.from({ length: 3 }, () => generateLockedExercise(exerciseType, secondaryExerciseConfig, difficulty, rng)),
    ];
    const exMix: ExerciseStep[] = shuffled([
      generateMixExercise(exerciseType, exerciseConfig, secondaryExerciseConfig, difficulty, rng, exerciseConfig),
      generateMixExercise(exerciseType, exerciseConfig, secondaryExerciseConfig, difficulty, rng, exerciseConfig),
      generateMixExercise(exerciseType, exerciseConfig, secondaryExerciseConfig, difficulty, rng, secondaryExerciseConfig),
      generateMixExercise(exerciseType, exerciseConfig, secondaryExerciseConfig, difficulty, rng, secondaryExerciseConfig),
    ], rng);
    return [
      buildTeachSlide(exerciseType, exerciseConfig, "intro"),
      ...exA,
      buildTeachSlide(exerciseType, secondaryExerciseConfig, "intro"),
      ...exB,
      buildTeachSlide(exerciseType, exerciseConfig, "mix"),
      ...exMix,
    ];
  }

  // Single concept
  const firstExercise: ExerciseStep = { kind: "exercise", type: exerciseType, config: exerciseConfig };
  const generated: ExerciseStep[] = Array.from({ length: 11 }, () =>
    generateLockedExercise(exerciseType, exerciseConfig, difficulty, rng)
  );
  const allExercises = [firstExercise, ...generated];

  return [
    buildTeachSlide(exerciseType, exerciseConfig, "intro"),
    ...allExercises.slice(0, 4),
    buildTeachSlide(exerciseType, exerciseConfig, "mid"),
    ...allExercises.slice(4, 9),
    buildTeachSlide(exerciseType, exerciseConfig, "challenge"),
    ...allExercises.slice(9, 12),
  ];
}
