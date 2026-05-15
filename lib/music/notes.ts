import type { NoteName, Note } from "@/types/music";

export const NOTE_NAMES: NoteName[] = [
  "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B",
];

export const VEX_KEYS: Record<NoteName, string> = {
  C: "c", "C#": "c#", D: "d", "D#": "d#", E: "e",
  F: "f", "F#": "f#", G: "g", "G#": "g#", A: "a", "A#": "a#", B: "b",
};

export function midiToFrequency(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

export function frequencyToMidi(frequency: number): number {
  return Math.round(12 * Math.log2(frequency / 440) + 69);
}

export function midiToNote(midi: number): Note {
  const octave = Math.floor(midi / 12) - 1;
  const noteIndex = midi % 12;
  const name = NOTE_NAMES[noteIndex];
  const frequency = midiToFrequency(midi);
  return {
    name,
    octave,
    frequency,
    vexKey: `${VEX_KEYS[name]}/${octave}`,
  };
}

export function frequencyToNote(frequency: number): Note {
  const midi = frequencyToMidi(frequency);
  return midiToNote(midi);
}

export function centDeviation(frequency: number, midi: number): number {
  const idealFreq = midiToFrequency(midi);
  return 1200 * Math.log2(frequency / idealFreq);
}

export function noteStringToMidi(noteStr: string): number {
  // e.g. "C4" → 60, "A#3" → 58
  const match = noteStr.match(/^([A-G]#?)(\d)$/);
  if (!match) throw new Error(`Invalid note string: ${noteStr}`);
  const [, name, octaveStr] = match;
  const noteIndex = NOTE_NAMES.indexOf(name as NoteName);
  const octave = parseInt(octaveStr);
  return (octave + 1) * 12 + noteIndex;
}

export function noteStringToFrequency(noteStr: string): number {
  return midiToFrequency(noteStringToMidi(noteStr));
}
