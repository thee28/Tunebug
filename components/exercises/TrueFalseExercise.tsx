"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import type { TrueFalseConfig } from "@/types/music";
import type { Difficulty } from "@/lib/curriculum/content";
import type { ExerciseResult } from "./ExerciseEngine";
import { StaffRenderer } from "./StaffRenderer";

interface Props {
  config: TrueFalseConfig;
  difficulty: Difficulty;
  submitted: boolean;
  onAnswerChange: (hasAnswer: boolean) => void;
  onComplete: (result: ExerciseResult) => void;
}

const C = {
  primary: "#574eb1", primaryDark: "#41379b",
  surfaceHigh: "var(--c-surface-high)", border: "var(--c-border)", muted: "var(--c-muted)",
  text: "var(--c-text)", selected: "#3d3580",
  success: "#006c4e", error: "#8b2828",
};

export function TrueFalseExercise({ config, submitted, onAnswerChange, onComplete }: Props) {
  const [selected, setSelected] = useState<boolean | null>(null);
  const [playing, setPlaying] = useState(false);
  const synthRef = useRef<unknown>(null);

  useEffect(() => {
    return () => {
      (synthRef.current as { dispose?: () => void } | null)?.dispose?.();
    };
  }, []);

  const playAudio = useCallback(async () => {
    if (!config.audioNote || playing) return;
    setPlaying(true);
    try {
      const Tone = await import("tone");
      await Tone.start();
      if (!synthRef.current) {
        synthRef.current = new Tone.Synth({ oscillator: { type: "triangle" } }).toDestination();
      }
      const synth = synthRef.current as InstanceType<typeof Tone.Synth>;
      synth.triggerAttackRelease(config.audioNote, "0.6");
      setTimeout(() => setPlaying(false), 700);
    } catch {
      setPlaying(false);
    }
  }, [config.audioNote, playing]);

  const handleSelect = (val: boolean) => {
    if (submitted) return;
    setSelected(val);
    onAnswerChange(true);
  };

  useEffect(() => {
    if (!submitted) return;
    const passed = selected === config.correctAnswer;
    onComplete({ score: passed ? 100 : 0, passed, correctAnswerText: config.correctAnswer ? "True" : "False" });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submitted]);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 24 }}>
      <p style={{ color: C.muted, fontFamily: "'Nunito', sans-serif", fontSize: 14, fontWeight: 700, margin: 0, textAlign: "center", textTransform: "uppercase", letterSpacing: "0.08em" }}>
        {config.prompt}
      </p>

      {config.vexKey && !config.audioNote && (
        <StaffRenderer vexKey={config.vexKey} />
      )}

      {config.audioNote && (
        <button
          onClick={playAudio}
          style={{
            width: 80, height: 80, borderRadius: "50%",
            backgroundColor: playing ? C.primaryDark : C.primary,
            boxShadow: `0 5px 0 0 ${C.primaryDark}`,
            border: "none", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 38, color: "white" }}>
            {playing ? "graphic_eq" : "volume_up"}
          </span>
        </button>
      )}

      <p style={{ color: C.text, fontFamily: "'Nunito', sans-serif", fontSize: 22, fontWeight: 800, margin: 0, textAlign: "center", maxWidth: 360 }}>
        {config.claim}
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, width: "100%", maxWidth: 360 }}>
        {[true, false].map((val) => {
          const isSelected = val === selected;
          return (
            <button
              key={String(val)}
              onClick={() => handleSelect(val)}
              style={{
                padding: "18px 0", borderRadius: 14,
                backgroundColor: isSelected ? C.selected : C.surfaceHigh,
                border: `2px solid ${isSelected ? C.primary : C.border}`,
                color: C.text,
                fontFamily: "'Nunito', sans-serif", fontSize: 20, fontWeight: 800,
                cursor: submitted ? "default" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 22 }}>
                {val ? "check_circle" : "cancel"}
              </span>
              {val ? "True" : "False"}
            </button>
          );
        })}
      </div>
    </div>
  );
}
