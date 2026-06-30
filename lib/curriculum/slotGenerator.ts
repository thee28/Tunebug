import type {
  ExerciseType,
  IntervalName,
  NoteSymbol,
  EarSingleConfig,
  EarMultiConfig,
  IntervalIdConfig,
  NoteValueConfig,
  SightReadPianoConfig,
  SameDifferentConfig,
  HigherLowerConfig,
  OddOneOutConfig,
  FreePickKeyboardConfig,
  CountBeatsConfig,
  SameDifferentRhythmConfig,
  FillBlankRhythmConfig,
  BuildRhythmConfig,
  TapAlongConfig,
  NameItConfig,
  TrueFalseConfig,
  ErrorSpottingConfig,
  MatchingPairsConfig,
  SequenceRecallConfig,
} from "@/types/music";
import type { LessonStep, TeachStep, ExerciseStep } from "@/types/lesson";
import type { Concept } from "./concepts";
import { CONCEPT_TYPE_POOL, GENTLEST_TYPE } from "./concepts";
import {
  NOTE_NAMES_BY_DIFFICULTY,
  INTERVAL_POOLS,
  DIFFICULTY_SETTINGS,
  type Difficulty,
} from "./content";
import { INTERVALS } from "@/lib/music/intervals";

const NOTE_CHROMATIC = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];
function noteStrToMidi(n: string): number {
  const m = n.match(/^([A-G]#?)(\d)$/);
  if (!m) throw new Error(`bad note ${n}`);
  return (parseInt(m[2]) + 1) * 12 + NOTE_CHROMATIC.indexOf(m[1]);
}
function midiToNoteStr(midi: number): string {
  return `${NOTE_CHROMATIC[midi % 12]}${Math.floor(midi / 12) - 1}`;
}

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
  const r = [...arr];
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
}

// ─── Difficulty escalation ──────────────────────────────────────────
// progress ∈ [0,1] = position in lesson. Drives distractor closeness & choice count.
// masteryScore ∈ [0,1] (optional) adapts difficulty per concept.
interface SlotDifficulty {
  choiceCount: number;
  distractorCloseness: "far" | "adjacent" | "mixed";
}
const STRONG_MASTERY = 0.75;
const WEAK_MASTERY = 0.4;
function slotDifficulty(
  progress: number,
  base: Difficulty,
  isReview: boolean,
  masteryScore?: number
): SlotDifficulty {
  const baseCount = DIFFICULTY_SETTINGS[base].choiceCount;
  const minCount = Math.max(2, baseCount - 2);
  let count = Math.round(minCount + (baseCount - minCount) * progress);
  let closeness: SlotDifficulty["distractorCloseness"];
  if (isReview) closeness = progress < 0.5 ? "mixed" : "adjacent";
  else if (progress < 0.33) closeness = "far";
  else if (progress < 0.66) closeness = "mixed";
  else closeness = "adjacent";

  // Adaptive bias: ramp up for confident concepts, back off for weak ones.
  if (masteryScore !== undefined) {
    if (masteryScore >= STRONG_MASTERY) {
      count = Math.min(baseCount + 1, count + 1);
      closeness = "adjacent";
    } else if (masteryScore <= WEAK_MASTERY) {
      count = Math.max(2, count - 1);
      closeness = closeness === "adjacent" ? "mixed" : "far";
    }
  }
  return { choiceCount: count, distractorCloseness: closeness };
}

// ─── Distractor selection respecting closeness ──────────────────────
function distractorsForNoteName(correct: string, allNames: string[], n: number, closeness: SlotDifficulty["distractorCloseness"], rng: () => number): string[] {
  const idx = allNames.indexOf(correct);
  if (idx < 0 || closeness === "far") {
    return shuffled(allNames.filter((x) => x !== correct), rng).slice(0, n);
  }
  // adjacent = prefer names within ±2 of correct
  const adj: string[] = [];
  for (let d = 1; d <= 3 && adj.length < n + 2; d++) {
    if (idx - d >= 0) adj.push(allNames[idx - d]);
    if (idx + d < allNames.length) adj.push(allNames[idx + d]);
  }
  const adjFiltered = adj.filter((x) => x !== correct);
  if (closeness === "adjacent") {
    const pool = adjFiltered.length >= n ? adjFiltered : [...adjFiltered, ...allNames.filter((x) => x !== correct && !adjFiltered.includes(x))];
    return shuffled(pool, rng).slice(0, n);
  }
  // mixed = ~half adjacent, ~half random
  const half = Math.max(1, Math.floor(n / 2));
  const adjPart = shuffled(adjFiltered, rng).slice(0, half);
  const rest = shuffled(allNames.filter((x) => x !== correct && !adjPart.includes(x)), rng).slice(0, n - adjPart.length);
  return shuffled([...adjPart, ...rest], rng);
}

function distractorsForInterval(correct: IntervalName, pool: IntervalName[], n: number, closeness: SlotDifficulty["distractorCloseness"], rng: () => number): IntervalName[] {
  const correctSemi = INTERVALS.find((i) => i.name === correct)?.semitones ?? 0;
  const others = pool.filter((i) => i !== correct);
  if (closeness === "far") return shuffled(others, rng).slice(0, n);
  // sort by closeness in semitone distance
  const ranked = [...others].sort((a, b) => {
    const da = Math.abs((INTERVALS.find((i) => i.name === a)?.semitones ?? 0) - correctSemi);
    const db = Math.abs((INTERVALS.find((i) => i.name === b)?.semitones ?? 0) - correctSemi);
    return da - db;
  });
  if (closeness === "adjacent") return ranked.slice(0, n);
  // mixed
  const half = Math.max(1, Math.floor(n / 2));
  const closePart = ranked.slice(0, half);
  const farPart = shuffled(ranked.slice(half), rng).slice(0, n - closePart.length);
  return [...closePart, ...farPart];
}

// ─── Slot fill: build an ExerciseStep for a given concept at given difficulty ─
function fillSlot(
  concept: Concept,
  type: ExerciseType,
  diff: SlotDifficulty,
  base: Difficulty,
  rng: () => number
): ExerciseStep {
  const simpleNames = NOTE_NAMES_BY_DIFFICULTY[base];
  const intervalPool = INTERVAL_POOLS[base];

  switch (type) {
    case "EAR_SINGLE": {
      const c = concept.config as EarSingleConfig;
      const correct = c.correctAnswer;
      const distractors = distractorsForNoteName(correct, simpleNames, diff.choiceCount - 1, diff.distractorCloseness, rng);
      return {
        kind: "exercise",
        type: "EAR_SINGLE",
        config: { targetNote: c.targetNote, choices: shuffled([correct, ...distractors], rng), correctAnswer: correct },
      };
    }
    case "PITCH_MATCH":
      return { kind: "exercise", type: "PITCH_MATCH", config: concept.config };
    case "SIGHT_READ_PIANO":
      return { kind: "exercise", type: "SIGHT_READ_PIANO", config: concept.config };
    case "INTERVAL_ID": {
      const c = concept.config as IntervalIdConfig;
      const interval = c.correctAnswer;
      const semis = INTERVALS.find((i) => i.name === interval)!.semitones;
      // Randomize root within safe range for variety
      const rootMidi = noteStrToMidi("C4") + Math.floor(rng() * 8);
      const noteA = midiToNoteStr(rootMidi);
      const noteB = midiToNoteStr(rootMidi + semis);
      const distractors = distractorsForInterval(interval, intervalPool, diff.choiceCount - 1, diff.distractorCloseness, rng);
      return {
        kind: "exercise",
        type: "INTERVAL_ID",
        config: { noteA, noteB, choices: shuffled([interval, ...distractors], rng), correctAnswer: interval },
      };
    }
    case "EAR_MULTI": {
      const c = concept.config as EarMultiConfig;
      return { kind: "exercise", type: "EAR_MULTI", config: { ...c, choices: shuffled(c.choices, rng) } };
    }
    case "NOTE_VALUE_ID": {
      const c = concept.config as NoteValueConfig;
      return { kind: "exercise", type: "NOTE_VALUE_ID", config: { ...c, choices: shuffled(c.choices, rng) } };
    }
    case "SAME_DIFFERENT": {
      const c = concept.config as EarSingleConfig;
      const noteA = c.targetNote;
      // Coin flip: same or different. Adjacency-biased when different.
      const isSame = rng() < 0.5;
      let noteB: string;
      if (isSame) {
        noteB = noteA;
      } else {
        const aMidi = noteStrToMidi(noteA);
        // Pick offset ±1 to ±3 semitones, more closeness for "adjacent"
        const maxStep = diff.distractorCloseness === "adjacent" ? 1 : diff.distractorCloseness === "mixed" ? 3 : 5;
        const step = (Math.floor(rng() * maxStep) + 1) * (rng() < 0.5 ? -1 : 1);
        const clamped = Math.max(36, Math.min(84, aMidi + step));
        noteB = midiToNoteStr(clamped);
      }
      const cfg: SameDifferentConfig = {
        noteA,
        noteB,
        correctAnswer: noteA === noteB ? "Same" : "Different",
      };
      return { kind: "exercise", type: "SAME_DIFFERENT", config: cfg };
    }
    case "HIGHER_LOWER": {
      const c = concept.config as EarSingleConfig;
      const noteA = c.targetNote;
      const aMidi = noteStrToMidi(noteA);
      // Always pick a different pitch. Larger gaps when "far", smaller when "adjacent".
      const maxStep = diff.distractorCloseness === "adjacent" ? 2 : diff.distractorCloseness === "mixed" ? 5 : 8;
      const step = (Math.floor(rng() * maxStep) + 1) * (rng() < 0.5 ? -1 : 1);
      const clamped = Math.max(36, Math.min(84, aMidi + step));
      const noteB = midiToNoteStr(clamped);
      const bMidi = noteStrToMidi(noteB);
      const cfg: HigherLowerConfig = {
        noteA,
        noteB,
        correctAnswer: bMidi > aMidi ? "Higher" : "Lower",
      };
      return { kind: "exercise", type: "HIGHER_LOWER", config: cfg };
    }
    case "ODD_ONE_OUT": {
      const c = concept.config as EarSingleConfig;
      const target = c.targetNote;
      const targetMidi = noteStrToMidi(target);
      const maxStep = diff.distractorCloseness === "adjacent" ? 1 : diff.distractorCloseness === "mixed" ? 3 : 5;
      const step = (Math.floor(rng() * maxStep) + 1) * (rng() < 0.5 ? -1 : 1);
      const odd = midiToNoteStr(Math.max(36, Math.min(84, targetMidi + step)));
      const oddIndex = Math.floor(rng() * 3);
      const notes = [target, target, target];
      notes[oddIndex] = odd;
      const cfg: OddOneOutConfig = { notes, oddIndex };
      return { kind: "exercise", type: "ODD_ONE_OUT", config: cfg };
    }
    case "FREE_PICK_KEYBOARD": {
      const c = concept.config as EarSingleConfig;
      const oct = parseInt(c.targetNote.match(/(\d)$/)?.[1] ?? "4");
      const cfg: FreePickKeyboardConfig = {
        targetNote: c.targetNote,
        octaveRange: [Math.max(3, oct - 1), Math.min(6, oct + 1)] as [number, number],
      };
      return { kind: "exercise", type: "FREE_PICK_KEYBOARD", config: cfg };
    }
    case "COUNT_BEATS": {
      const c = concept.config as NoteValueConfig;
      const beats = SYMBOL_BEATS[c.symbol];
      const choices = uniqueBeatChoices(beats, diff.choiceCount, rng);
      const cfg: CountBeatsConfig = { symbol: c.symbol, correctBeats: beats, choices };
      return { kind: "exercise", type: "COUNT_BEATS", config: cfg };
    }
    case "SAME_DIFFERENT_RHYTHM": {
      const c = concept.config as NoteValueConfig;
      const len = 3 + Math.floor(rng() * 2); // 3-4 cells
      const patternA = makeRhythmPattern(c.symbol, len, rng);
      const isSame = rng() < 0.5;
      const patternB = isSame ? [...patternA] : mutatePattern(patternA, rng);
      const cfg: SameDifferentRhythmConfig = {
        patternA, patternB,
        correctAnswer: arraysEqual(patternA, patternB) ? "Same" : "Different",
      };
      return { kind: "exercise", type: "SAME_DIFFERENT_RHYTHM", config: cfg };
    }
    case "FILL_BLANK_RHYTHM": {
      const c = concept.config as NoteValueConfig;
      const len = 4;
      const pattern = makeRhythmPattern(c.symbol, len, rng);
      const blankIndex = Math.floor(rng() * len);
      const correct = pattern[blankIndex];
      const distractors = uniqueSymbolChoices(correct, diff.choiceCount - 1, rng);
      const cfg: FillBlankRhythmConfig = {
        pattern, blankIndex,
        choices: shuffled([correct, ...distractors], rng),
        correctAnswer: correct,
      };
      return { kind: "exercise", type: "FILL_BLANK_RHYTHM", config: cfg };
    }
    case "BUILD_RHYTHM": {
      const c = concept.config as NoteValueConfig;
      const targetBeats = SYMBOL_BEATS[c.symbol] * (2 + Math.floor(rng() * 2)); // 2-3x the unit
      const palette: NoteSymbol[] = ["whole_note", "half_note", "quarter_note", "eighth_note"];
      const cfg: BuildRhythmConfig = { targetBeats: Math.max(1, targetBeats), palette };
      return { kind: "exercise", type: "BUILD_RHYTHM", config: cfg };
    }
    case "TAP_ALONG": {
      // Standard 4/4 measure at slow practice tempo.
      // BPM 60 = one beat per second; pattern always sums to exactly 4 beats.
      const pattern = makeFourFourPattern(rng, diff.distractorCloseness);
      const tolerance = diff.distractorCloseness === "adjacent" ? 220 : diff.distractorCloseness === "mixed" ? 280 : 340;
      const cfg: TapAlongConfig = { pattern, bpm: 60, toleranceMs: tolerance };
      return { kind: "exercise", type: "TAP_ALONG", config: cfg };
    }
    case "NAME_IT": {
      const c = concept.config as SightReadPianoConfig;
      const target = c.targetNote;
      const correct = target.replace(/\d$/, "");
      const distractors = distractorsForNoteName(correct, simpleNames, diff.choiceCount - 1, diff.distractorCloseness, rng);
      const cfg: NameItConfig = {
        targetNote: target,
        vexKey: c.vexKey,
        choices: shuffled([correct, ...distractors], rng),
        correctAnswer: correct,
      };
      return { kind: "exercise", type: "NAME_IT", config: cfg };
    }
    case "TRUE_FALSE": {
      // Works for either ear-note or staff-note concepts.
      const audioNote = (concept.config as { targetNote?: string }).targetNote;
      const actualLetter = audioNote ? audioNote.replace(/\d$/, "") : concept.answerKey;
      const isTrue = rng() < 0.5;
      // For a false claim, swap to a nearby name.
      let claimedLetter = actualLetter;
      if (!isTrue) {
        const alt = distractorsForNoteName(actualLetter, simpleNames, 1, diff.distractorCloseness, rng);
        claimedLetter = alt[0] ?? actualLetter;
      }
      const isAudio = concept.category === "ear-note";
      const cfg: TrueFalseConfig = {
        prompt: isAudio ? "Listen and answer" : "Look and answer",
        claim: isAudio ? `The note you just heard is ${claimedLetter}` : `This note is ${claimedLetter}`,
        audioNote: isAudio ? audioNote : undefined,
        correctAnswer: isTrue,
      };
      return { kind: "exercise", type: "TRUE_FALSE", config: cfg };
    }
    case "ERROR_SPOTTING": {
      const c = concept.config as SightReadPianoConfig;
      const actual = c.targetNote;
      const actualLetter = actual.replace(/\d$/, "");
      const showWrong = rng() < 0.5;
      let shownLabel = actualLetter;
      if (showWrong) {
        const alt = distractorsForNoteName(actualLetter, simpleNames, 1, diff.distractorCloseness, rng);
        shownLabel = alt[0] ?? actualLetter;
      }
      const distractors = distractorsForNoteName(actualLetter, simpleNames, diff.choiceCount - 1, diff.distractorCloseness, rng);
      const cfg: ErrorSpottingConfig = {
        shownLabel,
        actualNote: actual,
        vexKey: c.vexKey,
        choices: shuffled([actualLetter, ...distractors], rng),
      };
      return { kind: "exercise", type: "ERROR_SPOTTING", config: cfg };
    }
    case "MATCHING_PAIRS": {
      const c = concept.config as EarSingleConfig;
      const target = c.targetNote;
      // 3 pairs (6 tiles): the concept's note plus 2 adjacents.
      const aMidi = noteStrToMidi(target);
      const adjacents = [aMidi + 2, aMidi - 2, aMidi + 5]
        .filter((m) => m >= 36 && m <= 84)
        .slice(0, 2)
        .map(midiToNoteStr);
      const notes = [target, ...adjacents];
      const cfg: MatchingPairsConfig = { notes };
      return { kind: "exercise", type: "MATCHING_PAIRS", config: cfg };
    }
    case "SEQUENCE_RECALL": {
      const c = concept.config as EarSingleConfig;
      const len = diff.distractorCloseness === "adjacent" ? 4 : diff.distractorCloseness === "mixed" ? 3 : 2;
      const aMidi = noteStrToMidi(c.targetNote);
      const seq: string[] = [c.targetNote];
      for (let i = 1; i < len; i++) {
        const step = (Math.floor(rng() * 5) - 2) || 1;
        const next = Math.max(36, Math.min(84, aMidi + step * i));
        seq.push(midiToNoteStr(next));
      }
      const oct = parseInt(c.targetNote.match(/(\d)$/)?.[1] ?? "4");
      const cfg: SequenceRecallConfig = {
        sequence: seq,
        octaveRange: [Math.max(3, oct - 1), Math.min(6, oct + 1)] as [number, number],
      };
      return { kind: "exercise", type: "SEQUENCE_RECALL", config: cfg };
    }
  }
}

// ─── Rhythm helpers ──────────────────────────────────────────────
const SYMBOL_BEATS: Record<NoteSymbol, number> = {
  whole_note: 4, half_note: 2, quarter_note: 1, eighth_note: 0.5,
  whole_rest: 4, half_rest: 2, quarter_rest: 1,
};
const SYMBOL_NOTES_POOL: NoteSymbol[] = ["whole_note", "half_note", "quarter_note", "eighth_note"];

function uniqueBeatChoices(correct: number, count: number, rng: () => number): number[] {
  const all = [0.5, 1, 2, 3, 4, 6, 8];
  const others = all.filter((b) => b !== correct);
  return shuffled([correct, ...shuffled(others, rng).slice(0, Math.max(1, count - 1))], rng);
}

function uniqueSymbolChoices(correct: NoteSymbol, count: number, rng: () => number): NoteSymbol[] {
  const others = SYMBOL_NOTES_POOL.filter((s) => s !== correct);
  return shuffled(others, rng).slice(0, count);
}

function makeRhythmPattern(_anchor: NoteSymbol, len: number, rng: () => number): NoteSymbol[] {
  // Sometimes start with the anchor; otherwise mix from the standard pool.
  return Array.from({ length: len }, () => pick(SYMBOL_NOTES_POOL, rng));
}

// Builds a pattern that sums to exactly 4 beats (one 4/4 measure). Greedy fill:
// pick a symbol whose duration fits in the remaining beats, biased away from
// eighth notes so practice tempo stays approachable.
function makeFourFourPattern(rng: () => number, closeness: "far" | "adjacent" | "mixed"): NoteSymbol[] {
  const out: NoteSymbol[] = [];
  let remaining = 4;
  // Weighted pool by closeness. Adjacent = harder = more eighths allowed.
  const weights: Record<NoteSymbol, number> =
    closeness === "adjacent"
      ? { whole_note: 1, half_note: 3, quarter_note: 6, eighth_note: 4, whole_rest: 0, half_rest: 0, quarter_rest: 0 }
      : closeness === "mixed"
      ? { whole_note: 1, half_note: 4, quarter_note: 6, eighth_note: 2, whole_rest: 0, half_rest: 0, quarter_rest: 0 }
      : { whole_note: 2, half_note: 5, quarter_note: 5, eighth_note: 1, whole_rest: 0, half_rest: 0, quarter_rest: 0 };

  while (remaining > 0) {
    const candidates = SYMBOL_NOTES_POOL.filter((s) => SYMBOL_BEATS[s] <= remaining + 1e-6);
    // Build weighted pool. Eighth notes only valid in pairs (no orphan halves of a beat).
    const pool: NoteSymbol[] = [];
    for (const s of candidates) {
      if (s === "eighth_note" && remaining < 1) continue;
      const w = weights[s] || 0;
      for (let i = 0; i < w; i++) pool.push(s);
    }
    if (pool.length === 0) break;
    const choice = pool[Math.floor(rng() * pool.length)];
    if (choice === "eighth_note") {
      // Always add eighths in pairs so total stays on whole-beat boundaries
      out.push("eighth_note", "eighth_note");
      remaining -= 1;
    } else {
      out.push(choice);
      remaining -= SYMBOL_BEATS[choice];
    }
  }
  // Safety pad: if remaining > 0 (numeric drift), fill with quarter
  while (remaining >= 1 - 1e-6) { out.push("quarter_note"); remaining -= 1; }
  return out;
}

function mutatePattern(p: NoteSymbol[], rng: () => number): NoteSymbol[] {
  const out = [...p];
  const idx = Math.floor(rng() * out.length);
  const alt = SYMBOL_NOTES_POOL.filter((s) => s !== out[idx]);
  out[idx] = pick(alt, rng);
  return out;
}

function arraysEqual<T>(a: T[], b: T[]): boolean {
  return a.length === b.length && a.every((v, i) => v === b[i]);
}

// Some types only work for certain concept data. E.g. FREE_PICK_KEYBOARD
// renders white keys only, so sharp/flat targets are unanswerable there.
function typeIsValidFor(_type: ExerciseType, _concept: Concept): boolean {
  // Reserved for future per-concept type gating. All current types support
  // both natural and chromatic notes via the shared Keyboard component.
  return true;
}

// ─── Type picker honoring anti-repeat constraints ──────────────────
function pickType(
  concept: Concept,
  recentTypes: ExerciseType[], // most recent last
  rng: () => number,
  forceGentle: boolean
): ExerciseType {
  if (forceGentle) return GENTLEST_TYPE[concept.category];
  const pool = CONCEPT_TYPE_POOL[concept.category].filter((t) => typeIsValidFor(t, concept));
  if (pool.length === 1) return pool[0];
  // Hard: not equal to last
  const last = recentTypes[recentTypes.length - 1];
  const allowedHard = pool.filter((t) => t !== last);
  // Soft: avoid last 3
  const allowedSoft = allowedHard.filter((t) => !recentTypes.slice(-3).includes(t));
  const choice = allowedSoft.length > 0 ? allowedSoft : allowedHard.length > 0 ? allowedHard : pool;
  return pick(choice, rng);
}

// ─── Teach slide builders ──────────────────────────────────────────
function introTeachFor(concept: Concept): TeachStep {
  switch (concept.exerciseType) {
    case "EAR_SINGLE": {
      const c = concept.config as EarSingleConfig;
      return {
        kind: "teach", icon: "hearing",
        title: `Meet Note ${c.correctAnswer}`,
        body: `Listen to Note ${c.correctAnswer}. Your goal is to recognize it by ear.`,
        playNote: c.targetNote,
      };
    }
    case "PITCH_MATCH": {
      const c = concept.config as { targetNote: string; displayNote: string };
      return {
        kind: "teach", icon: "mic",
        title: `Sing Note ${c.displayNote}`,
        body: `Press play to hear note ${c.displayNote}, then match it with your voice.`,
        playNote: c.targetNote,
      };
    }
    case "SIGHT_READ_PIANO": {
      const c = concept.config as { targetNote: string };
      const name = c.targetNote.replace(/\d$/, "");
      return {
        kind: "teach", icon: "music_note",
        title: `Reading ${name} on the Staff`,
        body: `Find note ${name} on the staff, then click the matching piano key.`,
      };
    }
    case "INTERVAL_ID": {
      const c = concept.config as IntervalIdConfig;
      return {
        kind: "teach", icon: "piano",
        title: `The ${c.correctAnswer}`,
        body: `Every interval has its own character. Press play to hear this one.`,
        playInterval: [c.noteA, c.noteB],
      };
    }
    case "EAR_MULTI": {
      const c = concept.config as EarMultiConfig;
      return {
        kind: "teach", icon: "queue_music",
        title: `Chord: ${c.correctAnswers.join(" + ")}`,
        body: `A chord is multiple notes at once. Pick out each note you hear.`,
        playNotes: c.targetNotes,
      };
    }
    case "NOTE_VALUE_ID": {
      const c = concept.config as NoteValueConfig;
      return {
        kind: "teach", icon: "music_note",
        title: `The ${c.correctAnswer}`,
        body: `Learn to recognize this symbol on sight.`,
      };
    }
    default:
      throw new Error(`introTeachFor: no intro copy for ${concept.exerciseType}`);
  }
}

function midTeach(): TeachStep {
  return {
    kind: "teach", icon: "tips_and_updates",
    title: "Halfway There",
    body: "Keep going. Old material is mixed in with new — stay alert.",
  };
}
function finalTeach(): TeachStep {
  return {
    kind: "teach", icon: "emoji_events",
    title: "Final Stretch",
    body: "Last exercises. Trust what you have learned.",
  };
}
function reviewTeach(): TeachStep {
  return {
    kind: "teach", icon: "shuffle",
    title: "Mix It Up",
    body: "Old concepts return now. Any of them could appear.",
  };
}

// ─── Mastery snapshot read by the slot algo ────────────────────────
export interface MasterySnapshot {
  masteryScore: number;   // 0..1, EMA of recent accuracy
  currentStreak: number;
  timesSeen: number;
  nextReviewAt: Date;
}

// ─── Review-queue pull: recency × weakness × already-asked penalty ─
function pickReviewConcept(
  priorConcepts: Concept[],
  recency: Map<string, number>,
  recentlyAskedIds: string[],
  masteryMap: Map<string, MasterySnapshot> | undefined,
  rng: () => number
): Concept | null {
  if (priorConcepts.length === 0) return null;
  const scored = priorConcepts.map((c) => {
    const ago = recency.get(c.id) ?? 99;
    const staleness = Math.min(ago, 10);
    const m = masteryMap?.get(c.id);
    // Weakness boost: weak concepts (low mastery) score much higher.
    // Range: 0 (mastered) to 8 (never-correct).
    const weakness = m ? (1 - m.masteryScore) * 8 : 4; // unseen → moderate priority
    // Penalize if already asked this lesson — reduces clumping.
    const penalty = recentlyAskedIds.filter((id) => id === c.id).length * 5;
    return { concept: c, score: staleness + weakness - penalty + rng() * 2 };
  });
  scored.sort((a, b) => b.score - a.score);
  const top = scored.slice(0, 3);
  return pick(top, rng).concept;
}

// ─── Main slot algorithm ───────────────────────────────────────────
export interface SlotPlanInput {
  newConcepts: Concept[];          // concepts the lesson introduces
  reviewPoolConcepts: Concept[];   // explicit review pool (e.g. consolidationConfigs)
  priorConcepts: Concept[];        // everything from earlier lessons
  recency: Map<string, number>;    // conceptId → lessons ago
  difficulty: Difficulty;
  seed: number;
  slotCount?: number;              // default 12
  reviewRatio?: number;            // 0..1 fraction pulled from review. Default: scales with priorConcepts size.
  masteryMap?: Map<string, MasterySnapshot>;
}

export function generateSlotPlan(input: SlotPlanInput): LessonStep[] {
  const slotCount = input.slotCount ?? 12;
  const rng = createRng(input.seed);
  const steps: LessonStep[] = [];

  const hasNew = input.newConcepts.length > 0;
  const hasReview = input.reviewPoolConcepts.length > 0 || input.priorConcepts.length > 0;

  // Decide review ratio. Pure-review lessons (no new concepts) → 100% review.
  // Lessons with new concepts and no prior history → 0%. Otherwise default 0.4.
  let reviewRatio: number;
  if (input.reviewRatio !== undefined) reviewRatio = input.reviewRatio;
  else if (!hasNew) reviewRatio = 1.0;
  else if (!hasReview) reviewRatio = 0.0;
  else reviewRatio = 0.4;

  // Pre-build slot intent array
  type Intent = { isReview: boolean; conceptHint?: Concept; isIntro?: boolean };
  const intents: Intent[] = [];

  // Reserve first 1-2 slots per new concept for gentle introduction (not review).
  const introsNeeded = Math.min(input.newConcepts.length * 2, slotCount);
  let cursor = 0;
  for (let i = 0; i < input.newConcepts.length && cursor + 1 < slotCount; i++) {
    const c = input.newConcepts[i];
    intents[cursor++] = { isReview: false, conceptHint: c, isIntro: true };
    if (cursor < slotCount) intents[cursor++] = { isReview: false, conceptHint: c, isIntro: true };
  }

  // Fill the rest based on review ratio
  for (let i = cursor; i < slotCount; i++) {
    const r = rng();
    intents[i] = { isReview: hasReview && r < reviewRatio };
  }

  // Pre-compute teach insertion points (each fires at most once).
  // Map<slotIndex, TeachStep[]> — teaches are inserted BEFORE that slot.
  const teachPoints = new Map<number, TeachStep[]>();
  const addTeach = (slotIdx: number, t: TeachStep) => {
    const list = teachPoints.get(slotIdx) ?? [];
    list.push(t);
    teachPoints.set(slotIdx, list);
  };
  if (hasNew) {
    addTeach(0, introTeachFor(input.newConcepts[0]));
    if (input.newConcepts.length > 1) addTeach(2, introTeachFor(input.newConcepts[1]));
    if (hasReview && introsNeeded < slotCount) addTeach(introsNeeded, reviewTeach());
  } else if (hasReview) {
    addTeach(0, reviewTeach());
  }
  const midIdx = Math.floor(slotCount / 2);
  const finalIdx = Math.floor(slotCount * 0.85);
  if (!teachPoints.has(midIdx) && midIdx > 1) addTeach(midIdx, midTeach());
  if (!teachPoints.has(finalIdx) && finalIdx > midIdx + 1) addTeach(finalIdx, finalTeach());

  // Walk slots, build steps
  const recentTypes: ExerciseType[] = [];
  const recentAnswerKeys: string[] = [];
  const recentConceptIds: string[] = [];
  const askedConceptIdsThisLesson: string[] = [];

  for (let i = 0; i < slotCount; i++) {
    const progress = i / Math.max(1, slotCount - 1);
    const intent = intents[i];

    const teaches = teachPoints.get(i);
    if (teaches) for (const t of teaches) steps.push(t);

    // Pick the concept
    let concept: Concept | null = null;
    if (intent.conceptHint) {
      concept = intent.conceptHint;
    } else if (intent.isReview) {
      const pool = input.reviewPoolConcepts.length > 0 ? input.reviewPoolConcepts : input.priorConcepts;
      concept = pickReviewConcept(pool, input.recency, askedConceptIdsThisLesson, input.masteryMap, rng);
      if (!concept && hasNew) concept = pick(input.newConcepts, rng);
    } else {
      // New-bucket but not pre-reserved → cycle through new concepts avoiding repeats
      const candidates = input.newConcepts.filter((c) => c.id !== recentConceptIds[recentConceptIds.length - 1]);
      concept = candidates.length > 0 ? pick(candidates, rng) : pick(input.newConcepts, rng);
    }
    if (!concept) {
      // Fallback: any prior + new
      const all = [...input.newConcepts, ...input.priorConcepts, ...input.reviewPoolConcepts];
      if (all.length === 0) continue;
      concept = pick(all, rng);
    }

    // Avoid back-to-back same correct answer where possible
    const lastAnswer = recentAnswerKeys[recentAnswerKeys.length - 1];
    if (concept.answerKey === lastAnswer && intent.isReview) {
      const pool = input.reviewPoolConcepts.length > 0 ? input.reviewPoolConcepts : input.priorConcepts;
      const alt = pool.find((c) => c.answerKey !== lastAnswer && c.id !== concept!.id);
      if (alt) concept = alt;
    }

    // Pick the exercise type (anti-repeat hard constraint)
    const forceGentle = intent.isIntro === true;
    const type = pickType(concept, recentTypes, rng, forceGentle);

    // Build difficulty + step (mastery-aware for known concepts)
    const mastery = input.masteryMap?.get(concept.id)?.masteryScore;
    const diff = slotDifficulty(progress, input.difficulty, intent.isReview, mastery);
    const step = fillSlot(concept, type, diff, input.difficulty, rng);
    step.conceptId = concept.id;
    steps.push(step);

    // Track recents
    recentTypes.push(type);
    recentAnswerKeys.push(concept.answerKey);
    recentConceptIds.push(concept.id);
    askedConceptIdsThisLesson.push(concept.id);
  }

  return steps;
}
