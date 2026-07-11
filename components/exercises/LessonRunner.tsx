"use client";

import { useState, useCallback, useEffect } from "react";
import { getPiano } from "@/lib/audio/piano";
import { motion } from "framer-motion";
import type { Difficulty } from "@/lib/curriculum/content";
import type { LessonStep } from "@/types/lesson";
import { ExerciseEngine, type ExerciseResult } from "./ExerciseEngine";
import type { HeartsState } from "@/lib/hearts";
import { NoteSymbolSVG } from "./NoteSymbolSVG";
import { StaffRenderer } from "./StaffRenderer";

function isSoundEnabled() {
  if (typeof window === "undefined") return true;
  const stored = localStorage.getItem("pref_soundEffects");
  return stored === null ? true : stored !== "false";
}

function isMotivationalEnabled() {
  if (typeof window === "undefined") return true;
  const stored = localStorage.getItem("pref_motivational");
  return stored === null ? true : stored !== "false";
}

const MOTIVATION_PASS = [
  "Your ears are getting sharper every day!",
  "That's how it's done. Keep the streak alive!",
  "Beautiful work. The music is starting to stick!",
  "You're building real musician instincts!",
];

const MOTIVATION_FAIL = [
  "Every great musician missed plenty of notes. Try it again!",
  "Tough one, but repetition is how ears get trained.",
  "Almost there. One more run and it'll click!",
];

function playCorrectSound() {
  if (!isSoundEnabled()) return;
  try {
    const ctx = new AudioContext();
    [[0, 523.25], [0.1, 783.99]].forEach(([t, freq]) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, ctx.currentTime + t);
      gain.gain.setValueAtTime(0.28, ctx.currentTime + t);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.28);
      osc.start(ctx.currentTime + t);
      osc.stop(ctx.currentTime + t + 0.28);
    });
    setTimeout(() => ctx.close(), 700);
  } catch {}
}

function playIncorrectSound() {
  if (!isSoundEnabled()) return;
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(220, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.22);
    gain.gain.setValueAtTime(0.22, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.32);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.32);
    setTimeout(() => ctx.close(), 500);
  } catch {}
}

interface Props {
  title: string;
  steps: LessonStep[];
  difficulty: Difficulty;
  xpReward: number;
  lessonSlug?: string;
  // May resolve with the server's XP grant, which overrides the local estimate.
  onComplete: (totalScore: number) => void | Promise<number | null | void>;
  onExit: () => void;
}

const C = {
  primary: "#574eb1", primaryDark: "#41379b", primaryDim: "#c5c0ff",
  surface: "var(--c-dark)", surfaceHigh: "var(--c-surface-high)",
  border: "var(--c-border)", muted: "var(--c-muted)",
  success: "#006c4e", successDim: "#83f5c6",
  error: "#8b2828", errorDim: "#ffb4ab",
  text: "var(--c-text)", tertiary: "#ffb95d",
};

export function LessonRunner({ steps, difficulty, xpReward, lessonSlug, onComplete, onExit }: Props) {
  const [index, setIndex] = useState(0);
  const [scores, setScores] = useState<number[]>([]);
  const [phase, setPhase] = useState<"exercise" | "result">("exercise");
  const [earnedXP, setEarnedXP] = useState(0);

  // Per-exercise submit flow
  const [submitted, setSubmitted] = useState(false);
  const [hasAnswer, setHasAnswer] = useState(false);
  const [pendingResult, setPendingResult] = useState<ExerciseResult | null>(null);

  // Hearts. null = not loaded (or unauthenticated) — no heart tracking then.
  // Wrong answers cost 1 heart; section tests have their own separate hearts.
  const [hearts, setHearts] = useState<number | null>(null);
  const [nextRefillAt, setNextRefillAt] = useState<string | null>(null);
  const [outOfHearts, setOutOfHearts] = useState(false);
  const [refillMsg, setRefillMsg] = useState("");

  const applyHeartsState = (d: HeartsState | null) => {
    if (!d || typeof d.hearts !== "number") return;
    setHearts(d.hearts);
    setNextRefillAt(d.nextRefillAt);
  };

  // Snapshot the countdown text at trigger time — render must stay pure.
  const triggerOutOfHearts = (refillAt: string | null) => {
    const ms = refillAt ? new Date(refillAt).getTime() - Date.now() : 0;
    const mins = Math.max(1, Math.ceil(ms / 60_000));
    setRefillMsg(ms > 0
      ? `Next heart in ${mins >= 60 ? `${Math.floor(mins / 60)}h ${mins % 60}m` : `${mins}m`}.`
      : "A heart should be ready any moment.");
    setOutOfHearts(true);
  };

  useEffect(() => {
    fetch("/api/hearts")
      .then((r) => (r.ok ? r.json() : null))
      .then((d: HeartsState | null) => {
        applyHeartsState(d);
        // Can't start a lesson with no hearts left.
        if (d && d.hearts <= 0) triggerOutOfHearts(d.nextRefillAt);
      })
      .catch(() => {});
  }, []);

  // Teach-slide audio
  const [teachPlaying, setTeachPlaying] = useState(false);

  const playTeachAudio = useCallback(async (
    note?: string,
    notes?: string[],
    interval?: [string, string]
  ) => {
    if (teachPlaying) return;
    setTeachPlaying(true);
    try {
      const piano = await getPiano();
      if (interval) {
        piano.triggerAttackRelease(interval[0], "0.6");
        setTimeout(() => piano.triggerAttackRelease(interval[1], "0.6"), 800);
        setTimeout(() => setTeachPlaying(false), 1600);
      } else if (notes && notes.length > 1) {
        piano.triggerAttackRelease(notes, "1.2");
        setTimeout(() => setTeachPlaying(false), 1400);
      } else if (note) {
        piano.triggerAttackRelease(note, "0.8");
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
    if (result.passed) playCorrectSound();
    else playIncorrectSound();

    if (!result.passed && hearts !== null) {
      // Optimistic decrement; the server response reconciles (it also applies
      // any refill that happened since the last fetch).
      setHearts((h) => (h === null ? h : Math.max(0, h - 1)));
      fetch("/api/hearts", { method: "POST" })
        .then((r) => (r.ok ? r.json() : null))
        .then(applyHeartsState)
        .catch(() => {});
    }

    // Fire-and-forget mastery recording. The slot generator tags each exercise
    // step with its conceptId; if a step came from some other path it lacks
    // a tag and we skip the write.
    const step = steps[index];
    if (step?.kind === "exercise" && step.conceptId) {
      fetch("/api/mastery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conceptId: step.conceptId,
          isCorrect: result.passed,
          lessonSlug,
        }),
      }).catch(() => {});
    }
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
      // Server returns the actual grant (0 on replays); prefer it over the estimate.
      Promise.resolve(onComplete(total))
        .then((serverXp) => {
          if (typeof serverXp === "number") setEarnedXP(serverXp);
        })
        .catch(() => {});
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
    // Out of hearts mid-lesson: the run ends here (the final step still counts
    // if this was it — the lesson completes normally in that case).
    if (!pendingResult.passed && hearts === 0 && index < steps.length - 1) {
      triggerOutOfHearts(nextRefillAt);
      return;
    }
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

  const handleDebugAdvance = () => {
    if (isTeachStep || currentStep?.kind === "teach") {
      advanceStep(scores);
    } else {
      const newScores = [...scores, 100];
      setScores(newScores);
      advanceStep(newScores);
    }
  };

  const progressPct = ((phase === "result" ? steps.length : index) / steps.length) * 100;
  const avgScore = scores.length
    ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
    : 100;
  const currentStep = steps[index];
  const isTeachStep = phase === "exercise" && currentStep?.kind === "teach";
  const isCorrect = pendingResult?.passed ?? false;

  if (outOfHearts) {
    return (
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        height: "100vh", gap: 24, backgroundColor: C.surface, textAlign: "center", padding: 20,
      }}>
        <div style={{
          width: 100, height: 100, borderRadius: "50%",
          backgroundColor: C.surfaceHigh, boxShadow: "0 8px 0 0 rgba(0,0,0,0.4)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: 52, color: C.errorDim, fontVariationSettings: "'FILL' 1" }}>
            heart_broken
          </span>
        </div>
        <div>
          <h2 style={{ color: C.text, fontFamily: "'Nunito', sans-serif", fontSize: 26, fontWeight: 900, margin: "0 0 8px" }}>
            Out of hearts
          </h2>
          <p style={{ color: C.muted, fontFamily: "'Nunito', sans-serif", fontSize: 15, lineHeight: 1.6, margin: 0, maxWidth: 360 }}>
            {refillMsg}
          </p>
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
          Back
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", backgroundColor: C.surface, overflow: "hidden" }}>

      {/* ── Top bar ── */}
      <div style={{
        display: "flex", alignItems: "center", padding: "0 72px",
        height: 64, gap: 8, flexShrink: 0,
      }}>
        <button
          onClick={onExit}
          className="btn-ghost-hover"
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
          <span className="material-symbols-outlined" style={{ fontSize: 28, color: hearts === 0 ? C.muted : "#ffb4ab", fontVariationSettings: "'FILL' 1" }}>favorite</span>
          <span style={{ color: C.text, fontFamily: "'Nunito', sans-serif", fontSize: 18, fontWeight: 700 }}>{hearts ?? "∞"}</span>
        </div>

        {/* Debug: auto-advance (dev only) */}
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

      {/* ── Body ── */}
      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px 20px 120px" }}>
        {phase === "exercise" && isTeachStep ? (
          /* Teach slide */
          (() => {
            const step = currentStep as Extract<typeof currentStep, { kind: "teach" }>;
            const hasAudio = step.playNote || step.playNotes || step.playInterval;
            return (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 28, textAlign: "center", maxWidth: 420 }}>
                {step.symbol ? (
                  /* Rhythm-symbol intro: show the actual glyph being taught */
                  <div style={{
                    minWidth: 150, minHeight: 130, borderRadius: 20,
                    backgroundColor: C.surfaceHigh,
                    border: `2px solid ${C.border}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    padding: "16px 24px",
                  }}>
                    <NoteSymbolSVG symbol={step.symbol} size={96} />
                  </div>
                ) : step.vexKey ? (
                  /* Staff-note intro: show the note where it sits on the staff */
                  <div style={{
                    borderRadius: 20,
                    backgroundColor: C.surfaceHigh,
                    border: `2px solid ${C.border}`,
                    padding: "8px 12px",
                  }}>
                    <StaffRenderer vexKey={step.vexKey} width={260} height={130} />
                  </div>
                ) : (
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
                )}
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
              backgroundColor: avgScore >= 70 ? C.success : C.surfaceHigh,
              boxShadow: avgScore >= 70 ? `0 8px 0 0 #00513a` : `0 8px 0 0 rgba(0,0,0,0.4)`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: 52, color: "white", fontVariationSettings: "'FILL' 1" }}>
                {avgScore >= 70 ? "star" : "sentiment_neutral"}
              </span>
            </div>

            <div>
              <h2 style={{ color: C.text, fontFamily: "'Nunito', sans-serif", fontSize: 26, fontWeight: 900, margin: "0 0 6px" }}>
                {avgScore >= 70 ? "Lesson Complete!" : "Keep Practicing"}
              </h2>
              <p style={{ color: C.muted, fontFamily: "'Nunito', sans-serif", fontSize: 15, margin: 0 }}>
                Score: {avgScore}%
              </p>
              {isMotivationalEnabled() && (
                <p style={{ color: C.primaryDim, fontFamily: "'Nunito', sans-serif", fontSize: 14, fontWeight: 700, margin: "10px 0 0" }}>
                  {avgScore >= 70
                    ? MOTIVATION_PASS[Math.floor(avgScore) % MOTIVATION_PASS.length]
                    : MOTIVATION_FAIL[Math.floor(avgScore) % MOTIVATION_FAIL.length]}
                </p>
              )}
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
            <motion.button
              onClick={handleContinue}
              whileTap={{ scale: 0.97 }}
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
            </motion.button>
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
                <motion.button
                  onClick={handleSkip}
                  whileTap={{ scale: 0.95 }}
                  className="btn-ghost-hover"
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
                </motion.button>
              )}

              {/* Right: CHECK or CONTINUE */}
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
                    textTransform: "uppercase", letterSpacing: "0.06em",
                    cursor: "pointer",
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
            </>
          )}
        </div>
      )}
    </div>
  );
}
