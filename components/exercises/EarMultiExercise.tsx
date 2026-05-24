"use client";

import { useState, useRef, useCallback } from "react";
import type { EarMultiConfig } from "@/types/music";
import type { Difficulty } from "@/lib/curriculum/content";
import type { ExerciseResult } from "./ExerciseEngine";

interface Props {
  config: EarMultiConfig;
  difficulty: Difficulty;
  onComplete: (result: ExerciseResult) => void;
}

const C = {
  primary: "#574eb1", primaryDark: "#41379b",
  surfaceHigh: "#211F26", border: "#33313D", muted: "#938F99",
  success: "#006c4e", error: "#8b2828", text: "#f3eff5",
  selected: "#3d3580",
};

export function EarMultiExercise({ config, difficulty, onComplete }: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [submitted, setSubmitted] = useState(false);
  const [playing, setPlaying] = useState(false);
  const synthRef = useRef<unknown>(null);

  const playChord = useCallback(async () => {
    if (playing) return;
    setPlaying(true);
    try {
      const Tone = await import("tone");
      await Tone.start();
      if (!synthRef.current) {
        synthRef.current = new Tone.PolySynth(Tone.Synth, { oscillator: { type: "triangle" } }).toDestination();
      }
      const poly = synthRef.current as InstanceType<typeof Tone.PolySynth>;
      poly.triggerAttackRelease(config.targetNotes, "0.8");
      setTimeout(() => setPlaying(false), 900);
    } catch {
      setPlaying(false);
    }
  }, [config.targetNotes, playing]);

  const toggle = (choice: string) => {
    if (submitted) return;
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(choice) ? next.delete(choice) : next.add(choice);
      return next;
    });
  };

  const handleSubmit = () => {
    if (selected.size === 0 || submitted) return;
    setSubmitted(true);
  };

  const handleContinue = () => {
    const correct = config.correctAnswers;
    const sel = [...selected];
    const hits = sel.filter((s) => correct.includes(s)).length;
    const total = correct.length;
    const score = Math.round((hits / total) * 100);
    onComplete({ score, passed: score >= 70 });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 28 }}>
      <p style={{ color: C.muted, fontFamily: "'Nunito', sans-serif", fontSize: 14, margin: 0 }}>
        {difficulty === "beginner"
          ? `Listen to the chord and select all ${config.correctAnswers.length} notes you hear.`
          : `Select all notes in the chord (${config.correctAnswers.length} notes).`}
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
          if (submitted) {
            if (isCorrect && isSelected) { bg = C.success; border = C.success; }
            else if (!isCorrect && isSelected) { bg = C.error; border = C.error; }
            else if (isCorrect && !isSelected) { border = C.success; }
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

      {!submitted ? (
        <button
          onClick={handleSubmit}
          disabled={selected.size === 0}
          style={{
            padding: "14px 48px", borderRadius: 14,
            backgroundColor: selected.size === 0 ? C.surfaceHigh : C.primary,
            boxShadow: selected.size === 0 ? "none" : `0 4px 0 0 ${C.primaryDark}`,
            color: selected.size === 0 ? C.muted : "white",
            border: `2px solid ${selected.size === 0 ? C.border : "transparent"}`,
            fontFamily: "'Nunito', sans-serif", fontSize: 16, fontWeight: 700,
            cursor: selected.size === 0 ? "not-allowed" : "pointer",
          }}
        >
          Check
        </button>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
          <p style={{ color: C.muted, fontFamily: "'Nunito', sans-serif", fontSize: 14, margin: 0 }}>
            Correct notes: {config.correctAnswers.join(", ")}
          </p>
          <button
            onClick={handleContinue}
            style={{
              padding: "14px 48px", borderRadius: 14,
              backgroundColor: C.primary, boxShadow: `0 4px 0 0 ${C.primaryDark}`,
              color: "white", border: "none",
              fontFamily: "'Nunito', sans-serif", fontSize: 16, fontWeight: 700, cursor: "pointer",
            }}
          >
            Continue
          </button>
        </div>
      )}
    </div>
  );
}
