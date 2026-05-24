"use client";

import { useState, useRef, useCallback } from "react";
import type { IntervalIdConfig, IntervalName } from "@/types/music";
import type { Difficulty } from "@/lib/curriculum/content";
import type { ExerciseResult } from "./ExerciseEngine";

interface Props {
  config: IntervalIdConfig;
  difficulty: Difficulty;
  onComplete: (result: ExerciseResult) => void;
}

const C = {
  primary: "#574eb1", primaryDark: "#41379b",
  surfaceHigh: "#211F26", border: "#33313D", muted: "#938F99",
  success: "#006c4e", error: "#8b2828", text: "#f3eff5",
};

export function IntervalIdExercise({ config, difficulty, onComplete }: Props) {
  const [selected, setSelected] = useState<IntervalName | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [playing, setPlaying] = useState(false);
  const synthRef = useRef<unknown>(null);

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
      // Play noteA → noteB → both
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
    if (revealed) return;
    setSelected(choice);
    setRevealed(true);
  };

  const handleContinue = () => {
    onComplete({ score: selected === config.correctAnswer ? 100 : 0, passed: selected === config.correctAnswer });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 28 }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
        <p style={{ color: C.muted, fontFamily: "'Nunito', sans-serif", fontSize: 14, margin: 0 }}>
          {difficulty === "beginner" ? "Listen to the two notes and name the interval." : "Identify the interval."}
        </p>
        <p style={{ color: C.text, fontFamily: "'Nunito', sans-serif", fontSize: 13, margin: 0, opacity: 0.6 }}>
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
          if (revealed) {
            if (isCorrect) { bg = C.success; border = C.success; }
            else if (isSelected) { bg = C.error; border = C.error; }
          }
          return (
            <button
              key={choice}
              onClick={() => handleSelect(choice as IntervalName)}
              style={{
                padding: "14px 20px", borderRadius: 12, textAlign: "left",
                backgroundColor: bg, border: `2px solid ${border}`, color: C.text,
                fontFamily: "'Nunito', sans-serif", fontSize: 16, fontWeight: 600,
                cursor: revealed ? "default" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "space-between",
              }}
            >
              {choice}
              {revealed && isCorrect && (
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>check</span>
              )}
              {revealed && isSelected && !isCorrect && (
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
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
