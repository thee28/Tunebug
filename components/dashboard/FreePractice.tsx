"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { ExerciseType, ExerciseConfig } from "@/types/music";
import type { Difficulty } from "@/lib/curriculum/content";
import { DIFFICULTY_SETTINGS } from "@/lib/curriculum/content";
import { ExerciseEngine, type ExerciseResult } from "@/components/exercises/ExerciseEngine";

const C = {
  primary: "#574eb1", primaryDark: "#41379b",
  secondary: "#006c4e", secondaryDark: "#00513a",
  surface: "#141321", surfaceHigh: "#211F26",
  border: "#33313D", muted: "#938F99", text: "#f3eff5",
  selected: "#3d3580",
};

interface PracticeLevel {
  id: string;
  label: string;
  difficulty: Difficulty;
  notePool: string[];
}

const PRACTICE_LEVELS: PracticeLevel[] = [
  {
    id: "beginner", label: "Beginner", difficulty: "beginner",
    notePool: ["C4", "D4", "E4"],
  },
  {
    id: "elementary", label: "Elementary", difficulty: "beginner",
    notePool: ["C4", "D4", "E4", "F4", "G4", "A4", "B4", "C#4", "F#4", "A#4", "C5"],
  },
  {
    id: "intermediate", label: "Intermediate", difficulty: "intermediate",
    notePool: ["C4", "D4", "E4", "F4", "G4", "A4", "B4", "C#4", "D#4", "F#4", "G#4", "A#4", "C5", "D5", "E5"],
  },
  {
    id: "upper-intermediate", label: "Upper Intermediate", difficulty: "intermediate",
    notePool: ["C4", "D4", "E4", "F4", "G4", "A4", "B4", "C#4", "D#4", "F#4", "G#4", "A#4", "C5", "D5", "E5", "F5", "G5", "A5"],
  },
  {
    id: "advanced", label: "Advanced", difficulty: "advanced",
    notePool: ["C3", "D3", "E3", "F3", "G3", "A3", "B3", "C4", "D4", "E4", "F4", "G4", "A4", "B4", "C#4", "D#4", "F#4", "G#4", "A#4", "C5", "D5", "E5", "F5", "G5", "A5"],
  },
];

const EXERCISE_TYPES: { value: ExerciseType; label: string; icon: string }[] = [
  { value: "EAR_SINGLE", label: "Ear Training", icon: "hearing" },
  { value: "EAR_MULTI", label: "Chord ID", icon: "queue_music" },
  { value: "INTERVAL_ID", label: "Interval ID", icon: "piano" },
  { value: "PITCH_MATCH", label: "Pitch Match", icon: "mic" },
  { value: "SIGHT_READ_PIANO", label: "Sight Read", icon: "music_note" },
];

function buildFreeExercise(type: ExerciseType, note: string, difficulty: Difficulty): ExerciseConfig {
  const s = DIFFICULTY_SETTINGS[difficulty];
  const noteName = note.replace(/\d$/, "");

  switch (type) {
    case "PITCH_MATCH":
      return { targetNote: note, displayNote: noteName, confidenceThreshold: s.confidenceThreshold, timeoutSeconds: s.timeoutSeconds };
    case "EAR_SINGLE":
      return { targetNote: note, choices: ["C", "D", "E", "F", "G", "A", "B"].sort(() => Math.random() - 0.5).slice(0, 4).concat(noteName.includes(noteName) ? [] : [noteName]).slice(0, 4), correctAnswer: noteName };
    case "EAR_MULTI":
      return { targetNotes: [note], choices: ["C", "D", "E", "F", "G", "A", "B"], correctAnswers: [noteName] };
    case "INTERVAL_ID":
      return { noteA: note, noteB: note, choices: ["Perfect 5th", "Major 3rd", "Octave", "Perfect 4th"], correctAnswer: "Perfect 5th" };
    case "SIGHT_READ_PIANO":
      return { targetNote: note, vexKey: `${noteName.toLowerCase()}/${note.slice(-1)}`, octaveRange: [3, 5] };
  }
}

export default function FreePractice() {
  const [practiceLevel, setPracticeLevel] = useState<PracticeLevel>(PRACTICE_LEVELS[0]);
  const [exerciseType, setExerciseType] = useState<ExerciseType>("EAR_SINGLE");
  const [selectedNote, setSelectedNote] = useState<string>("C4");
  const [mode, setMode] = useState<"config" | "exercise">("config");
  const [lastResult, setLastResult] = useState<ExerciseResult | null>(null);

  const [submitted, setSubmitted] = useState(false);
  const [hasAnswer, setHasAnswer] = useState(false);
  const [pendingResult, setPendingResult] = useState<ExerciseResult | null>(null);

  const { difficulty, notePool } = practiceLevel;

  const handleStart = () => {
    setLastResult(null);
    setSubmitted(false);
    setHasAnswer(false);
    setPendingResult(null);
    setMode("exercise");
  };

  const handleExerciseComplete = (result: ExerciseResult) => {
    setPendingResult(result);
  };

  const handleCheck = () => {
    if (!hasAnswer) return;
    setSubmitted(true);
  };

  const handleContinue = () => {
    if (!pendingResult) return;
    setLastResult(pendingResult);
    setMode("config");
  };

  const isCorrect = pendingResult?.passed ?? false;

  return (
    <>
      {/* Config UI — inline in dashboard main content */}
      <div style={{ paddingTop: 28 }}>
        <h1 style={{ color: C.text, fontFamily: "'Nunito', sans-serif", fontSize: 24, fontWeight: 900, margin: "0 0 4px" }}>
          Free Practice
        </h1>
        <p style={{ color: C.muted, fontFamily: "'Nunito', sans-serif", fontSize: 14, margin: "0 0 32px" }}>
          Pick what you want to practice.
        </p>

        {lastResult && (
          <div style={{
            padding: "12px 16px", borderRadius: 12,
            backgroundColor: lastResult.passed ? "#0d3d2a" : "#3d1212",
            border: `1px solid ${lastResult.passed ? C.secondary : "#8b2828"}`,
            marginBottom: 24,
          }}>
            <p style={{ color: lastResult.passed ? "#4ade80" : "#f87171", fontFamily: "'Nunito', sans-serif", fontWeight: 700, fontSize: 14, margin: 0 }}>
              {lastResult.passed ? `Correct! Score: ${lastResult.score}%` : `Score: ${lastResult.score}% — try again`}
            </p>
          </div>
        )}

        <section style={{ marginBottom: 28 }}>
          <p style={{ color: C.muted, fontFamily: "'Nunito', sans-serif", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 10px" }}>Level</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {PRACTICE_LEVELS.map((lvl) => (
              <button
                key={lvl.id}
                onClick={() => { setPracticeLevel(lvl); setSelectedNote(lvl.notePool[0]); }}
                style={{
                  padding: "8px 14px", borderRadius: 12,
                  backgroundColor: practiceLevel.id === lvl.id ? C.primary : C.surfaceHigh,
                  border: `2px solid ${practiceLevel.id === lvl.id ? C.primary : C.border}`,
                  color: C.text, fontFamily: "'Nunito', sans-serif", fontSize: 13, fontWeight: 700, cursor: "pointer",
                  whiteSpace: "nowrap" as const,
                }}
              >
                {lvl.label}
              </button>
            ))}
          </div>
        </section>

        <section style={{ marginBottom: 28 }}>
          <p style={{ color: C.muted, fontFamily: "'Nunito', sans-serif", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 10px" }}>Exercise Type</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {EXERCISE_TYPES.map((et) => (
              <button
                key={et.value}
                onClick={() => setExerciseType(et.value)}
                style={{
                  padding: "12px 16px", borderRadius: 12,
                  backgroundColor: exerciseType === et.value ? C.selected : C.surfaceHigh,
                  border: `2px solid ${exerciseType === et.value ? C.primary : C.border}`,
                  color: C.text, fontFamily: "'Nunito', sans-serif", fontSize: 14, fontWeight: 600,
                  cursor: "pointer", display: "flex", alignItems: "center", gap: 12, textAlign: "left" as const,
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 20, color: exerciseType === et.value ? "white" : C.muted }}>{et.icon}</span>
                {et.label}
              </button>
            ))}
          </div>
        </section>

        <section style={{ marginBottom: 36 }}>
          <p style={{ color: C.muted, fontFamily: "'Nunito', sans-serif", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 10px" }}>Target Note</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {notePool.map((note) => (
              <button
                key={note}
                onClick={() => setSelectedNote(note)}
                style={{
                  padding: "8px 14px", borderRadius: 10,
                  backgroundColor: selectedNote === note ? C.primary : C.surfaceHigh,
                  border: `2px solid ${selectedNote === note ? C.primary : C.border}`,
                  color: C.text, fontFamily: "'Nunito', sans-serif", fontSize: 13, fontWeight: 700, cursor: "pointer",
                }}
              >
                {note}
              </button>
            ))}
          </div>
        </section>

        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleStart}
          style={{
            width: "100%", padding: "16px 0", borderRadius: 14,
            backgroundColor: C.primary, boxShadow: `0 5px 0 0 ${C.primaryDark}`,
            color: "white", border: "none",
            fontFamily: "'Nunito', sans-serif", fontSize: 17, fontWeight: 800, cursor: "pointer",
          }}
        >
          Practice
        </motion.button>
      </div>

      {/* Exercise overlay — fixed on top of everything */}
      <AnimatePresence>
        {mode === "exercise" && (
          <motion.div
            key="practice-exercise"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ position: "fixed", inset: 0, zIndex: 200, backgroundColor: C.surface, display: "flex", flexDirection: "column", overflowY: "auto" }}
          >
            {/* Header */}
            <div style={{ padding: "16px 20px", borderBottom: `2px solid ${C.border}`, display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
              <button onClick={() => setMode("config")} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center" }}>
                <span className="material-symbols-outlined" style={{ color: C.muted, fontSize: 24 }}>close</span>
              </button>
              <span style={{ color: C.muted, fontFamily: "'Nunito', sans-serif", fontSize: 14, fontWeight: 700 }}>Free Practice</span>
            </div>

            {/* Exercise */}
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "32px 20px 120px" }}>
              <div style={{ width: "100%", maxWidth: 480 }}>
                <ExerciseEngine
                  type={exerciseType}
                  config={buildFreeExercise(exerciseType, selectedNote, difficulty)}
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
                ? `2px solid ${isCorrect ? C.secondary : "#8b2828"}`
                : `2px solid ${C.border}`,
              padding: "16px 24px",
              display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16,
              transition: "background-color 0.2s, border-color 0.2s",
            }}>
              {pendingResult ? (
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 28, color: isCorrect ? "#83f5c6" : "#ffb4ab", fontVariationSettings: "'FILL' 1" }}>
                    {isCorrect ? "check_circle" : "cancel"}
                  </span>
                  <div>
                    <p style={{ color: isCorrect ? "#83f5c6" : "#ffb4ab", fontFamily: "'Nunito', sans-serif", fontWeight: 800, fontSize: 16, margin: 0 }}>
                      {isCorrect ? "Correct!" : "Incorrect"}
                    </p>
                    {!isCorrect && pendingResult.correctAnswerText && (
                      <p style={{ color: C.muted, fontFamily: "'Nunito', sans-serif", fontSize: 13, margin: 0 }}>
                        Answer: {pendingResult.correctAnswerText}
                      </p>
                    )}
                  </div>
                </div>
              ) : <div />}

              {pendingResult ? (
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleContinue}
                  style={{
                    padding: "14px 40px", borderRadius: 14,
                    backgroundColor: isCorrect ? C.secondary : "#8b2828",
                    boxShadow: `0 4px 0 0 ${isCorrect ? C.secondaryDark : "#6b1c1c"}`,
                    color: "white", border: "none",
                    fontFamily: "'Nunito', sans-serif", fontSize: 15, fontWeight: 800,
                    textTransform: "uppercase" as const, letterSpacing: "0.06em", cursor: "pointer",
                  }}
                >
                  Continue
                </motion.button>
              ) : (
                <motion.button
                  whileTap={hasAnswer ? { scale: 0.97 } : {}}
                  onClick={handleCheck}
                  disabled={!hasAnswer}
                  style={{
                    padding: "14px 40px", borderRadius: 14,
                    backgroundColor: hasAnswer ? C.primary : C.surfaceHigh,
                    boxShadow: hasAnswer ? `0 4px 0 0 ${C.primaryDark}` : "none",
                    color: hasAnswer ? "white" : C.muted,
                    border: hasAnswer ? "none" : `2px solid ${C.border}`,
                    fontFamily: "'Nunito', sans-serif", fontSize: 15, fontWeight: 800,
                    textTransform: "uppercase" as const, letterSpacing: "0.06em",
                    cursor: hasAnswer ? "pointer" : "not-allowed",
                    transition: "background-color 0.15s, box-shadow 0.15s",
                  }}
                >
                  Check
                </motion.button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
