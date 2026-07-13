import { describe, it, expect } from "vitest";
import {
  midiToFrequency,
  frequencyToMidi,
  midiToNote,
  frequencyToNote,
  centDeviation,
  foldedCents,
  noteStringToMidi,
  noteStringToFrequency,
} from "@/lib/music/notes";

// Hand-computed reference values (12-TET, A4 = 440 Hz). Assertions target
// these numbers, NOT whatever the code currently returns.
const A4_MIDI = 69;

describe("midiToFrequency", () => {
  it("maps reference notes to known frequencies", () => {
    expect(midiToFrequency(69)).toBeCloseTo(440, 10); // A4
    expect(midiToFrequency(57)).toBeCloseTo(220, 10); // A3
    expect(midiToFrequency(81)).toBeCloseTo(880, 10); // A5
    expect(midiToFrequency(60)).toBeCloseTo(261.6256, 3); // C4 (middle C)
    expect(midiToFrequency(21)).toBeCloseTo(27.5, 10); // A0, lowest piano key
    expect(midiToFrequency(108)).toBeCloseTo(4186.009, 2); // C8, highest piano key
  });
});

describe("frequencyToMidi", () => {
  it("round-trips every MIDI note in the singable range", () => {
    for (let midi = 36; midi <= 84; midi++) {
      expect(frequencyToMidi(midiToFrequency(midi))).toBe(midi);
    }
  });

  it("rounds consistently at the semitone midpoint (50 cents)", () => {
    // Exactly halfway between A4 (69) and A#4 (70): 440 * 2^(0.5/12)
    const midpoint = 440 * Math.pow(2, 0.5 / 12); // ≈ 452.8930 Hz
    const atMidpoint = frequencyToMidi(midpoint);
    // Math.round(69.5) = 70 — ties round up. What matters is stability:
    expect(atMidpoint).toBe(70);
    // ε below the midpoint must snap down, ε above must snap up — no gap,
    // no overlap, no flicker zone.
    expect(frequencyToMidi(midpoint * Math.pow(2, -0.001 / 12))).toBe(69);
    expect(frequencyToMidi(midpoint * Math.pow(2, +0.001 / 12))).toBe(70);
  });

  it("49.9 cents sharp still reads as the same note", () => {
    const sharp = 440 * Math.pow(2, 0.499 / 12);
    expect(frequencyToMidi(sharp)).toBe(69);
  });
});

describe("centDeviation", () => {
  it("440 Hz vs A4 = exactly 0 cents", () => {
    expect(centDeviation(440, A4_MIDI)).toBeCloseTo(0, 10);
  });

  it("441 Hz vs A4 ≈ +3.93 cents", () => {
    // 1200 * log2(441/440) = 3.93016...
    expect(centDeviation(441, A4_MIDI)).toBeCloseTo(3.9302, 3);
  });

  it("415.3047 Hz (G#4) vs A4 = −100 cents", () => {
    expect(centDeviation(415.3047, A4_MIDI)).toBeCloseTo(-100, 2);
  });

  it("466.1638 Hz (A#4) vs A4 = +100 cents", () => {
    expect(centDeviation(466.1638, A4_MIDI)).toBeCloseTo(100, 2);
  });

  it("octave above = +1200 cents (unfolded)", () => {
    expect(centDeviation(880, A4_MIDI)).toBeCloseTo(1200, 6);
  });
});

describe("foldedCents (octave-agnostic scoring)", () => {
  it("exact target = 0", () => {
    expect(foldedCents(440, 440)).toBeCloseTo(0, 10);
  });

  it("folds octaves: 220 Hz and 880 Hz both score 0 vs a 440 target", () => {
    // Intentional design: pitch-class matching. A3 and A5 both satisfy an
    // A4 target so singers can use their own register.
    expect(foldedCents(220, 440)).toBeCloseTo(0, 10);
    expect(foldedCents(880, 440)).toBeCloseTo(0, 10);
    expect(foldedCents(110, 440)).toBeCloseTo(0, 10);
  });

  it("preserves the deviation sign across octaves", () => {
    // 3.93 cents sharp of A3 folds to 3.93 sharp of the A4 target.
    expect(foldedCents(220.5, 440)).toBeCloseTo(3.9302, 3);
    expect(foldedCents(882, 440)).toBeCloseTo(3.9302, 3);
  });

  it("a tritone away folds to the [-600, 600) edge, never in-tune", () => {
    const tritone = 440 * Math.pow(2, 6 / 12); // 622.25 Hz
    expect(Math.abs(foldedCents(tritone, 440))).toBeCloseTo(600, 6);
  });

  it("a perfect fifth (common detector error) reads ~±500 cents — never passes", () => {
    const fifth = 440 * 1.5; // 660 Hz, 3:2 — classic detector confusion
    // 1200*log2(1.5) = 701.955 → folds to −498.04
    expect(foldedCents(fifth, 440)).toBeCloseTo(-498.045, 2);
  });

  it("output always lies in [-600, 600)", () => {
    for (let hz = 51; hz < 1500; hz += 7.3) {
      const c = foldedCents(hz, 440);
      expect(c).toBeGreaterThanOrEqual(-600);
      expect(c).toBeLessThan(600.0000001);
    }
  });
});

describe("frequencyToNote / midiToNote", () => {
  it("names reference pitches correctly", () => {
    expect(frequencyToNote(440)).toMatchObject({ name: "A", octave: 4 });
    expect(frequencyToNote(261.6256)).toMatchObject({ name: "C", octave: 4 });
    expect(frequencyToNote(466.1638)).toMatchObject({ name: "A#", octave: 4 });
  });

  it("220 Hz is A3 and 880 Hz is A5 — octaves are distinct in display", () => {
    expect(frequencyToNote(220)).toMatchObject({ name: "A", octave: 3 });
    expect(frequencyToNote(880)).toMatchObject({ name: "A", octave: 5 });
  });

  it("octave boundary: B3 → C4 (MIDI 59/60)", () => {
    expect(midiToNote(59)).toMatchObject({ name: "B", octave: 3 });
    expect(midiToNote(60)).toMatchObject({ name: "C", octave: 4 });
  });

  it("builds VexFlow keys with the right octave", () => {
    expect(midiToNote(60).vexKey).toBe("c/4");
    expect(midiToNote(69).vexKey).toBe("a/4");
    expect(midiToNote(58).vexKey).toBe("a#/3");
  });
});

describe("noteStringToMidi", () => {
  it("parses sharps and octaves", () => {
    expect(noteStringToMidi("C4")).toBe(60);
    expect(noteStringToMidi("A4")).toBe(69);
    expect(noteStringToMidi("A#3")).toBe(58);
    expect(noteStringToMidi("C0")).toBe(12);
  });

  it("round-trips with midiToNote", () => {
    for (let midi = 24; midi <= 96; midi++) {
      const n = midiToNote(midi);
      expect(noteStringToMidi(`${n.name}${n.octave}`)).toBe(midi);
    }
  });

  it("rejects garbage instead of returning a wrong note", () => {
    expect(() => noteStringToMidi("H4")).toThrow();
    expect(() => noteStringToMidi("Db4")).toThrow(); // flats unsupported by design
    expect(() => noteStringToMidi("")).toThrow();
    expect(() => noteStringToMidi("C")).toThrow();
    expect(() => noteStringToMidi("4C")).toThrow();
  });

  it("noteStringToFrequency: A4 = 440", () => {
    expect(noteStringToFrequency("A4")).toBeCloseTo(440, 10);
  });
});

describe("extreme inputs — documented behavior at the math layer", () => {
  // The pitch pipeline guards with MIN_HZ=50 / MAX_HZ=1500 before calling
  // these functions (PitchMatchExercise). These tests pin down what the raw
  // math does so a future caller without guards fails loudly here.
  it("frequencyToMidi(0) is -Infinity (callers MUST pre-filter)", () => {
    expect(frequencyToMidi(0)).toBe(-Infinity);
  });

  it("frequencyToMidi of negative input is NaN (callers MUST pre-filter)", () => {
    expect(Number.isNaN(frequencyToMidi(-440))).toBe(true);
  });

  it("frequencyToMidi(NaN) is NaN, not a note", () => {
    expect(Number.isNaN(frequencyToMidi(NaN))).toBe(true);
  });

  it("centDeviation with 0 Hz is -Infinity, never a passing deviation", () => {
    const c = centDeviation(0, A4_MIDI);
    expect(c).toBe(-Infinity);
    expect(Math.abs(c) <= 45).toBe(false); // would never pass any threshold
  });

  it("foldedCents(NaN) is NaN — comparisons against thresholds are false", () => {
    const c = foldedCents(NaN, 440);
    expect(Number.isNaN(c)).toBe(true);
    expect(Math.abs(c) <= 45).toBe(false);
  });
});
