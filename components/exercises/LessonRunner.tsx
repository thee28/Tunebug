"use client";

import { useState } from "react";
import type { ExerciseType, ExerciseConfig } from "@/types/music";
import type { Difficulty } from "@/lib/curriculum/content";
import { ExerciseEngine, type ExerciseResult } from "./ExerciseEngine";

export interface LessonExercise {
  type: ExerciseType;
  config: ExerciseConfig;
}

interface Props {
  title: string;
  exercises: LessonExercise[];
  difficulty: Difficulty;
  xpReward: number;
  onComplete: (totalScore: number) => void;
  onExit: () => void;
}

const C = {
  primary: "#574eb1", primaryDark: "#41379b",
  surface: "#141321", surfaceHigh: "#211F26",
  border: "#33313D", muted: "#938F99",
  success: "#006c4e", text: "#f3eff5",
};

export function LessonRunner({ title, exercises, difficulty, xpReward, onComplete, onExit }: Props) {
  const [index, setIndex] = useState(0);
  const [scores, setScores] = useState<number[]>([]);
  const [phase, setPhase] = useState<"exercise" | "result">("exercise");
  const [earnedXP, setEarnedXP] = useState(0);

  const handleExerciseComplete = (result: ExerciseResult) => {
    const newScores = [...scores, result.score];
    setScores(newScores);

    if (index < exercises.length - 1) {
      setIndex((i) => i + 1);
    } else {
      const total = Math.round(newScores.reduce((a, b) => a + b, 0) / newScores.length);
      const xp = total >= 70 ? xpReward : Math.round(xpReward * 0.3);
      setEarnedXP(xp);
      setPhase("result");
      onComplete(total);
    }
  };

  const totalScore = scores.length
    ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
    : 0;

  const passed = totalScore >= 70;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: "100vh", backgroundColor: C.surface }}>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", padding: "16px 20px", gap: 16,
        borderBottom: `1px solid ${C.border}`,
      }}>
        <button
          onClick={onExit}
          style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}
        >
          <span className="material-symbols-outlined" style={{ color: C.muted, fontSize: 24 }}>close</span>
        </button>

        {/* Progress bar */}
        <div style={{ flex: 1, height: 8, borderRadius: 4, backgroundColor: C.surfaceHigh, overflow: "hidden" }}>
          <div
            style={{
              height: "100%", borderRadius: 4, backgroundColor: C.primary,
              width: `${((phase === "result" ? exercises.length : index) / exercises.length) * 100}%`,
              transition: "width 0.3s ease",
            }}
          />
        </div>

        <span style={{ color: C.muted, fontFamily: "'Nunito', sans-serif", fontSize: 13, fontWeight: 600, whiteSpace: "nowrap" }}>
          {phase === "result" ? exercises.length : index + 1}/{exercises.length}
        </span>
      </div>

      {/* Body */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px 20px" }}>
        {phase === "exercise" ? (
          <div style={{ width: "100%", maxWidth: 480 }}>
            <p style={{
              color: C.muted, fontFamily: "'Nunito', sans-serif", fontSize: 12,
              fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em",
              margin: "0 0 24px", textAlign: "center",
            }}>
              {title}
            </p>
            <ExerciseEngine
              type={exercises[index].type}
              config={exercises[index].config}
              difficulty={difficulty}
              onComplete={handleExerciseComplete}
            />
          </div>
        ) : (
          /* Result screen */
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 24, textAlign: "center" }}>
            <div style={{
              width: 100, height: 100, borderRadius: "50%",
              backgroundColor: passed ? C.success : C.surfaceHigh,
              boxShadow: passed ? `0 8px 0 0 #00513a` : `0 8px 0 0 rgba(0,0,0,0.4)`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: 52, color: "white", fontVariationSettings: "'FILL' 1" }}>
                {passed ? "star" : "sentiment_neutral"}
              </span>
            </div>

            <div>
              <h2 style={{ color: C.text, fontFamily: "'Nunito', sans-serif", fontSize: 26, fontWeight: 900, margin: "0 0 6px" }}>
                {passed ? "Lesson Complete!" : "Keep Practicing"}
              </h2>
              <p style={{ color: C.muted, fontFamily: "'Nunito', sans-serif", fontSize: 15, margin: 0 }}>
                Score: {totalScore}%
              </p>
            </div>

            {earnedXP > 0 && (
              <div style={{
                padding: "10px 20px", borderRadius: 12,
                backgroundColor: C.surfaceHigh, border: `2px solid ${C.border}`,
                display: "flex", alignItems: "center", gap: 8,
              }}>
                <span style={{ fontSize: 20 }}>⭐</span>
                <span style={{ color: "#facc15", fontFamily: "'Nunito', sans-serif", fontWeight: 800, fontSize: 18 }}>
                  +{earnedXP} XP
                </span>
              </div>
            )}

            {/* Per-exercise breakdown */}
            <div style={{ display: "flex", gap: 8 }}>
              {scores.map((s, i) => (
                <div
                  key={i}
                  style={{
                    width: 36, height: 36, borderRadius: "50%",
                    backgroundColor: s >= 70 ? C.success : C.surfaceHigh,
                    border: `2px solid ${s >= 70 ? "#4ade80" : C.border}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 16, color: s >= 70 ? "#4ade80" : C.muted, fontVariationSettings: "'FILL' 1" }}>
                    {s >= 70 ? "check" : "close"}
                  </span>
                </div>
              ))}
            </div>

            <button
              onClick={onExit}
              style={{
                padding: "14px 56px", borderRadius: 14,
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
    </div>
  );
}
