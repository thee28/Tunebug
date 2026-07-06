import type { ExerciseType } from "@/types/music";
import type { ExerciseStep } from "@/types/lesson";
import { CURRICULUM } from "./config";
import { deriveConcepts, CONCEPT_TYPE_POOL, type Concept } from "./concepts";
import { createRng, fillSlot, slotDifficulty } from "./slotGenerator";
import type { Difficulty } from "./content";

export const SECTION_TEST_QUESTION_COUNT = 15;
export const SECTION_TEST_HEARTS = 3;

function shuffled<T>(arr: T[], rng: () => number): T[] {
  const r = [...arr];
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
}

function pick<T>(arr: T[], rng: () => number): T {
  return arr[Math.floor(rng() * arr.length)];
}

// Every distinct concept a stage teaches, in lesson order.
// Skips sing-note concepts: PITCH_MATCH needs a microphone, and a jump test
// must not fail someone over a browser permission.
function stageConcepts(stageIndex: number): Concept[] {
  const stage = CURRICULUM[stageIndex];
  if (!stage) return [];
  const seen = new Set<string>();
  const out: Concept[] = [];
  for (const unit of stage.units) {
    for (const lesson of unit.lessons) {
      for (const c of deriveConcepts(lesson)) {
        if (c.category === "sing-note") continue;
        if (!seen.has(c.id)) {
          seen.add(c.id);
          out.push(c);
        }
      }
    }
  }
  return out;
}

// Type picker with the same anti-repeat constraints as the lesson slot
// algorithm: never the same type twice in a row, avoid the last 3 if possible.
function pickTestType(concept: Concept, recentTypes: ExerciseType[], rng: () => number): ExerciseType {
  const pool = CONCEPT_TYPE_POOL[concept.category];
  if (pool.length === 1) return pool[0];
  const last = recentTypes[recentTypes.length - 1];
  const allowedHard = pool.filter((t) => t !== last);
  const allowedSoft = allowedHard.filter((t) => !recentTypes.slice(-3).includes(t));
  const choice = allowedSoft.length > 0 ? allowedSoft : allowedHard.length > 0 ? allowedHard : pool;
  return pick(choice, rng);
}

export interface SectionTestPlan {
  steps: ExerciseStep[];
  difficulty: Difficulty;
}

// Builds the question list for a jump-ahead test. Covers every stage in
// [fromStageIndex, toStageIndex) — i.e. everything the user is skipping over —
// by dealing questions round-robin across the covered stages so a multi-section
// jump can't pass on Section 1 material alone. Difficulty escalates through
// the test and is anchored to the hardest (latest) covered stage.
export function generateSectionTestSteps(
  fromStageIndex: number,
  toStageIndex: number,
  seed: number
): SectionTestPlan {
  const from = Math.max(0, fromStageIndex);
  const to = Math.min(toStageIndex, CURRICULUM.length);
  if (to <= from) {
    throw new Error(`Section test needs at least one covered stage (got ${fromStageIndex}..${toStageIndex})`);
  }

  const rng = createRng(seed);
  const difficulty = CURRICULUM[to - 1].difficulty;

  // Per-stage shuffled concept queues; each queue reshuffles when exhausted
  // so small early sections can still fill their share of questions.
  const queues = [];
  for (let si = from; si < to; si++) {
    const concepts = stageConcepts(si);
    if (concepts.length > 0) {
      queues.push({ pool: concepts, queue: shuffled(concepts, rng) });
    }
  }
  if (queues.length === 0) {
    throw new Error(`Section test has no testable concepts for stages ${from}..${to - 1}`);
  }

  const steps: ExerciseStep[] = [];
  const recentTypes: ExerciseType[] = [];
  let lastAnswerKey: string | null = null;
  let qi = 0;

  for (let i = 0; i < SECTION_TEST_QUESTION_COUNT; i++) {
    const q = queues[qi % queues.length];
    qi++;
    if (q.queue.length === 0) q.queue = shuffled(q.pool, rng);
    let concept = q.queue.shift()!;

    // Avoid back-to-back identical correct answers when the queue allows it.
    if (concept.answerKey === lastAnswerKey && q.queue.length > 0) {
      const altIdx = q.queue.findIndex((c) => c.answerKey !== lastAnswerKey);
      if (altIdx >= 0) {
        const alt = q.queue.splice(altIdx, 1)[0];
        q.queue.unshift(concept);
        concept = alt;
      }
    }

    const progress = i / Math.max(1, SECTION_TEST_QUESTION_COUNT - 1);
    const type = pickTestType(concept, recentTypes, rng);
    const diff = slotDifficulty(progress, difficulty, true);
    const step = fillSlot(concept, type, diff, difficulty, rng);
    step.conceptId = concept.id;
    steps.push(step);

    recentTypes.push(type);
    lastAnswerKey = concept.answerKey;
  }

  return { steps, difficulty };
}
