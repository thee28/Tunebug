"use client";

import { useState, useEffect } from "react";
import type { ErrorSpottingConfig } from "@/types/music";
import type { Difficulty } from "@/lib/curriculum/content";
import type { ExerciseResult } from "./ExerciseEngine";
import { StaffRenderer } from "./StaffRenderer";

interface Props {
  config: ErrorSpottingConfig;
  difficulty: Difficulty;
  submitted: boolean;
  onAnswerChange: (hasAnswer: boolean) => void;
  onComplete: (result: ExerciseResult) => void;
}

const C = {
  primary: "#574eb1",
  surfaceHigh: "var(--c-surface-high)", border: "var(--c-border)", muted: "var(--c-muted)",
  text: "var(--c-text)", selected: "#3d3580",
  success: "#006c4e", error: "#8b2828",
};

type Phase = "judge" | "pick" | "done";

export function ErrorSpottingExercise({ config, submitted, onAnswerChange, onComplete }: Props) {
  const actualName = config.actualNote.replace(/\d$/, "");
  const isWrong = config.shownLabel !== actualName;

  const [phase, setPhase] = useState<Phase>("judge");
  const [judgedWrong, setJudgedWrong] = useState<boolean | null>(null);
  const [pickedLetter, setPickedLetter] = useState<string | null>(null);

  // hasAnswer logic: judging step ALWAYS gives an answer; pick step needs a letter
  const hasAnswer = phase === "judge" ? judgedWrong !== null : pickedLetter !== null;

  useEffect(() => {
    onAnswerChange(hasAnswer);
  }, [hasAnswer, onAnswerChange]);

  const judge = (claimWrong: boolean) => {
    if (submitted) return;
    setJudgedWrong(claimWrong);
    if (claimWrong) {
      setPhase("pick"); // need to pick the actual letter
    } else {
      setPhase("done"); // user says it's correct — finalize
    }
  };

  const pick = (letter: string) => {
    if (submitted) return;
    setPickedLetter(letter);
  };

  useEffect(() => {
    if (!submitted) return;
    // judging correctness
    const judgmentCorrect = judgedWrong === isWrong;
    // if wrong, also need to pick correct letter
    const letterCorrect = !judgedWrong || pickedLetter === actualName;
    const passed = judgmentCorrect && letterCorrect;
    const explain = isWrong ? `Wrong — actual is ${actualName}` : "Correct as labeled";
    onComplete({ score: passed ? 100 : 0, passed, correctAnswerText: explain });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submitted]);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 24 }}>
      <p style={{ color: C.text, fontFamily: "'Nunito', sans-serif", fontSize: 22, fontWeight: 800, margin: 0, textAlign: "center" }}>
        Is this label correct?
      </p>

      <div style={{
        padding: 12, borderRadius: 12,
        backgroundColor: C.surfaceHigh, border: `2px solid ${C.border}`,
        display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
      }}>
        <StaffRenderer vexKey={config.vexKey} />
        <span style={{ color: C.primary, fontSize: 22, fontWeight: 900, fontFamily: "'Nunito', sans-serif" }}>
          Labeled: {config.shownLabel}
        </span>
      </div>

      {phase === "judge" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, width: "100%", maxWidth: 360 }}>
          {[
            { val: false, label: "Correct", icon: "check_circle" },
            { val: true,  label: "Wrong",   icon: "cancel" },
          ].map((opt) => (
            <button
              key={opt.label}
              onClick={() => judge(opt.val)}
              style={{
                padding: "18px 0", borderRadius: 14,
                backgroundColor: judgedWrong === opt.val ? C.selected : C.surfaceHigh,
                border: `2px solid ${judgedWrong === opt.val ? C.primary : C.border}`,
                color: C.text,
                fontFamily: "'Nunito', sans-serif", fontSize: 18, fontWeight: 800,
                cursor: submitted ? "default" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 22 }}>{opt.icon}</span>
              {opt.label}
            </button>
          ))}
        </div>
      )}

      {phase === "pick" && (
        <>
          <p style={{ color: C.muted, fontFamily: "'Nunito', sans-serif", fontSize: 14, margin: 0 }}>
            What is it actually?
          </p>
          <div style={{
            display: "grid", gridTemplateColumns: `repeat(${Math.min(config.choices.length, 4)}, 1fr)`,
            gap: 10, width: "100%", maxWidth: 400,
          }}>
            {config.choices.map((choice) => {
              const isSelected = choice === pickedLetter;
              return (
                <button
                  key={choice}
                  onClick={() => pick(choice)}
                  style={{
                    padding: "14px 0", borderRadius: 14,
                    backgroundColor: isSelected ? C.selected : C.surfaceHigh,
                    border: `2px solid ${isSelected ? C.primary : C.border}`,
                    color: C.text,
                    fontFamily: "'Nunito', sans-serif", fontSize: 20, fontWeight: 800,
                    cursor: submitted ? "default" : "pointer",
                  }}
                >
                  {choice}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
