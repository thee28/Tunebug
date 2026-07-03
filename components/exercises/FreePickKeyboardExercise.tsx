"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import type { FreePickKeyboardConfig } from "@/types/music";
import type { Difficulty } from "@/lib/curriculum/content";
import type { ExerciseResult } from "./ExerciseEngine";
import { Keyboard } from "./Keyboard";

interface Props {
  config: FreePickKeyboardConfig;
  difficulty: Difficulty;
  submitted: boolean;
  onAnswerChange: (hasAnswer: boolean) => void;
  onComplete: (result: ExerciseResult) => void;
}

const C = {
  primary: "#574eb1", primaryDark: "#41379b",
  surfaceHigh: "var(--c-surface-high)", border: "var(--c-border)", muted: "var(--c-muted)",
  text: "var(--c-text)",
};

export function FreePickKeyboardExercise({ config, submitted, onAnswerChange, onComplete }: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const synthRef = useRef<unknown>(null);

  useEffect(() => {
    return () => {
      (synthRef.current as { dispose?: () => void } | null)?.dispose?.();
    };
  }, []);

  const playTarget = useCallback(async () => {
    if (playing) return;
    setPlaying(true);
    try {
      const Tone = await import("tone");
      await Tone.start();
      if (!synthRef.current) {
        synthRef.current = new Tone.Synth({ oscillator: { type: "triangle" } }).toDestination();
      }
      const synth = synthRef.current as InstanceType<typeof Tone.Synth>;
      synth.triggerAttackRelease(config.targetNote, "0.8");
      setTimeout(() => setPlaying(false), 900);
    } catch {
      setPlaying(false);
    }
  }, [config.targetNote, playing]);

  const handleSelect = (note: string) => {
    if (submitted) return;
    setSelected(note);
    onAnswerChange(true);
  };

  useEffect(() => {
    if (!submitted) return;
    const passed = selected === config.targetNote;
    onComplete({ score: passed ? 100 : 0, passed, correctAnswerText: config.targetNote });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submitted]);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 24 }}>
      <p style={{ color: C.text, fontFamily: "'Nunito', sans-serif", fontSize: 22, fontWeight: 800, margin: 0, textAlign: "center" }}>
        Tap the note you hear
      </p>

      <button
        onClick={playTarget}
        style={{
          width: 96, height: 96, borderRadius: "50%",
          backgroundColor: playing ? C.primaryDark : C.primary,
          boxShadow: `0 6px 0 0 ${C.primaryDark}`,
          border: "none", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          transform: playing ? "translateY(3px)" : "none", transition: "transform 0.1s",
        }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 44, color: "white" }}>
          {playing ? "graphic_eq" : "volume_up"}
        </span>
      </button>

      <Keyboard
        octaveRange={config.octaveRange}
        selectedNote={selected}
        disabled={submitted}
        onSelect={handleSelect}
      />
    </div>
  );
}
