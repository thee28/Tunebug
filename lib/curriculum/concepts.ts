import type {
  ExerciseConfig,
  ExerciseType,
  EarSingleConfig,
  EarMultiConfig,
  IntervalIdConfig,
  PitchMatchConfig,
  SightReadPianoConfig,
  NoteValueConfig,
} from "@/types/music";
import type { CurriculumLesson } from "./config";
import { CURRICULUM } from "./config";

export type ConceptCategory =
  | "ear-note"
  | "sing-note"
  | "staff-note"
  | "ear-interval"
  | "ear-chord"
  | "rhythm-symbol";

export interface Concept {
  id: string;
  category: ConceptCategory;
  exerciseType: ExerciseType;
  config: ExerciseConfig;
  // Used for anti-repeat ("don't ask the same correct answer twice in a row")
  answerKey: string;
}

// Per-category pool of exercise types the slot algorithm may pick from.
export const CONCEPT_TYPE_POOL: Record<ConceptCategory, ExerciseType[]> = {
  "ear-note":      ["EAR_SINGLE", "SAME_DIFFERENT", "HIGHER_LOWER", "ODD_ONE_OUT", "FREE_PICK_KEYBOARD"],
  "sing-note":     ["PITCH_MATCH"],
  "staff-note":    ["SIGHT_READ_PIANO"],
  "ear-interval":  ["INTERVAL_ID"],
  "ear-chord":     ["EAR_MULTI"],
  "rhythm-symbol": ["NOTE_VALUE_ID"],
};

// Gentlest type for the very first 1-2 questions on a brand-new concept.
export const GENTLEST_TYPE: Record<ConceptCategory, ExerciseType> = {
  "ear-note": "EAR_SINGLE",
  "sing-note": "PITCH_MATCH",
  "staff-note": "SIGHT_READ_PIANO",
  "ear-interval": "INTERVAL_ID",
  "ear-chord": "EAR_MULTI",
  "rhythm-symbol": "NOTE_VALUE_ID",
};

function categoryForType(type: ExerciseType): ConceptCategory {
  switch (type) {
    case "EAR_SINGLE":      return "ear-note";
    case "PITCH_MATCH":     return "sing-note";
    case "SIGHT_READ_PIANO":return "staff-note";
    case "INTERVAL_ID":     return "ear-interval";
    case "EAR_MULTI":       return "ear-chord";
    case "NOTE_VALUE_ID":   return "rhythm-symbol";
    default:
      throw new Error(`No concept category for exercise type ${type} — curriculum lessons only use the 6 base types.`);
  }
}

function configToConcept(type: ExerciseType, config: ExerciseConfig): Concept {
  const category = categoryForType(type);
  switch (type) {
    case "EAR_SINGLE": {
      const c = config as EarSingleConfig;
      return { id: `ear-note:${c.targetNote}`, category, exerciseType: type, config: c, answerKey: c.correctAnswer };
    }
    case "PITCH_MATCH": {
      const c = config as PitchMatchConfig;
      return { id: `sing-note:${c.targetNote}`, category, exerciseType: type, config: c, answerKey: c.displayNote };
    }
    case "SIGHT_READ_PIANO": {
      const c = config as SightReadPianoConfig;
      return { id: `staff-note:${c.targetNote}`, category, exerciseType: type, config: c, answerKey: c.targetNote };
    }
    case "INTERVAL_ID": {
      const c = config as IntervalIdConfig;
      return { id: `ear-interval:${c.correctAnswer}`, category, exerciseType: type, config: c, answerKey: c.correctAnswer };
    }
    case "EAR_MULTI": {
      const c = config as EarMultiConfig;
      return {
        id: `ear-chord:${[...c.targetNotes].sort().join("-")}`,
        category, exerciseType: type, config: c,
        answerKey: [...c.correctAnswers].sort().join("+"),
      };
    }
    case "NOTE_VALUE_ID": {
      const c = config as NoteValueConfig;
      return { id: `rhythm:${c.symbol}`, category, exerciseType: type, config: c, answerKey: c.correctAnswer };
    }
    default:
      throw new Error(`configToConcept: unsupported exercise type ${type}`);
  }
}

// Pulls every distinct concept the lesson teaches (primary + secondary + consolidation pool).
export function deriveConcepts(lesson: CurriculumLesson): Concept[] {
  const out: Concept[] = [];
  const seen = new Set<string>();
  const push = (c: Concept) => {
    if (!seen.has(c.id)) { seen.add(c.id); out.push(c); }
  };
  push(configToConcept(lesson.exerciseType, lesson.exerciseConfig));
  if (lesson.secondaryExerciseConfig) {
    push(configToConcept(lesson.exerciseType, lesson.secondaryExerciseConfig));
  }
  if (lesson.consolidationConfigs) {
    for (const cfg of lesson.consolidationConfigs) {
      push(configToConcept(lesson.exerciseType, cfg));
    }
  }
  return out;
}

// Concepts a lesson explicitly INTRODUCES (vs. reviews).
// Heuristic:
// - secondaryExerciseConfig present and no consolidationConfigs → primary + secondary are both new
// - consolidationConfigs only (reinforceWithPrior false) → all consolidation entries are review; nothing new
// - reinforceWithPrior true → primary is new, consolidation entries are review pool
// - else (just primary) → primary is new
export function newConceptsFor(lesson: CurriculumLesson): Concept[] {
  if (lesson.consolidationConfigs && !lesson.reinforceWithPrior) {
    return []; // pure review lesson — every concept is a review pull
  }
  const primary = configToConcept(lesson.exerciseType, lesson.exerciseConfig);
  if (lesson.secondaryExerciseConfig) {
    const secondary = configToConcept(lesson.exerciseType, lesson.secondaryExerciseConfig);
    return primary.id === secondary.id ? [primary] : [primary, secondary];
  }
  return [primary];
}

// Flat list of every lesson, in stage→unit→order. Lazy memoized.
let _flatLessonsCache: { slug: string; lesson: CurriculumLesson; index: number }[] | null = null;
function flatLessons() {
  if (_flatLessonsCache) return _flatLessonsCache;
  const out: { slug: string; lesson: CurriculumLesson; index: number }[] = [];
  let i = 0;
  for (const stage of CURRICULUM) {
    for (const unit of stage.units) {
      for (const lesson of unit.lessons) {
        out.push({ slug: lesson.slug, lesson, index: i++ });
      }
    }
  }
  _flatLessonsCache = out;
  return out;
}

// Every concept the user has been exposed to in prior lessons.
// Deduplicated by concept id (first appearance wins so we keep its config).
export function getPriorConcepts(currentSlug: string): Concept[] {
  const flat = flatLessons();
  const curIdx = flat.findIndex((l) => l.slug === currentSlug);
  if (curIdx <= 0) return [];
  const seen = new Set<string>();
  const out: Concept[] = [];
  for (let i = 0; i < curIdx; i++) {
    for (const c of deriveConcepts(flat[i].lesson)) {
      if (!seen.has(c.id)) { seen.add(c.id); out.push(c); }
    }
  }
  return out;
}

// How recently each prior concept was last seen — drives staleness boost.
// Returns Map<conceptId, lessonsAgo> where 1 = previous lesson.
export function getConceptRecency(currentSlug: string): Map<string, number> {
  const flat = flatLessons();
  const curIdx = flat.findIndex((l) => l.slug === currentSlug);
  const out = new Map<string, number>();
  if (curIdx <= 0) return out;
  for (let i = curIdx - 1; i >= 0; i--) {
    const ago = curIdx - i;
    for (const c of deriveConcepts(flat[i].lesson)) {
      if (!out.has(c.id)) out.set(c.id, ago);
    }
  }
  return out;
}
