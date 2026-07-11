"use client";

import { useState, useCallback, useEffect } from "react";
import { getPiano } from "@/lib/audio/piano";
import type { EarMultiConfig } from "@/types/music";
import type { Difficulty } from "@/lib/curriculum/content";
import type { ExerciseResult } from "./ExerciseEngine";

interface Props {
  config: EarMultiConfig;
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

export function EarMultiExercise({ config, difficulty, submitted, onAnswerChange, onComplete }: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [playing, setPlaying] = useState(false);

  const playChord = useCallback(async () => {
    if (playing) return;
    setPlaying(true);
    try {
      const piano = await getPiano();
      piano.triggerAttackRelease(config.targetNotes, "0.8");
      setTimeout(() => setPlaying(false), 900);
    } catch {
      setPlaying(false);
    }
  }, [config.targetNotes, playing]);

  const toggle = (choice: string) => {
    if (submitted) return;
    // Compute outside the updater — notifying the parent from inside it is a
    // setState-during-render violation.
    const next = new Set(selected);
    if (next.has(choice)) next.delete(choice);
    else next.add(choice);
    setSelected(next);
    onAnswerChange(next.size > 0);
  };

  useEffect(() => {
    if (!submitted) return;
    const correct = config.correctAnswers;
    const sel = [...selected];
    const hits = sel.filter((s) => correct.includes(s)).length;
    const score = sel.length === 0 ? 0 : Math.round((hits / correct.length) * 100);
    onComplete({ score, passed: score >= 70, correctAnswerText: correct.join(", ") });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submitted]);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 32 }}>
      <p style={{ color: C.text, fontFamily: "'Nunito', sans-serif", fontSize: 22, fontWeight: 800, margin: 0, textAlign: "center" }}>
        {difficulty === "beginner"
          ? `Select all ${config.correctAnswers.length} notes you hear`
          : `Identify the ${config.correctAnswers.length} notes`}
      </p>

      <button
        onClick={playChord}
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
          {playing ? "graphic_eq" : "queue_music"}
        </span>
      </button>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, width: "100%", maxWidth: 360 }}>
        {config.choices.map((choice) => {
          const isCorrect = config.correctAnswers.includes(choice);
          const isSelected = selected.has(choice);
          let bg = C.surfaceHigh, border = C.border;
          if (submitted && isCorrect) {
            bg = "rgba(0,108,78,0.25)"; border = "#006c4e";
          } else if (submitted && isSelected) {
            bg = "rgba(139,40,40,0.25)"; border = "#8b2828";
          } else if (isSelected) {
            bg = C.selected; border = C.primary;
          }
          return (
            <button
              key={choice}
              onClick={() => toggle(choice)}
              style={{
                padding: "14px 0", borderRadius: 12,
                backgroundColor: bg, border: `2px solid ${border}`, color: C.text,
                fontFamily: "'Nunito', sans-serif", fontSize: 17, fontWeight: 700,
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
