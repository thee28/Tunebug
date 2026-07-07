"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type { Difficulty } from "@/lib/curriculum/content";
import type { ExerciseStep } from "@/types/lesson";
import { SECTION_TEST_HEARTS } from "@/lib/curriculum/sectionTest";
import { ExerciseEngine, type ExerciseResult } from "./ExerciseEngine";

const C = {
  primary: "#574eb1", primaryDark: "#41379b", primaryDim: "#c5c0ff",
  surface: "var(--c-dark)", surfaceHigh: "var(--c-surface-high)",
  border: "var(--c-border)", muted: "var(--c-muted)",
  success: "#006c4e", successDim: "#83f5c6",
  error: "#8b2828", errorDim: "#ffb4ab",
  text: "var(--c-text)", heart: "#ffb4ab",
};

interface Props {
  targetSectionNumber: number; // 1-based section the user is jumping to
  targetSectionTitle: string;
  steps: ExerciseStep[];
  difficulty: Difficulty;
  // Fired once when the final question is cleared with hearts remaining.
  onPassed: () => void | Promise<void>;
  onRetry: () => void;
  onExit: () => void;
}

type Phase = "intro" | "exercise" | "pass" | "fail";

export function SectionTestRunner({
  targetSectionNumber,
  targetSectionTitle,
  steps,
  difficulty,
  onPassed,
  onRetry,
  onExit,
}: Props) {
  const [phase, setPhase] = useState<Phase>("intro");
  const [index, setIndex] = useState(0);
  const [hearts, setHearts] = useState(SECTION_TEST_HEARTS);
  const [hasAnswer, setHasAnswer] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [pendingResult, setPendingResult] = useState<ExerciseResult | null>(null);

  const currentStep = steps[index];
  const isCorrect = pendingResult?.passed ?? false;
  const progressPct = (index / steps.length) * 100;

  const handleExerciseComplete = (result: ExerciseResult) => {
    setPendingResult(result);
    if (!result.passed) setHearts((h) => h - 1);

    // Same fire-and-forget mastery recording as normal lessons.
    if (currentStep?.conceptId) {
      fetch("/api/mastery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conceptId: currentStep.conceptId, isCorrect: result.passed }),
      }).catch(() => {});
    }
  };

  const finishTest = () => {
    setPhase("pass");
    Promise.resolve(onPassed()).catch(() => {});
  };

  const handleContinue = () => {
    if (!pendingResult) return;
    // `hearts` was already decremented when the wrong answer was submitted.
    if (!pendingResult.passed && hearts <= 0) {
      setPhase("fail");
      return;
    }
    if (index >= steps.length - 1) {
      finishTest();
      return;
    }
    setIndex((i) => i + 1);
    setSubmitted(false);
    setHasAnswer(false);
    setPendingResult(null);
  };

  const handleCheck = () => {
    if (!hasAnswer) return;
    setSubmitted(true);
  };

  const handleDebugAdvance = () => {
    if (index >= steps.length - 1) {
      finishTest();
      return;
    }
    setIndex((i) => i + 1);
    setSubmitted(false);
    setHasAnswer(false);
    setPendingResult(null);
  };

  // ── Intro splash ──
  if (phase === "intro") {
    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100vh", backgroundColor: C.surface }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 32, padding: 24, textAlign: "center" }}>
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            style={{
              width: 120, height: 120, borderRadius: "50%",
              backgroundColor: C.primary, boxShadow: `0 8px 0 0 ${C.primaryDark}`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 60, color: "white", fontVariationSettings: "'FILL' 1" }}>
              rocket_launch
            </span>
          </motion.div>
          <div>
            <h2 style={{ color: C.text, fontFamily: "'Nunito', sans-serif", fontSize: 24, fontWeight: 900, margin: "0 0 10px" }}>
              Pass this test to jump ahead to Section {targetSectionNumber}!
            </h2>
            <p style={{ color: C.muted, fontFamily: "'Nunito', sans-serif", fontSize: 15, lineHeight: 1.6, margin: "0 auto", maxWidth: 380 }}>
              {steps.length} questions covering everything you&apos;re skipping. You only get{" "}
              {SECTION_TEST_HEARTS} hearts, and the test ends when they run out.
            </p>
          </div>
        </div>

        <div style={{
          borderTop: `2px solid ${C.border}`, padding: "24px 80px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <button
            onClick={onExit}
            className="btn-ghost-hover"
            style={{
              background: "none", border: "none", cursor: "pointer",
              color: C.primaryDim, fontFamily: "'Nunito', sans-serif",
              fontSize: 14, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em",
              padding: "12px 16px", borderRadius: 12,
            }}
          >
            Maybe Later
          </button>
          <motion.button
            onClick={() => setPhase("exercise")}
            whileTap={{ scale: 0.97 }}
            style={{
              padding: "16px 56px", borderRadius: 14,
              backgroundColor: C.primary, boxShadow: `0 4px 0 0 ${C.primaryDark}`,
              color: "white", border: "none",
              fontFamily: "'Nunito', sans-serif", fontSize: 16, fontWeight: 800,
              textTransform: "uppercase", letterSpacing: "0.06em", cursor: "pointer",
            }}
          >
            Continue
          </motion.button>
        </div>
      </div>
    );
  }

  // ── Pass / fail screens ──
  if (phase === "pass" || phase === "fail") {
    const passed = phase === "pass";
    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100vh", backgroundColor: C.surface, alignItems: "center", justifyContent: "center", gap: 24, padding: 24, textAlign: "center" }}>
        <div style={{
          width: 110, height: 110, borderRadius: "50%",
          backgroundColor: passed ? C.success : C.surfaceHigh,
          boxShadow: passed ? `0 8px 0 0 #00513a` : `0 8px 0 0 rgba(0,0,0,0.4)`,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: 56, color: passed ? "white" : C.errorDim, fontVariationSettings: "'FILL' 1" }}>
            {passed ? "emoji_events" : "heart_broken"}
          </span>
        </div>

        <div>
          <h2 style={{ color: C.text, fontFamily: "'Nunito', sans-serif", fontSize: 26, fontWeight: 900, margin: "0 0 8px" }}>
            {passed ? "You passed!" : "Out of hearts"}
          </h2>
          <p style={{ color: C.muted, fontFamily: "'Nunito', sans-serif", fontSize: 15, margin: 0, maxWidth: 380 }}>
            {passed
              ? `Welcome to Section ${targetSectionNumber}: ${targetSectionTitle}.`
              : "Not quite ready to skip ahead yet. Keep practicing, or try the test again."}
          </p>
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          {!passed && (
            <motion.button
              onClick={onRetry}
              whileTap={{ scale: 0.97 }}
              style={{
                padding: "14px 40px", borderRadius: 14,
                backgroundColor: C.primary, boxShadow: `0 4px 0 0 ${C.primaryDark}`,
                color: "white", border: "none",
                fontFamily: "'Nunito', sans-serif", fontSize: 15, fontWeight: 800,
                textTransform: "uppercase", letterSpacing: "0.06em", cursor: "pointer",
              }}
            >
              Try Again
            </motion.button>
          )}
          <motion.button
            onClick={onExit}
            whileTap={{ scale: 0.97 }}
            className={passed ? undefined : "btn-ghost-hover"}
            style={{
              padding: "14px 40px", borderRadius: 14,
              backgroundColor: passed ? C.primary : "transparent",
              boxShadow: passed ? `0 4px 0 0 ${C.primaryDark}` : "none",
              border: passed ? "none" : `2px solid ${C.border}`,
              color: passed ? "white" : C.muted,
              fontFamily: "'Nunito', sans-serif", fontSize: 15, fontWeight: 800,
              textTransform: "uppercase", letterSpacing: "0.06em", cursor: "pointer",
            }}
          >
            {passed ? "Continue" : "Maybe Later"}
          </motion.button>
        </div>
      </div>
    );
  }

  // ── Exercise phase ──
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", backgroundColor: C.surface, overflow: "hidden" }}>
      {/* Top bar */}
      <div style={{ display: "flex", alignItems: "center", padding: "0 72px", height: 64, gap: 8, flexShrink: 0 }}>
        <button
          onClick={onExit}
          className="btn-ghost-hover"
          style={{
            width: 36, height: 36, borderRadius: "50%",
            background: "none", border: "none", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", marginTop: 8,
          }}
        >
          <span className="material-symbols-outlined" style={{ color: C.muted, fontSize: 26 }}>close</span>
        </button>

        <div style={{ flex: 1, height: 14, borderRadius: 7, backgroundColor: C.surfaceHigh, overflow: "hidden", marginTop: 8 }}>
          <div style={{
            height: "100%", borderRadius: 7, backgroundColor: C.primary,
            width: `${progressPct}%`, transition: "width 0.4s ease",
          }} />
        </div>

        {/* Hearts */}
        <div style={{ display: "flex", alignItems: "center", gap: 2, marginTop: 8 }}>
          {Array.from({ length: SECTION_TEST_HEARTS }, (_, i) => (
            <span
              key={i}
              className="material-symbols-outlined"
              style={{
                fontSize: 28,
                color: i < hearts ? C.heart : C.border,
                fontVariationSettings: "'FILL' 1",
                transition: "color 0.2s",
              }}
            >
              favorite
            </span>
          ))}
        </div>

        {process.env.NODE_ENV === "development" && (
          <button
            onClick={handleDebugAdvance}
            title="Debug: auto-correct"
            style={{
              marginTop: 8, marginLeft: 8,
              width: 32, height: 32, borderRadius: 8,
              background: "rgba(255,185,93,0.15)", border: "1.5px solid rgba(255,185,93,0.4)",
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18, color: "#ffb95d" }}>fast_forward</span>
          </button>
        )}
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px 20px 120px" }}>
        <div style={{ width: "100%", maxWidth: 480 }}>
          <ExerciseEngine
            key={index}
            type={currentStep.type}
            config={currentStep.config}
            difficulty={difficulty}
            submitted={submitted}
            onAnswerChange={setHasAnswer}
            onComplete={handleExerciseComplete}
          />
        </div>
      </div>

      {/* Bottom bar */}
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
          <span style={{ color: C.muted, fontFamily: "'Nunito', sans-serif", fontSize: 13, fontWeight: 700 }}>
            Question {index + 1} of {steps.length}
          </span>
        )}

        {pendingResult ? (
          <motion.button
            onClick={handleContinue}
            whileTap={{ scale: 0.97 }}
            style={{
              padding: "16px 56px", borderRadius: 14,
              backgroundColor: isCorrect ? C.success : C.error,
              boxShadow: `0 4px 0 0 ${isCorrect ? "#00513a" : "#6b1c1c"}`,
              color: "white", border: "none",
              fontFamily: "'Nunito', sans-serif", fontSize: 16, fontWeight: 800,
              textTransform: "uppercase", letterSpacing: "0.06em", cursor: "pointer",
            }}
          >
            Continue
          </motion.button>
        ) : (
          <motion.button
            onClick={handleCheck}
            disabled={!hasAnswer}
            whileTap={hasAnswer ? { scale: 0.97 } : {}}
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
          </motion.button>
        )}
      </div>
    </div>
  );
}
