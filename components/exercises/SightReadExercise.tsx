"use client";

import { useState, useEffect } from "react";
import type { SightReadPianoConfig } from "@/types/music";
import type { Difficulty } from "@/lib/curriculum/content";
import type { ExerciseResult } from "./ExerciseEngine";
import { Keyboard } from "./Keyboard";
import { StaffRenderer } from "./StaffRenderer";

interface Props {
  config: SightReadPianoConfig;
  difficulty: Difficulty;
  submitted: boolean;
  onAnswerChange: (hasAnswer: boolean) => void;
  onComplete: (result: ExerciseResult) => void;
}

const C = {
  primary: "#574eb1", primaryDark: "#41379b",
  surfaceHigh: "var(--c-surface-high)", border: "var(--c-border)", muted: "var(--c-muted)",
  success: "#006c4e", error: "#8b2828", text: "var(--c-text)",
};

export function SightReadExercise({ config, submitted, onAnswerChange, onComplete }: Props) {
  const [selected, setSelected] = useState<string | null>(null);

  const handleSelect = (note: string) => {
    if (submitted) return;
    setSelected(note);
    onAnswerChange(true);
  };

  useEffect(() => {
    if (!submitted) return;
    const passed = selected === config.targetNote;
    onComplete({ score: passed ? 100 : 0, passed, correctAnswerText: config.targetNote });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submitted]);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 24 }}>
      <p style={{ color: C.text, fontFamily: "'Nunito', sans-serif", fontSize: 22, fontWeight: 800, margin: 0, textAlign: "center" }}>
        Find this note on the keyboard
      </p>

      <div style={{
        padding: 12, borderRadius: 12,
        backgroundColor: C.surfaceHigh, border: `2px solid ${C.border}`,
      }}>
        <StaffRenderer vexKey={config.vexKey} />
      </div>

      <Keyboard
        octaveRange={config.octaveRange}
        selectedNote={selected}
        disabled={submitted}
        onSelect={handleSelect}
      />
    </div>
  );
}
