"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import type { IntervalIdConfig, IntervalName } from "@/types/music";
import type { Difficulty } from "@/lib/curriculum/content";
import type { ExerciseResult } from "./ExerciseEngine";

interface Props {
  config: IntervalIdConfig;
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

export function IntervalIdExercise({ config, difficulty, submitted, onAnswerChange, onComplete }: Props) {
  const [selected, setSelected] = useState<IntervalName | null>(null);
  const [playing, setPlaying] = useState(false);
  const synthRef = useRef<unknown>(null);

  useEffect(() => {
    return () => {
      (synthRef.current as { dispose?: () => void } | null)?.dispose?.();
    };
  }, []);

  const playInterval = useCallback(async () => {
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
      synth.triggerAttackRelease(config.noteA, "0.4", now);
      synth.triggerAttackRelease(config.noteB, "0.4", now + 0.5);
      setTimeout(() => {
        const poly = new Tone.PolySynth(Tone.Synth).toDestination();
        poly.triggerAttackRelease([config.noteA, config.noteB], "0.6");
      }, 1200);
      setTimeout(() => setPlaying(false), 2000);
    } catch {
      setPlaying(false);
    }
  }, [config.noteA, config.noteB, playing]);

  const handleSelect = (choice: IntervalName) => {
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
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
        <p style={{ color: C.text, fontFamily: "'Nunito', sans-serif", fontSize: 22, fontWeight: 800, margin: 0, textAlign: "center" }}>
          {difficulty === "beginner" ? "Name this interval" : "Identify the interval"}
        </p>
        <p style={{ color: C.muted, fontFamily: "'Nunito', sans-serif", fontSize: 13, margin: 0, opacity: 0.7 }}>
          {config.noteA} → {config.noteB}
        </p>
      </div>

      <button
        onClick={playInterval}
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
          {playing ? "graphic_eq" : "piano"}
        </span>
      </button>

      <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%", maxWidth: 360 }}>
        {config.choices.map((choice) => {
          const isCorrect = choice === config.correctAnswer;
          const isSelected = choice === selected;
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
              onClick={() => handleSelect(choice as IntervalName)}
              style={{
                padding: "14px 20px", borderRadius: 12, textAlign: "left",
                backgroundColor: bg, border: `2px solid ${border}`, color: C.text,
                fontFamily: "'Nunito', sans-serif", fontSize: 16, fontWeight: 600,
                cursor: submitted ? "default" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "space-between",
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
