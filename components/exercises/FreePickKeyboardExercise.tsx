"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import type { FreePickKeyboardConfig } from "@/types/music";
import type { Difficulty } from "@/lib/curriculum/content";
import type { ExerciseResult } from "./ExerciseEngine";

interface Props {
  config: FreePickKeyboardConfig;
  difficulty: Difficulty;
  submitted: boolean;
  onAnswerChange: (hasAnswer: boolean) => void;
  onComplete: (result: ExerciseResult) => void;
}

const C = {
  primary: "#574eb1", primaryDark: "#41379b",
  surfaceHigh: "var(--c-surface-high)", border: "var(--c-border)", muted: "var(--c-muted)",
  text: "var(--c-text)",
};

function buildKeyboard(range: [number, number]): string[] {
  const keys: string[] = [];
  for (let oct = range[0]; oct <= range[1]; oct++) {
    for (const name of ["C", "D", "E", "F", "G", "A", "B"]) {
      keys.push(`${name}${oct}`);
    }
  }
  return keys;
}

export function FreePickKeyboardExercise({ config, submitted, onAnswerChange, onComplete }: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const synthRef = useRef<unknown>(null);
  const whiteKeys = buildKeyboard(config.octaveRange);

  const playTarget = useCallback(async () => {
    if (playing) return;
    setPlaying(true);
    try {
      const Tone = await import("tone");
      await Tone.start();
      if (!synthRef.current) {
        synthRef.current = new Tone.Synth({ oscillator: { type: "triangle" } }).toDestination();
      }
      const synth = synthRef.current as InstanceType<typeof Tone.Synth>;
      synth.triggerAttackRelease(config.targetNote, "0.8");
      setTimeout(() => setPlaying(false), 900);
    } catch {
      setPlaying(false);
    }
  }, [config.targetNote, playing]);

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
        Tap the note you hear
      </p>

      <button
        onClick={playTarget}
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

      <div style={{ display: "flex", gap: 3, overflowX: "auto", maxWidth: "100%", padding: "0 4px" }}>
        {whiteKeys.map((note) => {
          const isSelected = note === selected;
          return (
            <button
              key={note}
              onClick={() => handleSelect(note)}
              style={{
                width: 36, height: 80, borderRadius: "0 0 6px 6px",
                backgroundColor: isSelected ? "#a5b4fc" : "white",
                border: `2px solid ${isSelected ? C.primary : "#ccc"}`,
                cursor: submitted ? "default" : "pointer", flexShrink: 0,
                display: "flex", alignItems: "flex-end", justifyContent: "center", paddingBottom: 4,
              }}
            >
              <span style={{ fontSize: 9, fontFamily: "'Nunito', sans-serif", color: "#555", fontWeight: 600 }}>
                {note.replace(/\d$/, "")}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
