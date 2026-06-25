"use client";

import { useState, useEffect } from "react";
import type { CountBeatsConfig } from "@/types/music";
import type { Difficulty } from "@/lib/curriculum/content";
import type { ExerciseResult } from "./ExerciseEngine";
import { NoteSymbolSVG } from "./NoteSymbolSVG";

interface Props {
  config: CountBeatsConfig;
  difficulty: Difficulty;
  submitted: boolean;
  onAnswerChange: (hasAnswer: boolean) => void;
  onComplete: (result: ExerciseResult) => void;
}

const C = {
  primary: "#574eb1",
  surfaceHigh: "var(--c-surface-high)",
  border: "var(--c-border)", text: "var(--c-text)",
  selected: "#3d3580",
};

export function CountBeatsExercise({ config, submitted, onAnswerChange, onComplete }: Props) {
  const [selected, setSelected] = useState<number | null>(null);

  const handleSelect = (choice: number) => {
    if (submitted) return;
    setSelected(choice);
    onAnswerChange(true);
  };

  useEffect(() => {
    if (!submitted) return;
    const passed = selected === config.correctBeats;
    onComplete({ score: passed ? 100 : 0, passed, correctAnswerText: `${config.correctBeats} beat${config.correctBeats === 1 ? "" : "s"}` });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submitted]);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 28 }}>
      <p style={{ color: C.text, fontFamily: "'Nunito', sans-serif", fontSize: 22, fontWeight: 800, margin: 0, textAlign: "center" }}>
        How many beats is this?
      </p>

      <div style={{
        width: 180, height: 180, borderRadius: 24,
        backgroundColor: C.surfaceHigh,
        border: `2px solid ${C.border}`,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <NoteSymbolSVG symbol={config.symbol} />
      </div>

      <div style={{
        display: "grid", gridTemplateColumns: `repeat(${Math.min(config.choices.length, 4)}, 1fr)`,
        gap: 12, width: "100%", maxWidth: 400,
      }}>
        {config.choices.map((choice) => {
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
                fontFamily: "'Nunito', sans-serif", fontSize: 22, fontWeight: 800,
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
