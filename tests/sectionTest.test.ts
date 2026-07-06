import { describe, it, expect } from "vitest";
import {
  generateSectionTestSteps,
  SECTION_TEST_QUESTION_COUNT,
} from "@/lib/curriculum/sectionTest";
import { CURRICULUM } from "@/lib/curriculum/config";
import { deriveConcepts } from "@/lib/curriculum/concepts";

// conceptId → stage index that teaches it first
function conceptStageMap(): Map<string, number> {
  const map = new Map<string, number>();
  CURRICULUM.forEach((stage, si) => {
    for (const unit of stage.units) {
      for (const lesson of unit.lessons) {
        for (const c of deriveConcepts(lesson)) {
          if (!map.has(c.id)) map.set(c.id, si);
        }
      }
    }
  });
  return map;
}

describe("generateSectionTestSteps", () => {
  it("produces exactly 15 exercise steps with concept tags", () => {
    const { steps } = generateSectionTestSteps(0, 1, 42);
    expect(steps).toHaveLength(SECTION_TEST_QUESTION_COUNT);
    for (const step of steps) {
      expect(step.kind).toBe("exercise");
      expect(step.conceptId).toBeTruthy();
    }
  });

  it("is deterministic for the same seed and differs across seeds", () => {
    const a = generateSectionTestSteps(0, 1, 7);
    const b = generateSectionTestSteps(0, 1, 7);
    const c = generateSectionTestSteps(0, 1, 8);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
    expect(JSON.stringify(a)).not.toBe(JSON.stringify(c));
  });

  it("never includes mic-dependent sing-note concepts", () => {
    for (let target = 1; target < CURRICULUM.length; target++) {
      const { steps } = generateSectionTestSteps(0, target, 123);
      for (const step of steps) {
        expect(step.conceptId).not.toMatch(/^sing-note:/);
        expect(step.type).not.toBe("PITCH_MATCH");
      }
    }
  });

  it("covers every skipped stage when jumping multiple sections", () => {
    const stageOf = conceptStageMap();
    const target = Math.min(3, CURRICULUM.length - 1);
    const { steps } = generateSectionTestSteps(0, target, 99);
    const coveredStages = new Set(steps.map((s) => stageOf.get(s.conceptId!)));
    for (let si = 0; si < target; si++) {
      expect(coveredStages.has(si)).toBe(true);
    }
  });

  it("only draws concepts from the covered stage range", () => {
    const stageOf = conceptStageMap();
    const { steps } = generateSectionTestSteps(0, 2, 555);
    for (const step of steps) {
      // A concept may reappear in later stages; the map records its FIRST
      // stage, which must be inside [0, 2).
      expect(stageOf.get(step.conceptId!)).toBeLessThan(2);
    }
  });

  it("anchors difficulty to the hardest covered stage", () => {
    const { difficulty } = generateSectionTestSteps(0, 2, 1);
    expect(difficulty).toBe(CURRICULUM[1].difficulty);
  });

  it("rejects an empty stage range", () => {
    expect(() => generateSectionTestSteps(2, 2, 1)).toThrow();
    expect(() => generateSectionTestSteps(3, 1, 1)).toThrow();
  });

  it("avoids identical exercise types back-to-back when the pool allows it", () => {
    const { steps } = generateSectionTestSteps(0, 1, 2024);
    for (let i = 1; i < steps.length; i++) {
      // Single-type categories (e.g. ear-chord) can legitimately repeat;
      // everything else must alternate.
      if (steps[i].type === steps[i - 1].type) {
        const id = steps[i].conceptId ?? "";
        const prevId = steps[i - 1].conceptId ?? "";
        expect(id.split(":")[0]).toBe(prevId.split(":")[0]);
      }
    }
  });
});
