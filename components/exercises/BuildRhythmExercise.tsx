"use client";

import { useState, useEffect } from "react";
import type { BuildRhythmConfig } from "@/types/music";
import type { NoteSymbol } from "@/types/music";
import type { Difficulty } from "@/lib/curriculum/content";
import type { ExerciseResult } from "./ExerciseEngine";
import { NoteSymbolSVG, NOTE_BEATS } from "./NoteSymbolSVG";

interface Props {
  config: BuildRhythmConfig;
  difficulty: Difficulty;
  submitted: boolean;
  onAnswerChange: (hasAnswer: boolean) => void;
  onComplete: (result: ExerciseResult) => void;
}

const C = {
  primary: "#574eb1", primaryDark: "#41379b",
  surfaceHigh: "var(--c-surface-high)", border: "var(--c-border)", muted: "var(--c-muted)",
  text: "var(--c-text)", selected: "#3d3580",
  success: "#006c4e", error: "#8b2828",
};

export function BuildRhythmExercise({ config, submitted, onAnswerChange, onComplete }: Props) {
  const [measure, setMeasure] = useState<NoteSymbol[]>([]);
  const total = measure.reduce((sum, s) => sum + NOTE_BEATS[s], 0);
  const filled = total === config.targetBeats;
  const overflowing = total > config.targetBeats;

  useEffect(() => {
    onAnswerChange(filled);
  }, [filled, onAnswerChange]);

  const addSymbol = (sym: NoteSymbol) => {
    if (submitted) return;
    const newTotal = total + NOTE_BEATS[sym];
    if (newTotal > config.targetBeats) return; // reject overflow
    setMeasure((m) => [...m, sym]);
  };

  const removeAt = (idx: number) => {
    if (submitted) return;
    setMeasure((m) => m.filter((_, i) => i !== idx));
  };

  const clear = () => {
    if (submitted) return;
    setMeasure([]);
  };

  useEffect(() => {
    if (!submitted) return;
    const passed = filled && !overflowing;
    onComplete({
      score: passed ? 100 : 0,
      passed,
      correctAnswerText: `Total = ${config.targetBeats} beats`,
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submitted]);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
      <p style={{ color: C.text, fontFamily: "'Nunito', sans-serif", fontSize: 22, fontWeight: 800, margin: 0, textAlign: "center" }}>
        Build {config.targetBeats}-beat measure
      </p>

      {/* Total + status */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ color: C.muted, fontFamily: "'Nunito', sans-serif", fontSize: 14 }}>
          Total:
        </span>
        <span style={{
          color: filled ? C.success : overflowing ? C.error : C.text,
          fontFamily: "'Nunito', sans-serif", fontSize: 24, fontWeight: 900,
        }}>
          {total} / {config.targetBeats}
        </span>
      </div>

      {/* Measure */}
      <div style={{
        minHeight: 100, width: "100%", maxWidth: 460,
        padding: "16px 20px", borderRadius: 16,
        backgroundColor: C.surfaceHigh,
        border: `2px solid ${filled ? C.success : C.border}`,
        display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8,
      }}>
        {measure.length === 0 && (
          <span style={{ color: C.muted, fontFamily: "'Nunito', sans-serif", fontSize: 14, fontStyle: "italic" }}>
            Tap notes below to fill the measure…
          </span>
        )}
        {measure.map((sym, i) => (
          <button
            key={i}
            onClick={() => removeAt(i)}
            title="Remove"
            style={{
              padding: 4, borderRadius: 8,
              backgroundColor: "transparent", border: `1px solid transparent`,
              cursor: submitted ? "default" : "pointer",
            }}
          >
            <NoteSymbolSVG symbol={sym} size={56} />
          </button>
        ))}
      </div>

      {/* Palette */}
      <div style={{
        display: "grid", gridTemplateColumns: `repeat(${Math.min(config.palette.length, 4)}, 1fr)`,
        gap: 10, width: "100%", maxWidth: 400,
      }}>
        {config.palette.map((sym) => {
          const beats = NOTE_BEATS[sym];
          const wouldOverflow = total + beats > config.targetBeats;
          return (
            <button
              key={sym}
              onClick={() => addSymbol(sym)}
              disabled={submitted || wouldOverflow}
              style={{
                padding: "12px 6px", borderRadius: 12,
                backgroundColor: wouldOverflow ? "transparent" : C.surfaceHigh,
                border: `2px solid ${C.border}`,
                cursor: submitted || wouldOverflow ? "not-allowed" : "pointer",
                opacity: wouldOverflow ? 0.3 : 1,
                display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
              }}
            >
              <NoteSymbolSVG symbol={sym} size={48} />
              <span style={{ color: C.muted, fontFamily: "'Nunito', sans-serif", fontSize: 11, fontWeight: 700 }}>
                {beats}
              </span>
            </button>
          );
        })}
      </div>

      {measure.length > 0 && !submitted && (
        <button
          onClick={clear}
          style={{
            padding: "8px 16px", borderRadius: 10,
            background: "transparent", border: `1px solid ${C.border}`,
            color: C.muted, fontFamily: "'Nunito', sans-serif",
            fontSize: 12, fontWeight: 700, cursor: "pointer",
          }}
        >
          Clear
        </button>
      )}
    </div>
  );
}
