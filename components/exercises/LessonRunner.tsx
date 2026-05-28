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
  primary: "#574eb1", primaryDark: "#41379b", primaryDim: "#c5c0ff",
  surface: "#0F0F13", surfaceHigh: "#211F26",
  border: "#33313D", muted: "#938F99",
  success: "#006c4e", successDim: "#83f5c6",
  error: "#8b2828", errorDim: "#ffb4ab",
  text: "#f3eff5", tertiary: "#ffb95d",
};

export function LessonRunner({ title, exercises, difficulty, xpReward, onComplete, onExit }: Props) {
  const [index, setIndex] = useState(0);
  const [scores, setScores] = useState<number[]>([]);
  const [phase, setPhase] = useState<"exercise" | "result">("exercise");
  const [earnedXP, setEarnedXP] = useState(0);

  // Per-exercise submit flow
  const [submitted, setSubmitted] = useState(false);
  const [hasAnswer, setHasAnswer] = useState(false);
  const [pendingResult, setPendingResult] = useState<ExerciseResult | null>(null);

  const handleExerciseComplete = (result: ExerciseResult) => {
    setPendingResult(result);
  };

  const handleContinue = () => {
    if (!pendingResult) return;
    const newScores = [...scores, pendingResult.score];
    setScores(newScores);

    if (index < exercises.length - 1) {
      setIndex((i) => i + 1);
      setSubmitted(false);
      setHasAnswer(false);
      setPendingResult(null);
    } else {
      const total = Math.round(newScores.reduce((a, b) => a + b, 0) / newScores.length);
      const xp = total >= 70 ? xpReward : Math.round(xpReward * 0.3);
      setEarnedXP(xp);
      setPhase("result");
      onComplete(total);
      setSubmitted(false);
      setHasAnswer(false);
      setPendingResult(null);
    }
  };

  const handleCheck = () => {
    if (!hasAnswer) return;
    setSubmitted(true);
  };

  const progressPct = ((phase === "result" ? exercises.length : index) / exercises.length) * 100;
  const isCorrect = pendingResult?.passed ?? false;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", backgroundColor: C.surface, overflow: "hidden" }}>

      {/* ── Top bar ── */}
      <div style={{
        display: "flex", alignItems: "center", padding: "0 72px",
        height: 64, gap: 8, flexShrink: 0,
      }}>
        <button
          onClick={onExit}
          style={{
            width: 36, height: 36, borderRadius: "50%",
            background: "none", border: "none", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            marginTop: 8,
          }}
        >
          <span className="material-symbols-outlined" style={{ color: C.muted, fontSize: 26 }}>close</span>
        </button>

        {/* Progress bar */}
        <div style={{ flex: 1, height: 14, borderRadius: 7, backgroundColor: C.surfaceHigh, overflow: "hidden", marginTop: 8 }}>
          <div style={{
            height: "100%", borderRadius: 7,
            backgroundColor: C.primary,
            width: `${progressPct}%`,
            transition: "width 0.4s ease",
          }} />
        </div>

        {/* Hearts */}
        <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 8 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 28, color: "#ffb4ab", fontVariationSettings: "'FILL' 1" }}>favorite</span>
          <span style={{ color: C.text, fontFamily: "'Nunito', sans-serif", fontSize: 18, fontWeight: 700 }}>∞</span>
        </div>
      </div>

      {/* ── Body ── */}
      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px 20px 120px" }}>
        {phase === "exercise" ? (
          <div style={{ width: "100%", maxWidth: 480 }}>
            <ExerciseEngine
              type={exercises[index].type}
              config={exercises[index].config}
              difficulty={difficulty}
              submitted={submitted}
              onAnswerChange={setHasAnswer}
              onComplete={handleExerciseComplete}
            />
          </div>
        ) : (
          /* Result screen */
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 24, textAlign: "center" }}>
            <div style={{
              width: 100, height: 100, borderRadius: "50%",
              backgroundColor: scores.reduce((a, b) => a + b, 0) / scores.length >= 70 ? C.success : C.surfaceHigh,
              boxShadow: scores.reduce((a, b) => a + b, 0) / scores.length >= 70 ? `0 8px 0 0 #00513a` : `0 8px 0 0 rgba(0,0,0,0.4)`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: 52, color: "white", fontVariationSettings: "'FILL' 1" }}>
                {scores.reduce((a, b) => a + b, 0) / scores.length >= 70 ? "star" : "sentiment_neutral"}
              </span>
            </div>

            <div>
              <h2 style={{ color: C.text, fontFamily: "'Nunito', sans-serif", fontSize: 26, fontWeight: 900, margin: "0 0 6px" }}>
                {scores.reduce((a, b) => a + b, 0) / scores.length >= 70 ? "Lesson Complete!" : "Keep Practicing"}
              </h2>
              <p style={{ color: C.muted, fontFamily: "'Nunito', sans-serif", fontSize: 15, margin: 0 }}>
                Score: {Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)}%
              </p>
            </div>

            {earnedXP > 0 && (
              <div style={{
                padding: "10px 20px", borderRadius: 12,
                backgroundColor: C.surfaceHigh, border: `2px solid ${C.border}`,
                display: "flex", alignItems: "center", gap: 8,
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: 22, color: C.tertiary, fontVariationSettings: "'FILL' 1" }}>stars</span>
                <span style={{ color: C.tertiary, fontFamily: "'Nunito', sans-serif", fontWeight: 800, fontSize: 18 }}>
                  +{earnedXP} XP
                </span>
              </div>
            )}

            <div style={{ display: "flex", gap: 8 }}>
              {scores.map((s, i) => (
                <div key={i} style={{
                  width: 36, height: 36, borderRadius: "50%",
                  backgroundColor: s >= 70 ? C.success : C.surfaceHigh,
                  border: `2px solid ${s >= 70 ? "#4ade80" : C.border}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
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

      {/* ── Fixed bottom bar (exercise phase only) ── */}
      {phase === "exercise" && (
        <div style={{
          position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 50,
          backgroundColor: pendingResult
            ? isCorrect ? "rgba(0,108,78,0.2)" : "rgba(139,40,40,0.2)"
            : C.surface,
          borderTop: pendingResult
            ? `2px solid ${isCorrect ? C.success : C.error}`
            : `2px solid ${C.border}`,
          padding: "24px 80px",
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16,
          transition: "background-color 0.2s, border-color 0.2s",
        }}>
          {/* Left: feedback or empty */}
          {pendingResult ? (
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span
                className="material-symbols-outlined"
                style={{ fontSize: 28, color: isCorrect ? C.successDim : C.errorDim, fontVariationSettings: "'FILL' 1" }}
              >
                {isCorrect ? "check_circle" : "cancel"}
              </span>
              <div>
                <p style={{ color: isCorrect ? C.successDim : C.errorDim, fontFamily: "'Nunito', sans-serif", fontWeight: 800, fontSize: 16, margin: 0 }}>
                  {isCorrect ? "Correct!" : "Incorrect"}
                </p>
                {!isCorrect && pendingResult.correctAnswerText && (
                  <p style={{ color: C.muted, fontFamily: "'Nunito', sans-serif", fontSize: 13, margin: 0 }}>
                    Answer: {pendingResult.correctAnswerText}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div />
          )}

          {/* Right: CHECK or CONTINUE button */}
          {pendingResult ? (
            <button
              onClick={handleContinue}
              style={{
                padding: "16px 56px", borderRadius: 14,
                backgroundColor: isCorrect ? C.success : C.error,
                boxShadow: `0 4px 0 0 ${isCorrect ? "#00513a" : "#6b1c1c"}`,
                color: "white", border: "none",
                fontFamily: "'Nunito', sans-serif", fontSize: 16, fontWeight: 800,
                textTransform: "uppercase", letterSpacing: "0.06em",
                cursor: "pointer",
              }}
            >
              Continue
            </button>
          ) : (
            <button
              onClick={handleCheck}
              disabled={!hasAnswer}
              style={{
                padding: "16px 56px", borderRadius: 14,
                backgroundColor: hasAnswer ? C.primary : C.surfaceHigh,
                boxShadow: hasAnswer ? `0 4px 0 0 ${C.primaryDark}` : "none",
                color: hasAnswer ? "white" : C.muted,
                border: hasAnswer ? "none" : `2px solid ${C.border}`,
                fontFamily: "'Nunito', sans-serif", fontSize: 16, fontWeight: 800,
                textTransform: "uppercase", letterSpacing: "0.06em",
                cursor: hasAnswer ? "pointer" : "not-allowed",
                transition: "background-color 0.15s, box-shadow 0.15s",
              }}
            >
              Check
            </button>
          )}
        </div>
      )}
    </div>
  );
}
