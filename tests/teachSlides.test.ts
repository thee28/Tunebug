import { describe, it, expect } from "vitest";
import { CURRICULUM } from "@/lib/curriculum/config";
import { newConceptsFor } from "@/lib/curriculum/concepts";
import { generateLessonSteps } from "@/lib/curriculum/generator";
import type { TeachStep } from "@/types/lesson";
import type {
  EarSingleConfig,
  EarMultiConfig,
  IntervalIdConfig,
  PitchMatchConfig,
  SightReadPianoConfig,
  NoteValueConfig,
} from "@/types/music";

// Every lesson's intro teach slides must show or play exactly the concept
// being introduced: the right symbol glyph, the right staff position, the
// right audio. Guards against e.g. a whole-note lesson showing a generic
// quarter-note icon.
describe("intro teach slides match the introduced concept", () => {
  const allLessons = CURRICULUM.flatMap((s) =>
    s.units.flatMap((u) => u.lessons.map((l) => ({ stage: s, lesson: l })))
  );

  for (const { stage, lesson } of allLessons) {
    const newConcepts = newConceptsFor(lesson);
    if (newConcepts.length === 0) continue; // pure review lesson, no intro

    it(`${lesson.slug} (${lesson.title})`, () => {
      const steps = generateLessonSteps(
        lesson.slug,
        lesson.exerciseType,
        lesson.exerciseConfig,
        stage.difficulty,
        lesson.secondaryExerciseConfig,
        lesson.consolidationConfigs,
        lesson.reinforceWithPrior
      );
      const teaches = steps.filter((s): s is TeachStep => s.kind === "teach");
      // Intro slides come first, one per new concept (up to 2).
      const intros = teaches.slice(0, Math.min(newConcepts.length, 2));
      expect(intros.length).toBeGreaterThan(0);

      intros.forEach((teach, i) => {
        const concept = newConcepts[i];
        switch (concept.exerciseType) {
          case "NOTE_VALUE_ID": {
            const c = concept.config as NoteValueConfig;
            expect(teach.symbol).toBe(c.symbol);
            expect(teach.title).toContain(c.correctAnswer);
            break;
          }
          case "SIGHT_READ_PIANO": {
            const c = concept.config as SightReadPianoConfig;
            expect(teach.vexKey).toBe(c.vexKey);
            expect(teach.title).toContain(c.targetNote.replace(/\d$/, ""));
            break;
          }
          case "EAR_SINGLE": {
            const c = concept.config as EarSingleConfig;
            expect(teach.playNote).toBe(c.targetNote);
            expect(teach.title).toContain(c.correctAnswer);
            break;
          }
          case "PITCH_MATCH": {
            const c = concept.config as PitchMatchConfig;
            expect(teach.playNote).toBe(c.targetNote);
            expect(teach.title).toContain(c.displayNote);
            break;
          }
          case "INTERVAL_ID": {
            const c = concept.config as IntervalIdConfig;
            expect(teach.playInterval).toEqual([c.noteA, c.noteB]);
            expect(teach.title).toContain(c.correctAnswer);
            break;
          }
          case "EAR_MULTI": {
            const c = concept.config as EarMultiConfig;
            expect(teach.playNotes).toEqual(c.targetNotes);
            break;
          }
          default:
            throw new Error(`Unexpected intro concept type ${concept.exerciseType}`);
        }
      });
    });
  }
});
