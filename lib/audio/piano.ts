// Shared piano sampler for every exercise sound (notes AND rhythm clicks).
// Samples are a local subset of the Salamander grand (public/audio/piano);
// Tone.Sampler repitches between them, so any note in the app's range works.
// A module-level singleton keeps repeat plays instant after the first load.

import type { Sampler } from "tone";

let sampler: Sampler | null = null;
let loading: Promise<Sampler> | null = null;

export async function getPiano(): Promise<Sampler> {
  const Tone = await import("tone");
  await Tone.start();
  if (sampler) return sampler;
  if (!loading) {
    loading = new Promise<Sampler>((resolve, reject) => {
      const s = new Tone.Sampler({
        urls: {
          C2: "C2.mp3",
          C3: "C3.mp3", "D#3": "Ds3.mp3", "F#3": "Fs3.mp3", A3: "A3.mp3",
          C4: "C4.mp3", "D#4": "Ds4.mp3", "F#4": "Fs4.mp3", A4: "A4.mp3",
          C5: "C5.mp3", "D#5": "Ds5.mp3", "F#5": "Fs5.mp3", A5: "A5.mp3",
          C6: "C6.mp3",
        },
        baseUrl: "/audio/piano/",
        onload: () => {
          sampler = s;
          resolve(s);
        },
        onerror: (err) => {
          loading = null;
          s.dispose();
          reject(err);
        },
      }).toDestination();
    });
  }
  return loading;
}

// Rhythm exercises used to run a MembraneSynth; they now tap piano notes.
// Low/high pair keeps the metronome-vs-pattern distinction audible.
export const RHYTHM_TAP_NOTE = "C4";
export const RHYTHM_TICK_NOTE = "G3";
export const RHYTHM_GO_NOTE = "C4";
