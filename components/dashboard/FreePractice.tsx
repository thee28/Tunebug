"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { ExerciseType, ExerciseConfig } from "@/types/music";
import type { Difficulty } from "@/lib/curriculum/content";
import type { ConceptCategory } from "@/lib/curriculum/concepts";
import { generateFreePracticeSession } from "@/lib/curriculum/freePractice";
import { ExerciseEngine, type ExerciseResult } from "@/components/exercises/ExerciseEngine";

const C = {
  primary: "#574eb1", primaryDark: "#41379b",
  secondary: "#006c4e", secondaryDark: "#00513a",
  surface: "var(--c-dark)", surfaceHigh: "var(--c-surface-high)",
  border: "var(--c-border)", muted: "var(--c-muted)", text: "var(--c-text)",
  selected: "#3d3580",
};

interface PracticeLevel {
  id: string;
  label: string;
  difficulty: Difficulty;
  notePool: string[];
}

const PRACTICE_LEVELS: PracticeLevel[] = [
  { id: "beginner", label: "Beginner", difficulty: "beginner", notePool: ["C4", "D4", "E4"] },
  { id: "elementary", label: "Elementary", difficulty: "beginner", notePool: ["C4", "D4", "E4", "F4", "G4", "A4", "B4", "C#4", "F#4", "A#4", "C5"] },
  { id: "intermediate", label: "Intermediate", difficulty: "intermediate", notePool: ["C4", "D4", "E4", "F4", "G4", "A4", "B4", "C#4", "D#4", "F#4", "G#4", "A#4", "C5", "D5", "E5"] },
  { id: "upper-intermediate", label: "Upper Intermediate", difficulty: "intermediate", notePool: ["C4", "D4", "E4", "F4", "G4", "A4", "B4", "C#4", "D#4", "F#4", "G#4", "A#4", "C5", "D5", "E5", "F5", "G5", "A5"] },
  { id: "advanced", label: "Advanced", difficulty: "advanced", notePool: ["C3", "D3", "E3", "F3", "G3", "A3", "B3", "C4", "D4", "E4", "F4", "G4", "A4", "B4", "C#4", "D#4", "F#4", "G#4", "A#4", "C5", "D5", "E5", "F5", "G5", "A5"] },
];

// Each button is a domain filter: the session generator draws from the
// domain's whole pool of exercise components (see CONCEPT_TYPE_POOL).
const PRACTICE_DOMAINS: { value: ConceptCategory; label: string; icon: string }[] = [
  { value: "ear-note", label: "Ear Training", icon: "hearing" },
  { value: "ear-chord", label: "Chord ID", icon: "queue_music" },
  { value: "ear-interval", label: "Interval ID", icon: "piano" },
  { value: "sing-note", label: "Pitch Match", icon: "mic" },
  { value: "staff-note", label: "Sight Read", icon: "music_note" },
  { value: "rhythm-symbol", label: "Rhythm", icon: "graphic_eq" },
];

const SESSION_LENGTHS = [
  { value: 5 as const, label: "Short", sub: "5 questions" },
  { value: 10 as const, label: "Medium", sub: "10 questions" },
  { value: 20 as const, label: "Long", sub: "20 questions" },
];

// ── Component ───────────────────────────────────────────────────────────────

type SessionEx = { type: ExerciseType; config: ExerciseConfig };

export default function FreePractice() {
  // Config
  const [practiceLevel, setPracticeLevel] = useState<PracticeLevel>(PRACTICE_LEVELS[0]);
  const [selectedDomains, setSelectedDomains] = useState<Set<ConceptCategory>>(new Set(["ear-note"]));
  const [sessionLength, setSessionLength] = useState<5 | 10 | 20>(10);

  // Session
  const [mode, setMode] = useState<"config" | "session" | "done">("config");
  const [exercises, setExercises] = useState<SessionEx[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [hasAnswer, setHasAnswer] = useState(false);
  const [pendingResult, setPendingResult] = useState<ExerciseResult | null>(null);
  const [results, setResults] = useState<ExerciseResult[]>([]);

  const toggleDomain = (domain: ConceptCategory) => {
    setSelectedDomains(prev => {
      const next = new Set(prev);
      if (next.has(domain) && next.size === 1) return prev;
      if (next.has(domain)) next.delete(domain);
      else next.add(domain);
      return next;
    });
  };

  const startSession = (exs?: SessionEx[]) => {
    const session = exs ?? generateFreePracticeSession({
      domains: [...selectedDomains],
      difficulty: practiceLevel.difficulty,
      notePool: practiceLevel.notePool,
      slotCount: sessionLength,
      seed: Date.now(),
    });
    setExercises(session);
    setCurrentIndex(0);
    setSubmitted(false);
    setHasAnswer(false);
    setPendingResult(null);
    setResults([]);
    setMode("session");
  };

  const handleCheck = () => { if (hasAnswer) setSubmitted(true); };
  // Skip resolves the exercise as a fail (exercises watch `submitted`).
  const handleSkip = () => setSubmitted(true);

  const handleContinue = () => {
    if (!pendingResult) return;
    const newResults = [...results, pendingResult];
    setResults(newResults);
    if (currentIndex + 1 >= exercises.length) {
      setMode("done");
    } else {
      setCurrentIndex(i => i + 1);
      setSubmitted(false);
      setHasAnswer(false);
      setPendingResult(null);
    }
  };

  const isCorrect = pendingResult?.passed ?? false;
  const current = exercises[currentIndex];

  // ── Config ────────────────────────────────────────────────────────────────
  const configUI = (
    <div style={{ paddingTop: 28 }}>
      <h1 style={{ color: C.text, fontFamily: "'Nunito', sans-serif", fontSize: 24, fontWeight: 900, margin: "0 0 28px" }}>
        Free Practice
      </h1>

      {/* Difficulty */}
      <section style={{ marginBottom: 28 }}>
        <p style={{ color: C.muted, fontFamily: "'Nunito', sans-serif", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 10px" }}>Level</p>
        <div style={{ position: "relative" }}>
          <select
            value={practiceLevel.id}
            onChange={e => setPracticeLevel(PRACTICE_LEVELS.find(l => l.id === e.target.value)!)}
            style={{
              width: "100%", padding: "12px 40px 12px 16px", borderRadius: 12,
              backgroundColor: C.surfaceHigh, border: `2px solid ${C.border}`,
              color: C.text, fontFamily: "'Nunito', sans-serif", fontSize: 14, fontWeight: 600,
              cursor: "pointer", appearance: "none", outline: "none",
            }}
          >
            {PRACTICE_LEVELS.map(lvl => (
              <option key={lvl.id} value={lvl.id} style={{ backgroundColor: C.surfaceHigh }}>{lvl.label}</option>
            ))}
          </select>
          <span
            className="material-symbols-outlined"
            style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", fontSize: 20, color: C.muted, pointerEvents: "none" }}
          >
            expand_more
          </span>
        </div>
      </section>

      {/* Exercise type multi-select */}
      <section style={{ marginBottom: 28 }}>
        <p style={{ color: C.muted, fontFamily: "'Nunito', sans-serif", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 10px" }}>Exercise Type</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {PRACTICE_DOMAINS.map(et => {
            const active = selectedDomains.has(et.value);
            return (
              <button
                key={et.value}
                onClick={() => toggleDomain(et.value)}
                style={{
                  padding: "12px 16px", borderRadius: 12,
                  backgroundColor: active ? C.selected : C.surfaceHigh,
                  border: `2px solid ${active ? C.primary : C.border}`,
                  color: C.text, fontFamily: "'Nunito', sans-serif", fontSize: 14, fontWeight: 600,
                  cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 20, color: active ? "white" : C.muted }}>{et.icon}</span>
                  {et.label}
                </div>
                {active && (
                  <span className="material-symbols-outlined" style={{ fontSize: 18, color: C.primary, fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                )}
              </button>
            );
          })}
        </div>
      </section>

      {/* Session length */}
      <section style={{ marginBottom: 36 }}>
        <p style={{ color: C.muted, fontFamily: "'Nunito', sans-serif", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 10px" }}>Session Length</p>
        <div style={{ display: "flex", gap: 10 }}>
          {SESSION_LENGTHS.map(sl => (
            <button
              key={sl.value}
              onClick={() => setSessionLength(sl.value)}
              style={{
                flex: 1, padding: "12px 8px", borderRadius: 12,
                backgroundColor: sessionLength === sl.value ? C.selected : C.surfaceHigh,
                border: `2px solid ${sessionLength === sl.value ? C.primary : C.border}`,
                color: C.text, fontFamily: "'Nunito', sans-serif", cursor: "pointer",
                display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
              }}
            >
              <span style={{ fontSize: 14, fontWeight: 800 }}>{sl.label}</span>
              <span style={{ fontSize: 12, color: C.muted, fontWeight: 600 }}>{sl.sub}</span>
            </button>
          ))}
        </div>
      </section>

      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={() => startSession()}
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
  );

  return (
    <>
      {configUI}

      {/* Session overlay */}
      <AnimatePresence>
        {(mode === "session" || mode === "done") && (
          <motion.div
            key="session-overlay"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ position: "fixed", inset: 0, zIndex: 200, backgroundColor: C.surface, display: "flex", flexDirection: "column", overflowY: "auto" }}
          >
            {mode === "done" ? (
              // Done screen
              <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 24px", gap: 24 }}>
                {(() => {
                  const correct = results.filter(r => r.passed).length;
                  const score = Math.round((correct / results.length) * 100);
                  const great = score >= 80;
                  return (
                    <>
                      <div style={{
                        width: 100, height: 100, borderRadius: "50%",
                        backgroundColor: great ? C.secondary : C.primary,
                        boxShadow: `0 8px 0 0 ${great ? C.secondaryDark : C.primaryDark}`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 52, color: "white", fontVariationSettings: "'FILL' 1" }}>
                          {great ? "star" : "sentiment_neutral"}
                        </span>
                      </div>

                      <div style={{ textAlign: "center" }}>
                        <h2 style={{ color: C.text, fontFamily: "'Nunito', sans-serif", fontSize: 26, fontWeight: 900, margin: "0 0 6px" }}>
                          {great ? "Great Session!" : "Session Complete"}
                        </h2>
                        <p style={{ color: C.muted, fontFamily: "'Nunito', sans-serif", fontSize: 15, margin: 0 }}>
                          {correct} / {results.length} correct &middot; {score}%
                        </p>
                      </div>

                      <div style={{ display: "flex", gap: 12, width: "100%", maxWidth: 360 }}>
                        <motion.button
                          whileTap={{ scale: 0.97 }}
                          onClick={() => startSession()}
                          style={{
                            flex: 1, padding: "14px 0", borderRadius: 14,
                            backgroundColor: C.surfaceHigh, border: `2px solid ${C.border}`,
                            color: C.text, fontFamily: "'Nunito', sans-serif", fontSize: 15, fontWeight: 800, cursor: "pointer",
                          }}
                        >
                          Try Again
                        </motion.button>
                        <motion.button
                          whileTap={{ scale: 0.97 }}
                          onClick={() => setMode("config")}
                          style={{
                            flex: 1, padding: "14px 0", borderRadius: 14,
                            backgroundColor: C.primary, boxShadow: `0 4px 0 0 ${C.primaryDark}`,
                            color: "white", border: "none",
                            fontFamily: "'Nunito', sans-serif", fontSize: 15, fontWeight: 800, cursor: "pointer",
                          }}
                        >
                          New Session
                        </motion.button>
                      </div>
                    </>
                  );
                })()}
              </div>
            ) : (
              // Session screen
              <>
                {/* Header with progress */}
                <div style={{ padding: "14px 20px 12px", borderBottom: `2px solid ${C.border}`, flexShrink: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                    <button onClick={() => setMode("config")} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", flexShrink: 0 }}>
                      <span className="material-symbols-outlined" style={{ color: C.muted, fontSize: 24 }}>close</span>
                    </button>
                    <div style={{ flex: 1, height: 8, borderRadius: 4, backgroundColor: C.border, overflow: "hidden" }}>
                      <div style={{ height: "100%", borderRadius: 4, backgroundColor: C.primary, width: `${((currentIndex) / exercises.length) * 100}%`, transition: "width 0.3s" }} />
                    </div>
                    <span style={{ color: C.muted, fontFamily: "'Nunito', sans-serif", fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
                      {currentIndex + 1} / {exercises.length}
                    </span>
                  </div>
                </div>

                {/* Exercise */}
                {current && (
                  <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "32px 20px 120px" }}>
                    <div style={{ width: "100%", maxWidth: 480 }}>
                      <ExerciseEngine
                        key={currentIndex}
                        type={current.type}
                        config={current.config}
                        difficulty={practiceLevel.difficulty}
                        submitted={submitted}
                        onAnswerChange={setHasAnswer}
                        onComplete={setPendingResult}
                      />
                    </div>
                  </div>
                )}

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
                  ) : (
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={handleSkip}
                      style={{
                        padding: "14px 32px", borderRadius: 14,
                        backgroundColor: "transparent",
                        border: `2px solid ${C.border}`,
                        color: C.muted,
                        fontFamily: "'Nunito', sans-serif", fontSize: 15, fontWeight: 800,
                        textTransform: "uppercase" as const, letterSpacing: "0.06em",
                        cursor: "pointer",
                      }}
                    >
                      Skip
                    </motion.button>
                  )}

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
                      {currentIndex + 1 >= exercises.length ? "Finish" : "Continue"}
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
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
