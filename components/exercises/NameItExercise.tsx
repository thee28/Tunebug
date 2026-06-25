"use client";

import { useState, useEffect } from "react";
import type { NameItConfig } from "@/types/music";
import type { Difficulty } from "@/lib/curriculum/content";
import type { ExerciseResult } from "./ExerciseEngine";

interface Props {
  config: NameItConfig;
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

export function NameItExercise({ config, submitted, onAnswerChange, onComplete }: Props) {
  const [selected, setSelected] = useState<string | null>(null);

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

  const targetName = config.targetNote.replace(/\d$/, "");

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 28 }}>
      <p style={{ color: C.text, fontFamily: "'Nunito', sans-serif", fontSize: 22, fontWeight: 800, margin: 0, textAlign: "center" }}>
        Name this note
      </p>

      {/* Staff placeholder — TODO: real VexFlow rendering */}
      <div style={{
        width: "100%", maxWidth: 360, height: 120,
        backgroundColor: C.surfaceHigh, borderRadius: 12,
        border: `2px solid ${C.border}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        flexDirection: "column", gap: 4,
      }}>
        <span style={{ color: C.muted, fontSize: 12, fontFamily: "'Nunito', sans-serif" }}>Staff</span>
        <span style={{ color: C.text, fontSize: 26, fontWeight: 900, fontFamily: "'Nunito', sans-serif" }}>{targetName}</span>
        <span style={{ color: C.muted, fontSize: 10, fontFamily: "'Nunito', sans-serif" }}>{config.vexKey}</span>
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: `repeat(${Math.min(config.choices.length, 4)}, 1fr)`,
        gap: 10, width: "100%", maxWidth: 400,
      }}>
        {config.choices.map((choice) => {
          const isSelected = choice === selected;
          return (
            <button
              key={choice}
              onClick={() => handleSelect(choice)}
              style={{
                padding: "16px 0", borderRadius: 14,
                backgroundColor: isSelected ? C.selected : C.surfaceHigh,
                border: `2px solid ${isSelected ? C.primary : C.border}`,
                color: C.text,
                fontFamily: "'Nunito', sans-serif", fontSize: 22, fontWeight: 900,
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
