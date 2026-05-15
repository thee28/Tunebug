import type { IntervalName } from "@/types/music";

export const INTERVALS: { name: IntervalName; semitones: number }[] = [
  { name: "Unison", semitones: 0 },
  { name: "Minor 2nd", semitones: 1 },
  { name: "Major 2nd", semitones: 2 },
  { name: "Minor 3rd", semitones: 3 },
  { name: "Major 3rd", semitones: 4 },
  { name: "Perfect 4th", semitones: 5 },
  { name: "Tritone", semitones: 6 },
  { name: "Perfect 5th", semitones: 7 },
  { name: "Minor 6th", semitones: 8 },
  { name: "Major 6th", semitones: 9 },
  { name: "Minor 7th", semitones: 10 },
  { name: "Major 7th", semitones: 11 },
  { name: "Octave", semitones: 12 },
];

export function semitonesToInterval(semitones: number): IntervalName | null {
  const abs = Math.abs(semitones) % 12 || (Math.abs(semitones) === 12 ? 12 : 0);
  return INTERVALS.find((i) => i.semitones === abs)?.name ?? null;
}
