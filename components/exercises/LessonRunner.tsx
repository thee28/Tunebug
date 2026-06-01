"use client";

import { useState, useRef, useCallback } from "react";
import type { Difficulty } from "@/lib/curriculum/content";
import type { LessonStep } from "@/types/lesson";
import { ExerciseEngine, type ExerciseResult } from "./ExerciseEngine";

interface Props {
  title: string;
  steps: LessonStep[];
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

export function LessonRunner({ title, steps, difficulty, xpReward, onComplete, onExit }: Props) {
  const [index, setIndex] = useState(0);
  const [scores, setScores] = useState<number[]>([]);
  const [phase, setPhase] = useState<"exercise" | "result">("exercise");
  const [earnedXP, setEarnedXP] = useState(0);

  // Per-exercise submit flow
  const [submitted, setSubmitted] = useState(false);
  const [hasAnswer, setHasAnswer] = useState(false);
  const [pendingResult, setPendingResult] = useState<ExerciseResult | null>(null);

  // Teach-slide audio
  const [teachPlaying, setTeachPlaying] = useState(false);
  const teachSynthRef = useRef<unknown>(null);

  const playTeachAudio = useCallback(async (
    note?: string,
    notes?: string[],
    interval?: [string, string]
  ) => {
    if (teachPlaying) return;
    setTeachPlaying(true);
    try {
      const Tone = await import("tone");
      await Tone.start();
      if (!teachSynthRef.current) {
        teachSynthRef.current = new Tone.Synth({ oscillator: { type: "triangle" } }).toDestination();
      }
      const synth = teachSynthRef.current as InstanceType<typeof Tone.Synth>;
      if (interval) {
        synth.triggerAttackRelease(interval[0], "0.6");
        setTimeout(() => synth.triggerAttackRelease(interval[1], "0.6"), 800);
        setTimeout(() => setTeachPlaying(false), 1600);
      } else if (notes && notes.length > 1) {
        const poly = new Tone.PolySynth(Tone.Synth, { oscillator: { type: "triangle" } }).toDestination();
        poly.triggerAttackRelease(notes, "1.2");
        setTimeout(() => setTeachPlaying(false), 1400);
      } else if (note) {
        synth.triggerAttackRelease(note, "0.8");
        setTimeout(() => setTeachPlaying(false), 900);
      } else {
        setTeachPlaying(false);
      }
    } catch {
      setTeachPlaying(false);
    }
  }, [teachPlaying]);

  const handleExerciseComplete = (result: ExerciseResult) => {
    setPendingResult(result);
  };

  const advanceStep = (newScores: number[]) => {
    if (index < steps.length - 1) {
      setIndex((i) => i + 1);
      setSubmitted(false);
      setHasAnswer(false);
      setPendingResult(null);
    } else {
      const total = newScores.length > 0
        ? Math.round(newScores.reduce((a, b) => a + b, 0) / newScores.length)
        : 100;
      const xp = total >= 70 ? xpReward : Math.round(xpReward * 0.3);
      setEarnedXP(xp);
      setPhase("result");
      onComplete(total);
      setSubmitted(false);
      setHasAnswer(false);
      setPendingResult(null);
    }
  };

  const handleContinue = () => {
    const step = steps[index];
    if (step.kind === "teach") {
      advanceStep(scores);
      return;
    }
    if (!pendingResult) return;
    const newScores = [...scores, pendingResult.score];
    setScores(newScores);
    advanceStep(newScores);
  };

  const handleCheck = () => {
    if (!hasAnswer) return;
    setSubmitted(true);
  };

  const handleSkip = () => {
    setSubmitted(true);
  };

  const progressPct = ((phase === "result" ? steps.length : index) / steps.length) * 100;
  const currentStep = steps[index];
  const isTeachStep = phase === "exercise" && currentStep?.kind === "teach";
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
        {phase === "exercise" && isTeachStep ? (
          /* Teach slide */
          (() => {
            const step = currentStep as Extract<typeof currentStep, { kind: "teach" }>;
            const hasAudio = step.playNote || step.playNotes || step.playInterval;
            return (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 28, textAlign: "center", maxWidth: 420 }}>
                <div style={{
                  width: 80, height: 80, borderRadius: "50%",
                  backgroundColor: C.primary,
                  boxShadow: `0 6px 0 0 ${C.primaryDark}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 40, color: "white", fontVariationSettings: "'FILL' 1" }}>
                    {step.icon}
                  </span>
                </div>
                <div>
                  <h2 style={{ color: C.text, fontFamily: "'Nunito', sans-serif", fontSize: 24, fontWeight: 900, margin: "0 0 12px" }}>
                    {step.title}
                  </h2>
                  <p style={{ color: C.muted, fontFamily: "'Nunito', sans-serif", fontSize: 15, lineHeight: 1.6, margin: 0 }}>
                    {step.body}
                  </p>
                </div>
                {hasAudio && (
                  <button
                    onClick={() => playTeachAudio(step.playNote, step.playNotes, step.playInterval)}
                    style={{
                      width: 80, height: 80, borderRadius: "50%",
                      backgroundColor: teachPlaying ? C.primaryDark : C.primary,
                      boxShadow: `0 5px 0 0 ${C.primaryDark}`,
                      border: "none", cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      transform: teachPlaying ? "translateY(3px)" : "none",
                      transition: "transform 0.1s",
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 40, color: "white" }}>
                      {teachPlaying ? "graphic_eq" : "volume_up"}
                    </span>
                  </button>
                )}
              </div>
            );
          })()
        ) : phase === "exercise" ? (
          <div style={{ width: "100%", maxWidth: 480 }}>
            <ExerciseEngine
              key={index}
              type={(currentStep as Extract<typeof currentStep, { kind: "exercise" }>).type}
              config={(currentStep as Extract<typeof currentStep, { kind: "exercise" }>).config}
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
          backgroundColor: !isTeachStep && pendingResult
            ? isCorrect ? "rgba(0,108,78,0.2)" : "rgba(139,40,40,0.2)"
            : C.surface,
          borderTop: !isTeachStep && pendingResult
            ? `2px solid ${isCorrect ? C.success : C.error}`
            : `2px solid ${C.border}`,
          padding: "24px 80px",
          display: "flex", alignItems: "center", justifyContent: isTeachStep ? "flex-end" : "space-between", gap: 16,
          transition: "background-color 0.2s, border-color 0.2s",
        }}>
          {/* Teach step: just a Continue button */}
          {isTeachStep ? (
            <button
              onClick={handleContinue}
              style={{
                padding: "16px 56px", borderRadius: 14,
                backgroundColor: C.primary,
                boxShadow: `0 4px 0 0 ${C.primaryDark}`,
                color: "white", border: "none",
                fontFamily: "'Nunito', sans-serif", fontSize: 16, fontWeight: 800,
                textTransform: "uppercase", letterSpacing: "0.06em",
                cursor: "pointer",
              }}
            >
              Continue
            </button>
          ) : (
            <>
              {/* Left: feedback or Skip */}
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
                <button
                  onClick={handleSkip}
                  style={{
                    padding: "16px 40px", borderRadius: 14,
                    backgroundColor: "transparent",
                    border: `2px solid ${C.border}`,
                    color: C.muted,
                    fontFamily: "'Nunito', sans-serif", fontSize: 16, fontWeight: 800,
                    textTransform: "uppercase", letterSpacing: "0.06em",
                    cursor: "pointer",
                  }}
                >
                  Skip
                </button>
              )}

              {/* Right: CHECK or CONTINUE */}
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
            </>
          )}
        </div>
      )}
    </div>
  );
}
