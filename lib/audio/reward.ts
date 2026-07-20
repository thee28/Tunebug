// Celebratory chime for reward moments (e.g. claiming quest XP).
// Reuses the shared piano sampler so no extra assets load; a quick
// ascending major arpeggio reads as "success" without being long.

import { getPiano } from "./piano";

export async function playRewardChime(): Promise<void> {
  try {
    const piano = await getPiano();
    const Tone = await import("tone");
    const now = Tone.now();
    ["C5", "E5", "G5", "C6"].forEach((note, i) => {
      piano.triggerAttackRelease(note, "0.35", now + i * 0.09);
    });
  } catch {
    // Audio is a nice-to-have — never let it break the claim flow
    // (e.g. sampler fetch failure or autoplay restrictions).
  }
}
