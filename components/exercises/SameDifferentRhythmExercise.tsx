"use client";

import { useState, useCallback, useEffect } from "react";
import { getPiano, RHYTHM_TAP_NOTE } from "@/lib/audio/piano";
import type { SameDifferentRhythmConfig } from "@/types/music";
import type { Difficulty } from "@/lib/curriculum/content";
import type { ExerciseResult } from "./ExerciseEngine";
import { NOTE_BEATS } from "./NoteSymbolSVG";

interface Props {
  config: SameDifferentRhythmConfig;
  difficulty: Difficulty;
  submitted: boolean;
  onAnswerChange: (hasAnswer: boolean) => void;
  onComplete: (result: ExerciseResult) => void;
}

const C = {
  primary: "#574eb1", primaryDark: "#41379b",
  surfaceHigh: "var(--c-surface-high)", border: "var(--c-border)", muted: "var(--c-muted)",
  text: "var(--c-text)", selected: "#3d3580",
};

const BPM = 90;
const BEAT_MS = (60 / BPM) * 1000;

const CHOICES: Array<SameDifferentRhythmConfig["correctAnswer"]> = ["Same", "Different"];

export function SameDifferentRhythmExercise({ config, submitted, onAnswerChange, onComplete }: Props) {
  const [selected, setSelected] = useState<SameDifferentRhythmConfig["correctAnswer"] | null>(null);
  const [playing, setPlaying] = useState(false);

  const playPatterns = useCallback(async () => {
    if (playing) return;
    setPlaying(true);
    try {
      const Tone = await import("tone");
      const piano = await getPiano();
      const now = Tone.now();
      let t = 0;
      for (const sym of config.patternA) {
        piano.triggerAttackRelease(RHYTHM_TAP_NOTE, "8n", now + t / 1000);
        t += NOTE_BEATS[sym] * BEAT_MS;
      }
      // gap between patterns
      t += BEAT_MS;
      for (const sym of config.patternB) {
        piano.triggerAttackRelease(RHYTHM_TAP_NOTE, "8n", now + t / 1000);
        t += NOTE_BEATS[sym] * BEAT_MS;
      }
      setTimeout(() => setPlaying(false), t + 200);
    } catch {
      setPlaying(false);
    }
  }, [config.patternA, config.patternB, playing]);

  const handleSelect = (choice: SameDifferentRhythmConfig["correctAnswer"]) => {
    if (submitted) return;
    setSelected(choice);
    onAnswerChange(true);
  };

  useEffect(() => {
    if (!submitted) return;
    const passed = selected === config.correctAnswer;
    onComplete({ score: passed ? 100 : 0, passed, correctAnswerText: config.correctAnswer });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submitted]);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 24 }}>
      <p style={{ color: C.text, fontFamily: "'Nunito', sans-serif", fontSize: 22, fontWeight: 800, margin: 0, textAlign: "center" }}>
        Are these two rhythms the same?
      </p>

      <button
        onClick={playPatterns}
        style={{
          width: 96, height: 96, borderRadius: "50%",
          backgroundColor: playing ? C.primaryDark : C.primary,
          boxShadow: `0 6px 0 0 ${C.primaryDark}`,
          border: "none", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 44, color: "white" }}>
          {playing ? "graphic_eq" : "play_arrow"}
        </span>
      </button>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, width: "100%", maxWidth: 360 }}>
        {CHOICES.map((choice) => {
          const isSelected = choice === selected;
          return (
            <button
              key={choice}
              onClick={() => handleSelect(choice)}
              style={{
                padding: "18px 0", borderRadius: 14,
                backgroundColor: isSelected ? C.selected : C.surfaceHigh,
                border: `2px solid ${isSelected ? C.primary : C.border}`,
                color: C.text,
                fontFamily: "'Nunito', sans-serif", fontSize: 20, fontWeight: 700,
                cursor: submitted ? "default" : "pointer",
              }}
            >
              {choice}
            </button>
          );
        })}
      </div>
    </div>
  );
}
