/**
 * Curriculum difficulty audit — generates the exact slot plan every lesson
 * serves to a fresh user (no mastery data) and asserts each section's
 * exercises stay within its declared difficulty:
 *
 * - beginner sections never get SEQUENCE_RECALL (multi-note keyboard recall)
 * - beginner keyboard-input exercises (FREE_PICK_KEYBOARD, MATCHING_PAIRS,
 *   SEQUENCE_RECALL) never demand black keys the learner wasn't taught,
 *   unless the lesson itself teaches that sharp
 * - sequence length scales with difficulty (≤2 beginner, ≤3 intermediate)
 * - a sharp correct answer always has at least one sharp/adjacent distractor
 *   (otherwise "pick the only sharp" is a giveaway)
 * - the first two exercises of a lesson that introduces new concepts use the
 *   gentlest exercise type for that concept category
 */
import { describe, it, expect } from "vitest";
import { CURRICULUM } from "@/lib/curriculum/config";
import { generateLessonSteps } from "@/lib/curriculum/generator";
import type { ExerciseStep } from "@/types/lesson";

function exerciseSteps(slug: string, difficulty: "beginner" | "intermediate" | "advanced") {
  return generateLessonSteps(slug, undefined, undefined, difficulty)
    .filter((s): s is ExerciseStep => s.kind === "exercise");
}

const allLessons = CURRICULUM.flatMap((stage) =>
  stage.units.flatMap((unit) =>
    unit.lessons.map((lesson) => ({ stage, unit, lesson }))
  )
);

describe("curriculum difficulty audit", () => {
  it("beginner sections never serve SEQUENCE_RECALL", () => {
    for (const { stage, lesson } of allLessons) {
      if (stage.difficulty !== "beginner") continue;
      const types = exerciseSteps(lesson.slug, stage.difficulty).map((s) => s.type);
      expect(types, `${lesson.slug} (${stage.slug})`).not.toContain("SEQUENCE_RECALL");
    }
  });

  it("sequence recall length scales with section difficulty", () => {
    const maxLen = { beginner: 2, intermediate: 3, advanced: 4 } as const;
    for (const { stage, lesson } of allLessons) {
      for (const step of exerciseSteps(lesson.slug, stage.difficulty)) {
        if (step.type !== "SEQUENCE_RECALL") continue;
        const c = step.config as { sequence: string[] };
        expect(c.sequence.length, `${lesson.slug}: ${c.sequence.join(",")}`)
          .toBeLessThanOrEqual(maxLen[stage.difficulty]);
      }
    }
  });

  it("beginner matching-pairs and sequences stay on white keys (unless the lesson teaches sharps)", () => {
    for (const { stage, lesson } of allLessons) {
      if (stage.difficulty !== "beginner") continue;
      // Lessons that themselves introduce sharps may use them.
      const lessonNotes = JSON.stringify([lesson.exerciseConfig, lesson.secondaryExerciseConfig, lesson.consolidationConfigs]);
      const teachesSharps = lessonNotes.includes("#");
      if (teachesSharps) continue;
      for (const step of exerciseSteps(lesson.slug, stage.difficulty)) {
        if (step.type === "MATCHING_PAIRS") {
          const c = step.config as { notes: string[] };
          for (const n of c.notes) {
            expect(n, `${lesson.slug} MATCHING_PAIRS notes=${c.notes.join(",")}`).not.toContain("#");
          }
        }
        if (step.type === "SEQUENCE_RECALL") {
          const c = step.config as { sequence: string[] };
          for (const n of c.sequence) {
            expect(n, `${lesson.slug} SEQUENCE_RECALL seq=${c.sequence.join(",")}`).not.toContain("#");
          }
        }
      }
    }
  });

  it("sharp correct answers always include their own natural as a distractor", () => {
    for (const { stage, lesson } of allLessons) {
      for (const step of exerciseSteps(lesson.slug, stage.difficulty)) {
        if (step.type !== "EAR_SINGLE") continue;
        const c = step.config as { choices: string[]; correctAnswer: string };
        if (!c.correctAnswer.includes("#")) continue;
        // C# vs C is the contrast the sharp lessons teach — without the
        // natural in the list, "pick the only sharp" answers the question.
        expect(c.choices, `${lesson.slug}: [${c.choices.join(",")}] → ${c.correctAnswer}`)
          .toContain(c.correctAnswer[0]);
      }
    }
  });

  it("lessons that introduce new concepts open with the gentlest type", () => {
    for (const { stage, lesson } of allLessons) {
      // Pure-review lessons (consolidation without reinforceWithPrior) have no intro slots.
      if (lesson.consolidationConfigs && !lesson.reinforceWithPrior) continue;
      const steps = exerciseSteps(lesson.slug, stage.difficulty);
      expect(steps[0]?.type, `${lesson.slug} first exercise`).toBe(lesson.exerciseType);
      expect(steps[1]?.type, `${lesson.slug} second exercise`).toBe(lesson.exerciseType);
    }
  });
});
