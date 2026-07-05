import { describe, it, expect } from "vitest";
import { generateFreePracticeSession, type FreePracticeInput } from "@/lib/curriculum/freePractice";
import { CONCEPT_TYPE_POOL } from "@/lib/curriculum/concepts";
import type { ConceptCategory } from "@/lib/curriculum/concepts";
import type { Difficulty } from "@/lib/curriculum/content";
import type {
  ExerciseType,
  ExerciseConfig,
  EarSingleConfig,
  EarMultiConfig,
  IntervalIdConfig,
  NoteValueConfig,
  CountBeatsConfig,
  FillBlankRhythmConfig,
  NameItConfig,
  ErrorSpottingConfig,
  TrueFalseConfig,
} from "@/types/music";

const NOTE_POOL = ["C4", "D4", "E4", "F4", "G4", "A4", "B4", "C5"];

function makeInput(overrides: Partial<FreePracticeInput> = {}): FreePracticeInput {
  return {
    domains: ["ear-note"],
    difficulty: "intermediate",
    notePool: NOTE_POOL,
    slotCount: 10,
    seed: 1,
    ...overrides,
  };
}

// Mirrors the generator's position-tracked types.
function correctIndexOf(type: ExerciseType, config: ExerciseConfig): number | null {
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

describe("generateFreePracticeSession", () => {
  it("generates exactly slotCount exercises for each session length", () => {
    for (const slotCount of [5, 10, 20] as const) {
      const session = generateFreePracticeSession(makeInput({ slotCount }));
      expect(session).toHaveLength(slotCount);
    }
  });

  it("draws only from the selected domain's type pool", () => {
    const cases: ConceptCategory[] = [
      "ear-note", "ear-chord", "ear-interval", "sing-note", "staff-note", "rhythm-symbol",
    ];
    for (const domain of cases) {
      const allowed = new Set(CONCEPT_TYPE_POOL[domain]);
      for (let seed = 0; seed < 50; seed++) {
        const session = generateFreePracticeSession(makeInput({ domains: [domain], seed }));
        for (const ex of session) {
          expect(allowed.has(ex.type), `${ex.type} not in ${domain} pool`).toBe(true);
        }
      }
    }
  });

  it("unions type pools when several domains are selected", () => {
    const allowed = new Set([
      ...CONCEPT_TYPE_POOL["ear-note"],
      ...CONCEPT_TYPE_POOL["rhythm-symbol"],
    ]);
    const session = generateFreePracticeSession(
      makeInput({ domains: ["ear-note", "rhythm-symbol"], slotCount: 20 })
    );
    for (const ex of session) {
      expect(allowed.has(ex.type)).toBe(true);
    }
  });

  it("never repeats the same exercise type back-to-back when the pool has 3+ types", () => {
    for (const domain of ["ear-note", "staff-note", "rhythm-symbol"] as ConceptCategory[]) {
      for (let seed = 0; seed < 100; seed++) {
        const session = generateFreePracticeSession(
          makeInput({ domains: [domain], slotCount: 20, seed })
        );
        for (let i = 1; i < session.length; i++) {
          expect(session[i].type, `seed ${seed} slot ${i}`).not.toBe(session[i - 1].type);
        }
      }
    }
  });

  it("tolerates single-type pools (Chord ID) without crashing", () => {
    for (let seed = 0; seed < 20; seed++) {
      const session = generateFreePracticeSession(
        makeInput({ domains: ["ear-chord"], slotCount: 20, seed })
      );
      expect(session).toHaveLength(20);
      for (const ex of session) expect(ex.type).toBe("EAR_MULTI");
    }
  });

  it("never puts the correct choice in the same position twice in a row", () => {
    for (const domain of ["ear-note", "rhythm-symbol", "ear-interval"] as ConceptCategory[]) {
      for (let seed = 0; seed < 100; seed++) {
        const session = generateFreePracticeSession(
          makeInput({ domains: [domain], slotCount: 20, seed })
        );
        let lastIdx: number | null = null;
        for (const ex of session) {
          const idx = correctIndexOf(ex.type, ex.config);
          if (idx !== null && lastIdx !== null) {
            expect(idx).not.toBe(lastIdx);
          }
          lastIdx = idx;
        }
      }
    }
  });

  it("keeps every correct answer present in its choices after position swaps", () => {
    for (let seed = 0; seed < 100; seed++) {
      const session = generateFreePracticeSession(
        makeInput({ domains: ["ear-note", "rhythm-symbol", "ear-interval"], slotCount: 20, seed })
      );
      for (const ex of session) {
        const idx = correctIndexOf(ex.type, ex.config);
        if (idx !== null) expect(idx).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it("beginner never reaches 'adjacent' distractor closeness (level bias)", () => {
    // EAR_SINGLE at beginner: adjacent closeness would restrict distractors
    // to neighbors of the correct answer. We can't read closeness directly,
    // so assert via choice count ramp instead: beginner choice count stays
    // within [2, DIFFICULTY_SETTINGS.beginner.choiceCount].
    for (let seed = 0; seed < 50; seed++) {
      const session = generateFreePracticeSession(
        makeInput({ domains: ["ear-note"], difficulty: "beginner", slotCount: 20, seed })
      );
      for (const ex of session) {
        if (ex.type === "EAR_SINGLE") {
          const c = ex.config as EarSingleConfig;
          expect(c.choices.length).toBeGreaterThanOrEqual(2);
          expect(c.choices.length).toBeLessThanOrEqual(4);
        }
      }
    }
  });

  it("scales choice count up across the session", () => {
    for (const difficulty of ["beginner", "intermediate", "advanced"] as Difficulty[]) {
      const firstCounts: number[] = [];
      const lastCounts: number[] = [];
      for (let seed = 0; seed < 50; seed++) {
        const session = generateFreePracticeSession(
          makeInput({ domains: ["ear-note"], difficulty, slotCount: 20, seed })
        );
        const singles = session
          .map((ex, i) => ({ ex, i }))
          .filter(({ ex }) => ex.type === "EAR_SINGLE");
        if (singles.length < 2) continue;
        firstCounts.push((singles[0].ex.config as EarSingleConfig).choices.length);
        lastCounts.push((singles[singles.length - 1].ex.config as EarSingleConfig).choices.length);
      }
      const avg = (a: number[]) => a.reduce((s, x) => s + x, 0) / a.length;
      expect(avg(lastCounts)).toBeGreaterThanOrEqual(avg(firstCounts));
    }
  });

  it("chord exercises use notes from the level's note pool with no duplicate letter names", () => {
    for (let seed = 0; seed < 50; seed++) {
      const session = generateFreePracticeSession(
        makeInput({ domains: ["ear-chord"], seed, notePool: ["C4", "C5", "D4", "E4"] })
      );
      for (const ex of session) {
        const c = ex.config as EarMultiConfig;
        for (const n of c.targetNotes) expect(["C4", "C5", "D4", "E4"]).toContain(n);
        const names = c.targetNotes.map((n) => n.replace(/\d$/, ""));
        expect(new Set(names).size).toBe(names.length);
        // Every correct answer must be offered as a choice.
        for (const a of c.correctAnswers) expect(c.choices).toContain(a);
      }
    }
  });

  it("staff-note TRUE_FALSE carries a vexKey so the note can actually be seen", () => {
    for (let seed = 0; seed < 200; seed++) {
      const session = generateFreePracticeSession(
        makeInput({ domains: ["staff-note"], slotCount: 20, seed })
      );
      for (const ex of session) {
        if (ex.type !== "TRUE_FALSE") continue;
        const c = ex.config as TrueFalseConfig;
        expect(c.audioNote).toBeUndefined();
        expect(c.vexKey).toBeTruthy();
      }
    }
  });

  it("ear-note TRUE_FALSE carries audio, not a staff", () => {
    for (let seed = 0; seed < 200; seed++) {
      const session = generateFreePracticeSession(
        makeInput({ domains: ["ear-note"], slotCount: 20, seed })
      );
      for (const ex of session) {
        if (ex.type !== "TRUE_FALSE") continue;
        const c = ex.config as TrueFalseConfig;
        expect(c.audioNote).toBeTruthy();
        expect(c.vexKey).toBeUndefined();
      }
    }
  });

  it("is deterministic for a fixed seed", () => {
    const a = generateFreePracticeSession(makeInput({ seed: 42 }));
    const b = generateFreePracticeSession(makeInput({ seed: 42 }));
    expect(a).toEqual(b);
  });
});
