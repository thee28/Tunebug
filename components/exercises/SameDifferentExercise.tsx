"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import type { SameDifferentConfig } from "@/types/music";
import type { Difficulty } from "@/lib/curriculum/content";
import type { ExerciseResult } from "./ExerciseEngine";

interface Props {
  config: SameDifferentConfig;
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

const CHOICES: Array<SameDifferentConfig["correctAnswer"]> = ["Same", "Different"];

export function SameDifferentExercise({ config, submitted, onAnswerChange, onComplete }: Props) {
  const [selected, setSelected] = useState<SameDifferentConfig["correctAnswer"] | null>(null);
  const [playing, setPlaying] = useState(false);
  const synthRef = useRef<unknown>(null);

  const playPair = useCallback(async () => {
    if (playing) return;
    setPlaying(true);
    try {
      const Tone = await import("tone");
      await Tone.start();
      if (!synthRef.current) {
        synthRef.current = new Tone.Synth({ oscillator: { type: "triangle" } }).toDestination();
      }
      const synth = synthRef.current as InstanceType<typeof Tone.Synth>;
      const now = Tone.now();
      synth.triggerAttackRelease(config.noteA, "0.5", now);
      synth.triggerAttackRelease(config.noteB, "0.5", now + 0.7);
      setTimeout(() => setPlaying(false), 1400);
    } catch {
      setPlaying(false);
    }
  }, [config.noteA, config.noteB, playing]);

  const handleSelect = (choice: SameDifferentConfig["correctAnswer"]) => {
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
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 32 }}>
      <p style={{ color: C.text, fontFamily: "'Nunito', sans-serif", fontSize: 22, fontWeight: 800, margin: 0, textAlign: "center" }}>
        Are these two notes the same or different?
      </p>

      <button
        onClick={playPair}
        style={{
          width: 96, height: 96, borderRadius: "50%",
          backgroundColor: playing ? C.primaryDark : C.primary,
          boxShadow: `0 6px 0 0 ${C.primaryDark}`,
          border: "none", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          transform: playing ? "translateY(3px)" : "none", transition: "transform 0.1s",
        }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 44, color: "white" }}>
          {playing ? "graphic_eq" : "volume_up"}
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
                transition: "background-color 0.15s",
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
