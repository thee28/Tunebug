import type {
  ExerciseType,
  IntervalName,
  EarSingleConfig,
  EarMultiConfig,
  IntervalIdConfig,
  NoteValueConfig,
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
interface SlotDifficulty {
  choiceCount: number;
  distractorCloseness: "far" | "adjacent" | "mixed";
}
function slotDifficulty(progress: number, base: Difficulty, isReview: boolean): SlotDifficulty {
  const baseCount = DIFFICULTY_SETTINGS[base].choiceCount;
  // Start with 2-3 fewer choices, grow toward base count by end of lesson.
  const minCount = Math.max(2, baseCount - 2);
  const count = Math.round(minCount + (baseCount - minCount) * progress);
  // Review pulls are always at least "adjacent" — they're testing retention.
  if (isReview) return { choiceCount: count, distractorCloseness: progress < 0.5 ? "mixed" : "adjacent" };
  if (progress < 0.33) return { choiceCount: count, distractorCloseness: "far" };
  if (progress < 0.66) return { choiceCount: count, distractorCloseness: "mixed" };
  return { choiceCount: count, distractorCloseness: "adjacent" };
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
  }
}

// ─── Type picker honoring anti-repeat constraints ──────────────────
function pickType(
  concept: Concept,
  recentTypes: ExerciseType[], // most recent last
  rng: () => number,
  forceGentle: boolean
): ExerciseType {
  if (forceGentle) return GENTLEST_TYPE[concept.category];
  const pool = CONCEPT_TYPE_POOL[concept.category];
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

// ─── Review-queue pull (Phase 1: recency-weighted, no per-user state) ─
function pickReviewConcept(
  priorConcepts: Concept[],
  recency: Map<string, number>,
  recentlyAskedIds: string[],
  rng: () => number
): Concept | null {
  if (priorConcepts.length === 0) return null;
  // Score each prior concept. Phase 3 will fold in mastery weakness.
  const scored = priorConcepts.map((c) => {
    const ago = recency.get(c.id) ?? 99;
    // Staleness boost: longer-unseen = higher weight. Cap at 10.
    const staleness = Math.min(ago, 10);
    // Penalize if asked already in this lesson
    const penalty = recentlyAskedIds.filter((id) => id === c.id).length * 5;
    return { concept: c, score: staleness * 1.0 - penalty + rng() * 2 };
  });
  scored.sort((a, b) => b.score - a.score);
  // Pick from top 3 with some randomness so it's not deterministic
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
      concept = pickReviewConcept(pool, input.recency, askedConceptIdsThisLesson, rng);
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

    // Build difficulty + step
    const diff = slotDifficulty(progress, input.difficulty, intent.isReview);
    const step = fillSlot(concept, type, diff, input.difficulty, rng);
    steps.push(step);

    // Track recents
    recentTypes.push(type);
    recentAnswerKeys.push(concept.answerKey);
    recentConceptIds.push(concept.id);
    askedConceptIdsThisLesson.push(concept.id);
  }

  return steps;
}
