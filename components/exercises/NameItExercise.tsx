"use client";

import { useState, useEffect } from "react";
import type { NameItConfig } from "@/types/music";
import type { Difficulty } from "@/lib/curriculum/content";
import type { ExerciseResult } from "./ExerciseEngine";
import { StaffRenderer } from "./StaffRenderer";

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

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 28 }}>
      <p style={{ color: C.text, fontFamily: "'Nunito', sans-serif", fontSize: 22, fontWeight: 800, margin: 0, textAlign: "center" }}>
        Name this note
      </p>

      <div style={{
        padding: 12, borderRadius: 12,
        backgroundColor: C.surfaceHigh, border: `2px solid ${C.border}`,
      }}>
        <StaffRenderer vexKey={config.vexKey} />
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
