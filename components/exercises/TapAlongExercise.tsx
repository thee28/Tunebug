"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import type { TapAlongConfig } from "@/types/music";
import type { Difficulty } from "@/lib/curriculum/content";
import type { ExerciseResult } from "./ExerciseEngine";
import { NoteSymbolSVG, NOTE_BEATS } from "./NoteSymbolSVG";

interface Props {
  config: TapAlongConfig;
  difficulty: Difficulty;
  submitted: boolean;
  onAnswerChange: (hasAnswer: boolean) => void;
  onComplete: (result: ExerciseResult) => void;
}

const C = {
  primary: "#574eb1", primaryDark: "#41379b",
  surfaceHigh: "var(--c-surface-high)", border: "var(--c-border)", muted: "var(--c-muted)",
  text: "var(--c-text)", success: "#006c4e", error: "#8b2828",
};

type Phase = "idle" | "running" | "done";

export function TapAlongExercise({ config, submitted, onAnswerChange, onComplete }: Props) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [currentBeat, setCurrentBeat] = useState(-1);
  const [score, setScore] = useState<number | null>(null);

  const targetTimesRef = useRef<number[]>([]);
  const tapTimesRef = useRef<number[]>([]);
  const startedAtRef = useRef<number>(0);
  const synthRef = useRef<unknown>(null);

  const beatMs = (60 / config.bpm) * 1000;

  const computeTargets = useCallback(() => {
    const out: number[] = [];
    let t = 0;
    for (const sym of config.pattern) {
      if (!sym.includes("rest")) out.push(t);
      t += NOTE_BEATS[sym] * beatMs;
    }
    return out;
  }, [config.pattern, beatMs]);

  const start = useCallback(async () => {
    if (phase !== "idle") return;
    tapTimesRef.current = [];
    targetTimesRef.current = computeTargets();
    try {
      const Tone = await import("tone");
      await Tone.start();
      if (!synthRef.current) {
        synthRef.current = new Tone.MembraneSynth().toDestination();
      }
      const synth = synthRef.current as InstanceType<typeof Tone.MembraneSynth>;
      const now = Tone.now();
      for (let i = 0; i < targetTimesRef.current.length; i++) {
        synth.triggerAttackRelease("C2", "16n", now + targetTimesRef.current[i] / 1000);
      }
    } catch {}
    setPhase("running");
    startedAtRef.current = performance.now();
    setCurrentBeat(0);

    // Advance the highlight; finish after last target + 1 beat
    const total = targetTimesRef.current[targetTimesRef.current.length - 1] + beatMs;
    targetTimesRef.current.forEach((t, i) => {
      setTimeout(() => setCurrentBeat(i), t);
    });
    setTimeout(() => {
      setPhase("done");
      // Score: % of targets that received a tap within tolerance
      const taps = tapTimesRef.current.map((t) => t - startedAtRef.current);
      let hits = 0;
      const used = new Set<number>();
      for (const tap of taps) {
        for (let i = 0; i < targetTimesRef.current.length; i++) {
          if (used.has(i)) continue;
          if (Math.abs(tap - targetTimesRef.current[i]) <= config.toleranceMs) {
            hits++;
            used.add(i);
            break;
          }
        }
      }
      const pct = Math.round((hits / targetTimesRef.current.length) * 100);
      setScore(pct);
      onAnswerChange(true);
    }, total);
  }, [phase, computeTargets, beatMs, config.toleranceMs, onAnswerChange]);

  const tap = useCallback(() => {
    if (phase !== "running") return;
    tapTimesRef.current.push(performance.now());
  }, [phase]);

  // Spacebar also taps
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.code === "Space") { e.preventDefault(); tap(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [tap]);

  useEffect(() => {
    if (!submitted) return;
    const pct = score ?? 0;
    const passed = pct >= 60;
    onComplete({ score: pct, passed, correctAnswerText: `${pct}% of beats on time` });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submitted]);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 24 }}>
      <p style={{ color: C.text, fontFamily: "'Nunito', sans-serif", fontSize: 22, fontWeight: 800, margin: 0, textAlign: "center" }}>
        Tap the rhythm in time
      </p>

      {/* Pattern visualization */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center", gap: 12,
        padding: "16px 20px", borderRadius: 16,
        backgroundColor: C.surfaceHigh, border: `2px solid ${C.border}`,
        minHeight: 100,
      }}>
        {config.pattern.map((sym, i) => (
          <div
            key={i}
            style={{
              padding: 4, borderRadius: 8,
              backgroundColor: i === currentBeat ? "rgba(87,78,177,0.35)" : "transparent",
              transition: "background-color 0.1s",
            }}
          >
            <NoteSymbolSVG symbol={sym} size={56} color={sym.includes("rest") ? C.muted : "white"} />
          </div>
        ))}
      </div>

      {phase === "idle" && (
        <button
          onClick={start}
          style={{
            padding: "16px 36px", borderRadius: 14,
            backgroundColor: C.primary, boxShadow: `0 5px 0 0 ${C.primaryDark}`,
            color: "white", border: "none",
            fontFamily: "'Nunito', sans-serif", fontSize: 16, fontWeight: 800,
            textTransform: "uppercase", letterSpacing: "0.06em", cursor: "pointer",
          }}
        >
          Start
        </button>
      )}

      {phase === "running" && (
        <button
          onMouseDown={tap}
          onTouchStart={tap}
          style={{
            width: 160, height: 160, borderRadius: "50%",
            backgroundColor: C.primary, boxShadow: `0 6px 0 0 ${C.primaryDark}`,
            color: "white", border: "none", cursor: "pointer",
            fontFamily: "'Nunito', sans-serif", fontSize: 18, fontWeight: 800,
          }}
        >
          TAP
        </button>
      )}

      {phase === "done" && score !== null && (
        <div style={{
          padding: "14px 24px", borderRadius: 12,
          backgroundColor: score >= 60 ? "rgba(0,108,78,0.2)" : "rgba(139,40,40,0.2)",
          color: score >= 60 ? "#83f5c6" : "#ffb4ab",
          fontFamily: "'Nunito', sans-serif", fontSize: 16, fontWeight: 800,
        }}>
          {score}% on time
        </div>
      )}
    </div>
  );
}
