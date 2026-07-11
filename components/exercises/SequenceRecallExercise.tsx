"use client";

import { useState, useCallback, useEffect } from "react";
import { getPiano } from "@/lib/audio/piano";
import type { SequenceRecallConfig } from "@/types/music";
import type { Difficulty } from "@/lib/curriculum/content";
import type { ExerciseResult } from "./ExerciseEngine";
import { Keyboard } from "./Keyboard";

interface Props {
  config: SequenceRecallConfig;
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

export function SequenceRecallExercise({ config, submitted, onAnswerChange, onComplete }: Props) {
  const [userSeq, setUserSeq] = useState<string[]>([]);
  const [playing, setPlaying] = useState(false);

  const playSequence = useCallback(async () => {
    if (playing) return;
    setPlaying(true);
    try {
      const Tone = await import("tone");
      const piano = await getPiano();
      const now = Tone.now();
      config.sequence.forEach((n, i) => {
        piano.triggerAttackRelease(n, "0.4", now + i * 0.6);
      });
      setTimeout(() => setPlaying(false), config.sequence.length * 600 + 200);
    } catch {
      setPlaying(false);
    }
  }, [config.sequence, playing]);

  const tapKey = (note: string) => {
    if (submitted) return;
    if (userSeq.length >= config.sequence.length) return;
    try {
      // brief audio feedback for the tap
      (async () => {
        const piano = await getPiano();
        piano.triggerAttackRelease(note, "0.3");
      })();
    } catch {}
    setUserSeq((s) => [...s, note]);
  };

  const clear = () => {
    if (submitted) return;
    setUserSeq([]);
  };

  useEffect(() => {
    onAnswerChange(userSeq.length === config.sequence.length);
  }, [userSeq.length, config.sequence.length, onAnswerChange]);

  useEffect(() => {
    if (!submitted) return;
    const matches = userSeq.filter((n, i) => n === config.sequence[i]).length;
    const passed = matches === config.sequence.length;
    const score = Math.round((matches / config.sequence.length) * 100);
    onComplete({ score, passed, correctAnswerText: config.sequence.join(" → ") });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submitted]);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
      <p style={{ color: C.text, fontFamily: "'Nunito', sans-serif", fontSize: 22, fontWeight: 800, margin: 0, textAlign: "center" }}>
        Replay the sequence
      </p>

      <button
        onClick={playSequence}
        style={{
          width: 80, height: 80, borderRadius: "50%",
          backgroundColor: playing ? C.primaryDark : C.primary,
          boxShadow: `0 5px 0 0 ${C.primaryDark}`,
          border: "none", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 38, color: "white" }}>
          {playing ? "graphic_eq" : "play_arrow"}
        </span>
      </button>

      {/* Progress dots */}
      <div style={{ display: "flex", gap: 8 }}>
        {config.sequence.map((_, i) => {
          const filled = i < userSeq.length;
          const correct = filled && userSeq[i] === config.sequence[i];
          return (
            <div
              key={i}
              style={{
                width: 16, height: 16, borderRadius: "50%",
                backgroundColor: filled ? (correct ? C.success : C.error) : C.surfaceHigh,
                border: `2px solid ${filled ? "transparent" : C.border}`,
              }}
            />
          );
        })}
      </div>

      <Keyboard
        octaveRange={config.octaveRange}
        focusNotes={config.sequence}
        disabled={submitted || userSeq.length >= config.sequence.length}
        onSelect={tapKey}
      />

      {userSeq.length > 0 && !submitted && userSeq.length < config.sequence.length && (
        <button
          onClick={clear}
          style={{
            padding: "6px 14px", borderRadius: 10,
            background: "transparent", border: `1px solid ${C.border}`,
            color: C.muted, fontFamily: "'Nunito', sans-serif",
            fontSize: 12, fontWeight: 700, cursor: "pointer",
          }}
        >
          Clear
        </button>
      )}
    </div>
  );
}
