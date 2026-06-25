"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import type { OddOneOutConfig } from "@/types/music";
import type { Difficulty } from "@/lib/curriculum/content";
import type { ExerciseResult } from "./ExerciseEngine";

interface Props {
  config: OddOneOutConfig;
  difficulty: Difficulty;
  submitted: boolean;
  onAnswerChange: (hasAnswer: boolean) => void;
  onComplete: (result: ExerciseResult) => void;
}

const C = {
  primary: "#574eb1", primaryDark: "#41379b",
  surfaceHigh: "var(--c-surface-high)", border: "var(--c-border)", muted: "var(--c-muted)",
  text: "var(--c-text)", selected: "#3d3580",
};

export function OddOneOutExercise({ config, submitted, onAnswerChange, onComplete }: Props) {
  const [selected, setSelected] = useState<number | null>(null);
  const [playing, setPlaying] = useState(false);
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);
  const synthRef = useRef<unknown>(null);

  const playAll = useCallback(async () => {
    if (playing) return;
    setPlaying(true);
    try {
      const Tone = await import("tone");
      await Tone.start();
      if (!synthRef.current) {
        synthRef.current = new Tone.Synth({ oscillator: { type: "triangle" } }).toDestination();
      }
      const synth = synthRef.current as InstanceType<typeof Tone.Synth>;
      const now = Tone.now();
      config.notes.forEach((n, i) => {
        synth.triggerAttackRelease(n, "0.4", now + i * 0.6);
      });
      setTimeout(() => setPlaying(false), 600 * config.notes.length + 200);
    } catch {
      setPlaying(false);
    }
  }, [config.notes, playing]);

  const playOne = useCallback(async (idx: number) => {
    if (playingIndex !== null) return;
    setPlayingIndex(idx);
    try {
      const Tone = await import("tone");
      await Tone.start();
      if (!synthRef.current) {
        synthRef.current = new Tone.Synth({ oscillator: { type: "triangle" } }).toDestination();
      }
      const synth = synthRef.current as InstanceType<typeof Tone.Synth>;
      synth.triggerAttackRelease(config.notes[idx], "0.5");
      setTimeout(() => setPlayingIndex(null), 600);
    } catch {
      setPlayingIndex(null);
    }
  }, [config.notes, playingIndex]);

  const handleSelect = (idx: number) => {
    if (submitted) return;
    setSelected(idx);
    onAnswerChange(true);
  };

  useEffect(() => {
    if (!submitted) return;
    const passed = selected === config.oddIndex;
    onComplete({
      score: passed ? 100 : 0,
      passed,
      correctAnswerText: `Position ${config.oddIndex + 1}`,
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submitted]);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 32 }}>
      <p style={{ color: C.text, fontFamily: "'Nunito', sans-serif", fontSize: 22, fontWeight: 800, margin: 0, textAlign: "center" }}>
        Which one is different?
      </p>

      <button
        onClick={playAll}
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
          {playing ? "graphic_eq" : "play_arrow"}
        </span>
      </button>

      <div style={{ display: "grid", gridTemplateColumns: `repeat(${config.notes.length}, 1fr)`, gap: 12, width: "100%", maxWidth: 360 }}>
        {config.notes.map((_, idx) => {
          const isSelected = idx === selected;
          const isPlayingThis = idx === playingIndex;
          return (
            <button
              key={idx}
              onClick={() => { playOne(idx); handleSelect(idx); }}
              style={{
                padding: "20px 0", borderRadius: 14,
                backgroundColor: isSelected ? C.selected : C.surfaceHigh,
                border: `2px solid ${isSelected ? C.primary : C.border}`,
                color: C.text,
                fontFamily: "'Nunito', sans-serif", fontSize: 22, fontWeight: 800,
                cursor: submitted ? "default" : "pointer",
                display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 26, color: C.muted }}>
                {isPlayingThis ? "graphic_eq" : "music_note"}
              </span>
              <span style={{ fontSize: 16, color: C.muted, fontWeight: 700 }}>{idx + 1}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
