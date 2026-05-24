"use client";

// TODO: integrate pitchy for real-time mic pitch detection
// API: import { PitchDetector } from "pitchy"
// Get microphone stream via navigator.mediaDevices.getUserMedia
// Feed audio frames to PitchDetector, compare cents deviation to config.allowedDeviation

import { useState } from "react";
import type { PitchMatchConfig } from "@/types/music";
import type { Difficulty } from "@/lib/curriculum/content";
import type { ExerciseResult } from "./ExerciseEngine";
import { DIFFICULTY_SETTINGS } from "@/lib/curriculum/content";

interface Props {
  config: PitchMatchConfig;
  difficulty: Difficulty;
  onComplete: (result: ExerciseResult) => void;
}

const C = {
  primary: "#574eb1", primaryDark: "#41379b",
  surfaceHigh: "#211F26", border: "#33313D", muted: "#938F99",
  success: "#006c4e", text: "#f3eff5",
};

export function PitchMatchExercise({ config, difficulty, onComplete }: Props) {
  const [phase, setPhase] = useState<"idle" | "listening" | "done">("idle");
  const settings = DIFFICULTY_SETTINGS[difficulty];

  const handleStart = () => setPhase("listening");

  const handleSimulatePass = () => {
    setPhase("done");
    setTimeout(() => onComplete({ score: 100, passed: true }), 600);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 32 }}>
      <div style={{ textAlign: "center" }}>
        <p style={{ color: C.muted, fontFamily: "'Nunito', sans-serif", fontSize: 14, margin: "0 0 8px" }}>
          Sing this note into your microphone
        </p>
        <div style={{
          width: 120, height: 120, borderRadius: "50%",
          backgroundColor: C.surfaceHigh, border: `3px solid ${C.border}`,
          display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto",
        }}>
          <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: 52, fontWeight: 900, color: C.text }}>
            {config.displayNote}
          </span>
        </div>
        <p style={{ color: C.muted, fontFamily: "'Nunito', sans-serif", fontSize: 12, marginTop: 8 }}>
          {config.targetNote} · hold for {settings.holdDuration}s · ±{settings.allowedDeviation}¢
        </p>
      </div>

      {phase === "idle" && (
        <button
          onClick={handleStart}
          style={{
            padding: "16px 48px", borderRadius: 14,
            backgroundColor: C.primary, boxShadow: `0 4px 0 0 ${C.primaryDark}`,
            color: "white", border: "none",
            fontFamily: "'Nunito', sans-serif", fontSize: 16, fontWeight: 700, cursor: "pointer",
            display: "flex", alignItems: "center", gap: 8,
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>mic</span>
          Start Listening
        </button>
      )}

      {phase === "listening" && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
          <div style={{
            width: 80, height: 80, borderRadius: "50%",
            backgroundColor: "#8b2828", border: "3px solid #f87171",
            display: "flex", alignItems: "center", justifyContent: "center",
            animation: "pulse 1s infinite",
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: 36, color: "white" }}>mic</span>
          </div>
          <p style={{ color: "#f87171", fontFamily: "'Nunito', sans-serif", fontSize: 13, margin: 0 }}>
            Listening… (pitch detection coming soon)
          </p>
          <button
            onClick={handleSimulatePass}
            style={{
              padding: "10px 32px", borderRadius: 12,
              backgroundColor: C.success, color: "white", border: "none",
              fontFamily: "'Nunito', sans-serif", fontSize: 14, fontWeight: 700, cursor: "pointer",
            }}
          >
            Mark as done
          </button>
        </div>
      )}

      {phase === "done" && (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span className="material-symbols-outlined" style={{ color: "#4ade80", fontSize: 28 }}>check_circle</span>
          <span style={{ color: "#4ade80", fontFamily: "'Nunito', sans-serif", fontWeight: 700 }}>Done!</span>
        </div>
      )}
    </div>
  );
}
