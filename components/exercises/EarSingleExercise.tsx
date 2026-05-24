"use client";

import { useState, useRef, useCallback } from "react";
import type { EarSingleConfig } from "@/types/music";
import type { Difficulty } from "@/lib/curriculum/content";
import type { ExerciseResult } from "./ExerciseEngine";

interface Props {
  config: EarSingleConfig;
  difficulty: Difficulty;
  onComplete: (result: ExerciseResult) => void;
}

const C = {
  primary: "#574eb1",
  primaryDark: "#41379b",
  surfaceHigh: "#211F26",
  border: "#33313D",
  muted: "#938F99",
  success: "#006c4e",
  successDark: "#00513a",
  error: "#8b2828",
  errorDark: "#6b1c1c",
  text: "#f3eff5",
};

export function EarSingleExercise({ config, difficulty, onComplete }: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [playing, setPlaying] = useState(false);
  const synthRef = useRef<unknown>(null);

  const playNote = useCallback(async () => {
    if (playing) return;
    setPlaying(true);
    try {
      const Tone = await import("tone");
      await Tone.start();
      if (!synthRef.current) {
        synthRef.current = new Tone.Synth({ oscillator: { type: "triangle" } }).toDestination();
      }
      const synth = synthRef.current as InstanceType<typeof Tone.Synth>;
      synth.triggerAttackRelease(config.targetNote, "0.6");
      setTimeout(() => setPlaying(false), 700);
    } catch {
      setPlaying(false);
    }
  }, [config.targetNote, playing]);

  const handleSelect = (choice: string) => {
    if (revealed) return;
    setSelected(choice);
    setRevealed(true);
  };

  const handleContinue = () => {
    onComplete({ score: selected === config.correctAnswer ? 100 : 0, passed: selected === config.correctAnswer });
  };

  const cols = config.choices.length <= 4 ? 2 : 3;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 28 }}>
      <p style={{ color: C.muted, fontFamily: "'Nunito', sans-serif", fontSize: 14, margin: 0 }}>
        {difficulty === "beginner" ? "Listen to the note, then pick the correct name." : "Identify the note."}
      </p>

      <button
        onClick={playNote}
        style={{
          width: 96, height: 96, borderRadius: "50%",
          backgroundColor: playing ? C.primaryDark : C.primary,
          boxShadow: `0 6px 0 0 ${C.primaryDark}`,
          border: "none", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          transition: "transform 0.1s",
          transform: playing ? "translateY(3px)" : "none",
        }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 48, color: "white" }}>
          {playing ? "graphic_eq" : "volume_up"}
        </span>
      </button>

      <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 12, width: "100%", maxWidth: 360 }}>
        {config.choices.map((choice) => {
          const isCorrect = choice === config.correctAnswer;
          const isSelected = choice === selected;
          let bg = C.surfaceHigh, border = C.border, color = C.text;
          if (revealed) {
            if (isCorrect) { bg = C.success; border = C.success; }
            else if (isSelected) { bg = C.error; border = C.error; }
          }
          return (
            <button
              key={choice}
              onClick={() => handleSelect(choice)}
              style={{
                padding: "18px 0", borderRadius: 14,
                backgroundColor: bg, border: `2px solid ${border}`, color,
                fontFamily: "'Nunito', sans-serif", fontSize: 20, fontWeight: 700,
                cursor: revealed ? "default" : "pointer",
                transition: "background-color 0.15s",
              }}
            >
              {choice}
              {revealed && isCorrect && (
                <span className="material-symbols-outlined" style={{ fontSize: 16, marginLeft: 6, verticalAlign: "middle" }}>check</span>
              )}
              {revealed && isSelected && !isCorrect && (
                <span className="material-symbols-outlined" style={{ fontSize: 16, marginLeft: 6, verticalAlign: "middle" }}>close</span>
              )}
            </button>
          );
        })}
      </div>

      {revealed && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
          <p style={{ color: selected === config.correctAnswer ? "#4ade80" : "#f87171", fontFamily: "'Nunito', sans-serif", fontWeight: 700, fontSize: 15, margin: 0 }}>
            {selected === config.correctAnswer ? "Correct!" : `It was ${config.correctAnswer}`}
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
