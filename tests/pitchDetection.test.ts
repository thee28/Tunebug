import { describe, it, expect } from "vitest";
import { PitchDetector } from "pitchy";
import { foldedCents } from "@/lib/music/notes";

// Exercise the REAL pitchy detector with synthetic buffers — exactly what the
// analyser hands it in production (fftSize 2048, mono float PCM).
const FFT_SIZE = 2048;
const SAMPLE_RATE = 48000;

type Wave = (t: number) => number;

function render(wave: Wave): Float32Array {
  const buf = new Float32Array(FFT_SIZE);
  for (let i = 0; i < FFT_SIZE; i++) {
    buf[i] = wave(i / SAMPLE_RATE);
  }
  return buf;
}

const sine = (freq: number, amp = 0.5): Wave => (t) => amp * Math.sin(2 * Math.PI * freq * t);

// A crude vocal-ish tone: fundamental + decaying harmonics.
const harmonicTone = (freq: number): Wave => (t) =>
  0.5 * Math.sin(2 * Math.PI * freq * t) +
  0.25 * Math.sin(2 * Math.PI * 2 * freq * t) +
  0.12 * Math.sin(2 * Math.PI * 3 * freq * t) +
  0.06 * Math.sin(2 * Math.PI * 4 * freq * t);

function detect(buf: Float32Array): [number, number] {
  const detector = PitchDetector.forFloat32Array(FFT_SIZE);
  return detector.findPitch(buf, SAMPLE_RATE);
}

// The app treats clarity >= 0.80 (beginner) as voiced.
const CLARITY_VOICED = 0.8;

describe("pitchy detector with synthetic audio", () => {
  it("clean 440 Hz sine detects within ±1 cent", () => {
    const [pitch, clarity] = detect(render(sine(440)));
    expect(clarity).toBeGreaterThan(CLARITY_VOICED);
    expect(Math.abs(foldedCents(pitch, 440))).toBeLessThan(1);
  });

  it("slightly sharp tone (445 Hz ≈ +19.6¢) reads sharp, not in-tune-at-440", () => {
    const [pitch, clarity] = detect(render(sine(445)));
    expect(clarity).toBeGreaterThan(CLARITY_VOICED);
    const cents = foldedCents(pitch, 440);
    expect(cents).toBeGreaterThan(15);
    expect(cents).toBeLessThan(25);
  });

  it("slightly flat tone (435 Hz ≈ −19.8¢) reads flat", () => {
    const [pitch] = detect(render(sine(435)));
    const cents = foldedCents(pitch, 440);
    expect(cents).toBeLessThan(-15);
    expect(cents).toBeGreaterThan(-25);
  });

  it("tone with harmonics still detects the fundamental (220 Hz)", () => {
    const [pitch, clarity] = detect(render(harmonicTone(220)));
    expect(clarity).toBeGreaterThan(CLARITY_VOICED);
    // Fundamental, not the 2nd/3rd harmonic:
    expect(Math.abs(foldedCents(pitch, 220))).toBeLessThan(5);
    expect(pitch).toBeGreaterThan(200);
    expect(pitch).toBeLessThan(240);
  });

  it("silence yields clarity below the voiced threshold", () => {
    const [, clarity] = detect(render(() => 0));
    expect(clarity).toBeLessThan(CLARITY_VOICED);
  });

  it("white noise yields clarity below the voiced threshold", () => {
    // Deterministic LCG noise — no Math.random flakiness.
    let seed = 12345;
    const noise: Wave = () => {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      return (seed / 0x7fffffff) * 2 - 1;
    };
    const [, clarity] = detect(render(noise));
    expect(clarity).toBeLessThan(CLARITY_VOICED);
  });

  it("signal that stops mid-buffer: detector does not hallucinate high clarity", () => {
    const buf = render(sine(440));
    buf.fill(0, FFT_SIZE / 2); // abrupt stop halfway
    const [pitch, clarity] = detect(buf);
    // Either clarity drops below voiced, or the pitch is still ~440 —
    // both are safe. What must NOT happen: confident garbage.
    if (clarity >= CLARITY_VOICED) {
      expect(Math.abs(foldedCents(pitch, 440))).toBeLessThan(30);
    }
  });

  it("very low (60 Hz) and high (1200 Hz) vocal-range edges detect accurately", () => {
    const [low] = detect(render(sine(60)));
    expect(Math.abs(foldedCents(low, 60))).toBeLessThan(10);
    const [high] = detect(render(sine(1200)));
    expect(Math.abs(foldedCents(high, 1200))).toBeLessThan(10);
  });
});
