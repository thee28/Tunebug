import { describe, it, expect } from "vitest";
import { createRng as generatorRng } from "@/lib/curriculum/generator";
import { createRng as slotRng } from "@/lib/curriculum/slotGenerator";

// Seed 653637408 advances the LCG to internal state 0xFFFFFFFF (4294967295).
// With the old divisor (2^32 - 1) that draw returned exactly 1.0, which made
// pick() index one past the end of its array.
const MAX_STATE_SEED = 653637408;

describe.each([
  ["generator", generatorRng],
  ["slotGenerator", slotRng],
])("createRng (%s)", (_name, createRng) => {
  it("never returns 1.0, even at max internal state", () => {
    const rng = createRng(MAX_STATE_SEED);
    const value = rng();
    expect(value).toBeLessThan(1);
    expect(value).toBeGreaterThanOrEqual(0);
  });

  it("stays within [0, 1) over many draws", () => {
    const rng = createRng(12345);
    for (let i = 0; i < 10_000; i++) {
      const v = rng();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it("is deterministic for the same seed", () => {
    const a = createRng(42);
    const b = createRng(42);
    for (let i = 0; i < 100; i++) {
      expect(a()).toBe(b());
    }
  });
});
