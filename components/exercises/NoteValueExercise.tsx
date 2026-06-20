"use client";

import { useState, useEffect } from "react";
import type { NoteValueConfig, NoteSymbol } from "@/types/music";
import type { Difficulty } from "@/lib/curriculum/content";
import type { ExerciseResult } from "./ExerciseEngine";

const C = {
  primary: "#574eb1",
  surfaceHigh: "var(--c-surface-high)",
  border: "var(--c-border)",
  muted: "var(--c-muted)",
  text: "var(--c-text)",
  selected: "#3d3580",
};

function NoteSymbolSVG({ symbol }: { symbol: NoteSymbol }) {
  const white = "white";
  const dimLine = "rgba(255,255,255,0.2)";

  switch (symbol) {
    case "whole_note":
      return (
        <svg viewBox="0 0 100 80" width={110} height={88}>
          <ellipse cx="50" cy="42" rx="30" ry="20" fill="none" stroke={white} strokeWidth="5" />
        </svg>
      );
    case "half_note":
      return (
        <svg viewBox="0 0 80 110" width={80} height={110}>
          <ellipse cx="36" cy="80" rx="22" ry="15" fill="none" stroke={white} strokeWidth="4.5" />
          <line x1="58" y1="78" x2="58" y2="12" stroke={white} strokeWidth="4.5" strokeLinecap="round" />
        </svg>
      );
    case "quarter_note":
      return (
        <svg viewBox="0 0 80 110" width={80} height={110}>
          <ellipse cx="36" cy="80" rx="22" ry="15" fill={white} />
          <line x1="58" y1="78" x2="58" y2="12" stroke={white} strokeWidth="4.5" strokeLinecap="round" />
        </svg>
      );
    case "eighth_note":
      return (
        <svg viewBox="0 0 90 110" width={90} height={110}>
          <ellipse cx="36" cy="80" rx="22" ry="15" fill={white} />
          <line x1="58" y1="78" x2="58" y2="12" stroke={white} strokeWidth="4.5" strokeLinecap="round" />
          <path d="M58 12 C80 22 80 54 58 60" fill="none" stroke={white} strokeWidth="4.5" strokeLinecap="round" />
        </svg>
      );
    case "whole_rest":
      return (
        <svg viewBox="0 0 100 80" width={110} height={88}>
          <line x1="12" y1="36" x2="88" y2="36" stroke={dimLine} strokeWidth="1.5" />
          <rect x="26" y="36" width="48" height="18" rx="2" fill={white} />
        </svg>
      );
    case "half_rest":
      return (
        <svg viewBox="0 0 100 80" width={110} height={88}>
          <line x1="12" y1="54" x2="88" y2="54" stroke={dimLine} strokeWidth="1.5" />
          <rect x="26" y="36" width="48" height="18" rx="2" fill={white} />
        </svg>
      );
    case "quarter_rest":
      return (
        <svg viewBox="0 0 80 110" width={80} height={110}>
          <path
            d="M44 8 L30 28 L50 42 L28 58 L48 70 L32 90"
            stroke={white} strokeWidth="5" fill="none"
            strokeLinecap="round" strokeLinejoin="round"
          />
        </svg>
      );
  }
}

interface Props {
  config: NoteValueConfig;
  difficulty: Difficulty;
  submitted: boolean;
  onAnswerChange: (hasAnswer: boolean) => void;
  onComplete: (result: ExerciseResult) => void;
}

export function NoteValueExercise({ config, submitted, onAnswerChange, onComplete }: Props) {
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
      <p style={{
        color: C.text, fontFamily: "'Nunito', sans-serif",
        fontSize: 22, fontWeight: 800, margin: 0, textAlign: "center",
      }}>
        {config.question}
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
        display: "grid",
        gridTemplateColumns: config.choices.length <= 2 ? "1fr" : "1fr 1fr",
        gap: 12, width: "100%", maxWidth: 400,
      }}>
        {config.choices.map((choice) => {
          const isSelected = choice === selected;
          return (
            <button
              key={choice}
              onClick={() => handleSelect(choice)}
              style={{
                padding: "18px 12px", borderRadius: 14,
                backgroundColor: isSelected ? C.selected : C.surfaceHigh,
                border: `2px solid ${isSelected ? C.primary : C.border}`,
                color: C.text,
                fontFamily: "'Nunito', sans-serif", fontSize: 15, fontWeight: 700,
                cursor: submitted ? "default" : "pointer",
                transition: "background-color 0.15s, border-color 0.15s",
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
