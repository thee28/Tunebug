import type {
  ExerciseType,
  ExerciseConfig,
  IntervalName,
  EarSingleConfig,
  EarMultiConfig,
  IntervalIdConfig,
  PitchMatchConfig,
  SightReadPianoConfig,
  NoteValueConfig,
  CountBeatsConfig,
  FillBlankRhythmConfig,
  NameItConfig,
  ErrorSpottingConfig,
} from "@/types/music";
import type { Concept, ConceptCategory } from "./concepts";
import { CONCEPT_TYPE_POOL } from "./concepts";
import {
  DIFFICULTY_SETTINGS,
  INTERVAL_POOLS,
  NOTE_NAMES_BY_DIFFICULTY,
  noteToDisplayName,
  noteToVexKey,
  type Difficulty,
} from "./content";
import { INTERVALS } from "@/lib/music/intervals";
import {
  createRng,
  fillSlot,
  slotDifficulty,
  type SlotDifficulty,
} from "./slotGenerator";

export type GeneratedExercise = { type: ExerciseType; config: ExerciseConfig };

export interface FreePracticeInput {
  domains: ConceptCategory[];
  difficulty: Difficulty;
  notePool: string[];   // notes with octave, e.g. ["C4", "D4", ...]
  slotCount: number;
  seed: number;
}

function pick<T>(arr: T[], rng: () => number): T {
  return arr[Math.floor(rng() * arr.length)];
}
function shuffled<T>(arr: T[], rng: () => number): T[] {
  const r = [...arr];
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
}
// Pick from arr preferring entries that pass `ok`; falls back to the full
// array when the filter empties it (e.g. pool of one).
function pickAvoiding<T>(arr: T[], ok: (t: T) => boolean, rng: () => number): T {
  const filtered = arr.filter(ok);
  return pick(filtered.length > 0 ? filtered : arr, rng);
}

const CHROMATIC = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
function midiToNoteStr(midi: number): string {
  return `${CHROMATIC[midi % 12]}${Math.floor(midi / 12) - 1}`;
}

// ─── Type picker over the union pool of the selected domains ────────
// Hard: never the same type as the previous slot (unless the pool has a
// single type, e.g. Chord ID → EAR_MULTI only). Soft: avoid the last 3.
function pickTypeFromPool(
  pool: ExerciseType[],
  recentTypes: ExerciseType[],
  rng: () => number
): ExerciseType {
  if (pool.length === 1) return pool[0];
  const last = recentTypes[recentTypes.length - 1];
  const hard = pool.filter((t) => t !== last);
  const soft = hard.filter((t) => !recentTypes.slice(-3).includes(t));
  return pick(soft.length > 0 ? soft : hard.length > 0 ? hard : pool, rng);
}

// TRUE_FALSE lives in both ear-note and staff-note pools; when both domains
// are selected, coin-flip which flavor this slot gets.
function categoryForSlot(
  type: ExerciseType,
  domains: ConceptCategory[],
  rng: () => number
): ConceptCategory {
  const owning = domains.filter((d) => CONCEPT_TYPE_POOL[d].includes(type));
  if (owning.length === 0) return domains[0];
  return owning.length === 1 ? owning[0] : pick(owning, rng);
}

// ─── Synthetic concepts (free practice has no curriculum lesson) ────
function earNoteConcept(note: string): Concept {
  const correct = noteToDisplayName(note);
  const config: EarSingleConfig = { targetNote: note, choices: [correct], correctAnswer: correct };
  return { id: `ear-note:${note}`, category: "ear-note", exerciseType: "EAR_SINGLE", config, answerKey: correct };
}

function singNoteConcept(note: string, difficulty: Difficulty): Concept {
  const s = DIFFICULTY_SETTINGS[difficulty];
  const config: PitchMatchConfig = {
    targetNote: note,
    displayNote: noteToDisplayName(note),
    confidenceThreshold: s.confidenceThreshold,
    timeoutSeconds: s.timeoutSeconds,
  };
  return { id: `sing-note:${note}`, category: "sing-note", exerciseType: "PITCH_MATCH", config, answerKey: noteToDisplayName(note) };
}

function staffNoteConcept(note: string): Concept {
  const config: SightReadPianoConfig = {
    targetNote: note,
    vexKey: noteToVexKey(note),
    octaveRange: [3, 5] as [number, number],
  };
  return { id: `staff-note:${note}`, category: "staff-note", exerciseType: "SIGHT_READ_PIANO", config, answerKey: note };
}

function intervalConcept(interval: IntervalName): Concept {
  // noteA/noteB are placeholders — fillSlot re-randomizes the root.
  const semis = INTERVALS.find((i) => i.name === interval)!.semitones;
  const config: IntervalIdConfig = {
    noteA: "C4",
    noteB: midiToNoteStr(60 + semis),
    choices: [interval],
    correctAnswer: interval,
  };
  return { id: `ear-interval:${interval}`, category: "ear-interval", exerciseType: "INTERVAL_ID", config, answerKey: interval };
}

// Chord concepts are built per-slot so choice count follows the session's
// difficulty ramp (fillSlot passes EAR_MULTI configs through untouched).
function chordConcept(
  notePool: string[],
  difficulty: Difficulty,
  diff: SlotDifficulty,
  rng: () => number
): Concept {
  const size = difficulty === "advanced" ? 4 : difficulty === "intermediate" ? 3 : 2;
  const targetNotes: string[] = [];
  const usedNames = new Set<string>();
  for (const n of shuffled(notePool, rng)) {
    const name = noteToDisplayName(n);
    if (usedNames.has(name)) continue; // no duplicate letter names (C4 + C5)
    usedNames.add(name);
    targetNotes.push(n);
    if (targetNotes.length === size) break;
  }
  const correctAnswers = targetNotes.map(noteToDisplayName);
  const names = NOTE_NAMES_BY_DIFFICULTY[difficulty];
  const extras = shuffled(names.filter((n) => !correctAnswers.includes(n)), rng)
    .slice(0, Math.max(diff.choiceCount - targetNotes.length, 2));
  const config: EarMultiConfig = {
    targetNotes,
    choices: shuffled([...correctAnswers, ...extras], rng),
    correctAnswers,
  };
  return {
    id: `ear-chord:${[...targetNotes].sort().join("-")}`,
    category: "ear-chord",
    exerciseType: "EAR_MULTI",
    config,
    answerKey: [...correctAnswers].sort().join("+"),
  };
}

const RHYTHM_SYMBOLS: { symbol: NoteValueConfig["symbol"]; name: string }[] = [
  { symbol: "whole_note", name: "Whole note" },
  { symbol: "half_note", name: "Half note" },
  { symbol: "quarter_note", name: "Quarter note" },
  { symbol: "eighth_note", name: "Eighth note" },
];

function rhythmConcept(rng: () => number, lastAnswerKey: string | null): Concept {
  const chosen = pickAvoiding(RHYTHM_SYMBOLS, (s) => s.name !== lastAnswerKey, rng);
  const config: NoteValueConfig = {
    symbol: chosen.symbol,
    question: "What is this note called?",
    choices: RHYTHM_SYMBOLS.map((s) => s.name),
    correctAnswer: chosen.name,
  };
  return { id: `rhythm:${chosen.symbol}`, category: "rhythm-symbol", exerciseType: "NOTE_VALUE_ID", config, answerKey: chosen.name };
}

function conceptForSlot(
  category: ConceptCategory,
  notePool: string[],
  difficulty: Difficulty,
  diff: SlotDifficulty,
  rng: () => number,
  lastAnswerKey: string | null
): Concept {
  switch (category) {
    case "ear-note":
      return earNoteConcept(pickAvoiding(notePool, (n) => noteToDisplayName(n) !== lastAnswerKey, rng));
    case "sing-note":
      return singNoteConcept(pickAvoiding(notePool, (n) => noteToDisplayName(n) !== lastAnswerKey, rng), difficulty);
    case "staff-note":
      return staffNoteConcept(pickAvoiding(notePool, (n) => n !== lastAnswerKey, rng));
    case "ear-interval":
      return intervalConcept(pickAvoiding(INTERVAL_POOLS[difficulty], (iv) => iv !== lastAnswerKey, rng));
    case "ear-chord":
      return chordConcept(notePool, difficulty, diff, rng);
    case "rhythm-symbol":
      return rhythmConcept(rng, lastAnswerKey);
  }
}

// ─── Level bias on distractor closeness ──────────────────────────────
// The session ramp (far → mixed → adjacent) is progress-driven; the level
// caps/floors it so Beginner never faces the trickiest distractors and
// Advanced never gets the trivially far ones.
function applyLevelBias(diff: SlotDifficulty, base: Difficulty): SlotDifficulty {
  if (base === "beginner" && diff.distractorCloseness === "adjacent") {
    return { ...diff, distractorCloseness: "mixed" };
  }
  if (base === "advanced" && diff.distractorCloseness === "far") {
    return { ...diff, distractorCloseness: "mixed" };
  }
  return diff;
}

// ─── Correct-position anti-repeat ────────────────────────────────────
// Applies only to shuffled multiple-choice lists. Fixed two-button types
// (SAME_DIFFERENT, HIGHER_LOWER, TRUE_FALSE) are deliberately excluded:
// forcing alternation there would make the answers predictable.
function correctChoiceIndex(type: ExerciseType, config: ExerciseConfig): number | null {
  switch (type) {
    case "EAR_SINGLE": {
      const c = config as EarSingleConfig;
      return c.choices.indexOf(c.correctAnswer);
    }
    case "NAME_IT": {
      const c = config as NameItConfig;
      return c.choices.indexOf(c.correctAnswer);
    }
    case "INTERVAL_ID": {
      const c = config as IntervalIdConfig;
      return c.choices.indexOf(c.correctAnswer);
    }
    case "NOTE_VALUE_ID": {
      const c = config as NoteValueConfig;
      return c.choices.indexOf(c.correctAnswer);
    }
    case "COUNT_BEATS": {
      const c = config as CountBeatsConfig;
      return c.choices.indexOf(c.correctBeats);
    }
    case "FILL_BLANK_RHYTHM": {
      const c = config as FillBlankRhythmConfig;
      return c.choices.indexOf(c.correctAnswer);
    }
    case "ERROR_SPOTTING": {
      const c = config as ErrorSpottingConfig;
      return c.choices.indexOf(c.actualNote.replace(/\d$/, ""));
    }
    default:
      return null;
  }
}

function moveCorrectAway(config: ExerciseConfig, fromIdx: number, rng: () => number): ExerciseConfig {
  const c = config as ExerciseConfig & { choices: unknown[] };
  if (c.choices.length < 2) return config;
  let to = Math.floor(rng() * (c.choices.length - 1));
  if (to >= fromIdx) to++;
  const choices = [...c.choices];
  [choices[fromIdx], choices[to]] = [choices[to], choices[fromIdx]];
  return { ...config, choices } as ExerciseConfig;
}

// ─── Session generator ───────────────────────────────────────────────
// Free practice deliberately skips the spaced-repetition/mastery queue:
// the user picked a domain to drill, so every slot stays in that pool.
export function generateFreePracticeSession(input: FreePracticeInput): GeneratedExercise[] {
  const rng = createRng(input.seed);
  const { difficulty, notePool, slotCount } = input;
  const domains = input.domains.length > 0 ? input.domains : (["ear-note"] as ConceptCategory[]);
  const typePool = [...new Set(domains.flatMap((d) => CONCEPT_TYPE_POOL[d]))];

  const out: GeneratedExercise[] = [];
  const recentTypes: ExerciseType[] = [];
  let lastAnswerKey: string | null = null;
  let lastCorrectIndex: number | null = null;

  for (let i = 0; i < slotCount; i++) {
    const progress = i / Math.max(1, slotCount - 1);
    const diff = applyLevelBias(slotDifficulty(progress, difficulty, false), difficulty);

    const type = pickTypeFromPool(typePool, recentTypes, rng);
    const category = categoryForSlot(type, domains, rng);
    const concept = conceptForSlot(category, notePool, difficulty, diff, rng, lastAnswerKey);

    let config = fillSlot(concept, type, diff, difficulty, rng).config;

    const idx = correctChoiceIndex(type, config);
    if (idx !== null && idx === lastCorrectIndex) {
      config = moveCorrectAway(config, idx, rng);
    }
    lastCorrectIndex = idx !== null ? correctChoiceIndex(type, config) : null;

    out.push({ type, config });
    recentTypes.push(type);
    lastAnswerKey = concept.answerKey;
  }

  return out;
}
