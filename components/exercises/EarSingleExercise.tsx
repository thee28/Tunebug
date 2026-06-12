"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import type { EarSingleConfig } from "@/types/music";
import type { Difficulty } from "@/lib/curriculum/content";
import type { ExerciseResult } from "./ExerciseEngine";

interface Props {
  config: EarSingleConfig;
  difficulty: Difficulty;
  submitted: boolean;
  onAnswerChange: (hasAnswer: boolean) => void;
  onComplete: (result: ExerciseResult) => void;
}

const C = {
  primary: "#574eb1", primaryDark: "#41379b",
  surfaceHigh: "var(--c-surface-high)", border: "var(--c-border)", muted: "var(--c-muted)",
  success: "#006c4e", error: "#8b2828", text: "var(--c-text)",
  selected: "#3d3580",
};

export function EarSingleExercise({ config, difficulty, submitted, onAnswerChange, onComplete }: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const synthRef = useRef<unknown>(null);

  const playNote = useCallback(async () => {
    if (playing) return;
    setPlaying(true);
    try {
      const Tone = await import("tone");
      await Tone.start();
      if (!synthRef.current) {
        synthRef.current = new Tone.Synth({ oscillator: { type: "triangle" } }).toDestination();
      }
      const synth = synthRef.current as InstanceType<typeof Tone.Synth>;
      synth.triggerAttackRelease(config.targetNote, "0.6");
      setTimeout(() => setPlaying(false), 700);
    } catch {
      setPlaying(false);
    }
  }, [config.targetNote, playing]);

  const handleSelect = (choice: string) => {
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

  const cols = config.choices.length <= 4 ? 2 : 3;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 32 }}>
      <p style={{ color: C.text, fontFamily: "'Nunito', sans-serif", fontSize: 22, fontWeight: 800, margin: 0, textAlign: "center" }}>
        {difficulty === "beginner" ? "What note do you hear?" : "Identify the note."}
      </p>

      <button
        onClick={playNote}
        style={{
          width: 96, height: 96, borderRadius: "50%",
          backgroundColor: playing ? C.primaryDark : C.primary,
          boxShadow: `0 6px 0 0 ${C.primaryDark}`,
          border: "none", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          transition: "transform 0.1s",
          transform: playing ? "translateY(3px)" : "none",
        }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 48, color: "white" }}>
          {playing ? "graphic_eq" : "volume_up"}
        </span>
      </button>

      <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 12, width: "100%", maxWidth: 360 }}>
        {config.choices.map((choice) => {
          const isCorrect = choice === config.correctAnswer;
          const isSelected = choice === selected;
          let bg = C.surfaceHigh, border = C.border, color = C.text;
          if (submitted && isSelected) {
            bg = C.selected; border = C.primary;
          } else if (isSelected) {
            bg = C.selected; border = C.primary;
          }
          return (
            <button
              key={choice}
              onClick={() => handleSelect(choice)}
              style={{
                padding: "18px 0", borderRadius: 14,
                backgroundColor: bg, border: `2px solid ${border}`, color,
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
