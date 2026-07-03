import { describe, it, expect } from "vitest";
import { generateSlotPlan } from "@/lib/curriculum/slotGenerator";
import type { Concept } from "@/lib/curriculum/concepts";
import type { HigherLowerConfig, OddOneOutConfig, EarSingleConfig } from "@/types/music";

function earNoteConcept(targetNote: string): Concept {
  const config: EarSingleConfig = {
    targetNote,
    choices: [targetNote],
    correctAnswer: targetNote,
  };
  return {
    id: `test-${targetNote}`,
    category: "ear-note",
    exerciseType: "EAR_SINGLE",
    config,
    answerKey: targetNote,
  };
}

// C2 (midi 36) and C6 (midi 84) sit exactly on the generator's clamp range.
// The old code clamped random offsets back onto the target note, producing
// HIGHER_LOWER questions with two identical pitches and ODD_ONE_OUT rounds
// with no odd note.
const EDGE_NOTES = ["C2", "C6"];

describe("generateSlotPlan edge-of-range notes", () => {
  for (const note of EDGE_NOTES) {
    it(`never generates HIGHER_LOWER with identical pitches (${note})`, () => {
      for (let seed = 0; seed < 300; seed++) {
        const steps = generateSlotPlan({
          newConcepts: [earNoteConcept(note)],
          reviewPoolConcepts: [],
          priorConcepts: [],
          recency: new Map(),
          difficulty: "advanced",
          seed,
        });
        for (const step of steps) {
          if (step.kind === "exercise" && step.type === "HIGHER_LOWER") {
            const cfg = step.config as HigherLowerConfig;
            expect(cfg.noteB).not.toBe(cfg.noteA);
          }
        }
      }
    });

    it(`ODD_ONE_OUT always contains a distinct odd note (${note})`, () => {
      for (let seed = 0; seed < 300; seed++) {
        const steps = generateSlotPlan({
          newConcepts: [earNoteConcept(note)],
          reviewPoolConcepts: [],
          priorConcepts: [],
          recency: new Map(),
          difficulty: "advanced",
          seed,
        });
        for (const step of steps) {
          if (step.kind === "exercise" && step.type === "ODD_ONE_OUT") {
            const cfg = step.config as OddOneOutConfig;
            const odd = cfg.notes[cfg.oddIndex];
            const others = cfg.notes.filter((_, i) => i !== cfg.oddIndex);
            for (const other of others) {
              expect(odd).not.toBe(other);
            }
          }
        }
      }
    });
  }
});
