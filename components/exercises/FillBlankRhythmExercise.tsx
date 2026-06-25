"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import type { FillBlankRhythmConfig } from "@/types/music";
import type { Difficulty } from "@/lib/curriculum/content";
import type { ExerciseResult } from "./ExerciseEngine";
import { NoteSymbolSVG, NOTE_BEATS, NOTE_SYMBOL_NAME } from "./NoteSymbolSVG";

interface Props {
  config: FillBlankRhythmConfig;
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

const BPM = 90;
const BEAT_MS = (60 / BPM) * 1000;

export function FillBlankRhythmExercise({ config, submitted, onAnswerChange, onComplete }: Props) {
  const [selected, setSelected] = useState<FillBlankRhythmConfig["correctAnswer"] | null>(null);
  const [playing, setPlaying] = useState(false);
  const synthRef = useRef<unknown>(null);

  const playPattern = useCallback(async () => {
    if (playing) return;
    setPlaying(true);
    try {
      const Tone = await import("tone");
      await Tone.start();
      if (!synthRef.current) {
        synthRef.current = new Tone.MembraneSynth().toDestination();
      }
      const synth = synthRef.current as InstanceType<typeof Tone.MembraneSynth>;
      const now = Tone.now();
      let t = 0;
      for (const sym of config.pattern) {
        const isRest = sym.includes("rest");
        if (!isRest) synth.triggerAttackRelease("C3", "8n", now + t / 1000);
        t += NOTE_BEATS[sym] * BEAT_MS;
      }
      setTimeout(() => setPlaying(false), t + 200);
    } catch {
      setPlaying(false);
    }
  }, [config.pattern, playing]);

  const handleSelect = (choice: FillBlankRhythmConfig["correctAnswer"]) => {
    if (submitted) return;
    setSelected(choice);
    onAnswerChange(true);
  };

  useEffect(() => {
    if (!submitted) return;
    const passed = selected === config.correctAnswer;
    onComplete({ score: passed ? 100 : 0, passed, correctAnswerText: NOTE_SYMBOL_NAME[config.correctAnswer] });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submitted]);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 24 }}>
      <p style={{ color: C.text, fontFamily: "'Nunito', sans-serif", fontSize: 22, fontWeight: 800, margin: 0, textAlign: "center" }}>
        Which note completes the rhythm?
      </p>

      <button
        onClick={playPattern}
        style={{
          width: 76, height: 76, borderRadius: "50%",
          backgroundColor: playing ? C.primaryDark : C.primary,
          boxShadow: `0 5px 0 0 ${C.primaryDark}`,
          border: "none", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 36, color: "white" }}>
          {playing ? "graphic_eq" : "play_arrow"}
        </span>
      </button>

      {/* Pattern with blank slot */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center", gap: 12,
        padding: "16px 20px", borderRadius: 16,
        backgroundColor: C.surfaceHigh, border: `2px solid ${C.border}`,
        minHeight: 100,
      }}>
        {config.pattern.map((sym, i) => {
          if (i === config.blankIndex) {
            return (
              <div
                key={i}
                style={{
                  width: 60, height: 80, borderRadius: 10,
                  border: `2px dashed ${C.primary}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: C.primary, fontWeight: 800, fontSize: 28,
                }}
              >?</div>
            );
          }
          return <NoteSymbolSVG key={i} symbol={sym} size={72} />;
        })}
      </div>

      <div style={{
        display: "grid", gridTemplateColumns: `repeat(${Math.min(config.choices.length, 4)}, 1fr)`,
        gap: 12, width: "100%", maxWidth: 400,
      }}>
        {config.choices.map((choice) => {
          const isSelected = choice === selected;
          return (
            <button
              key={choice}
              onClick={() => handleSelect(choice)}
              style={{
                padding: "14px 8px", borderRadius: 14,
                backgroundColor: isSelected ? C.selected : C.surfaceHigh,
                border: `2px solid ${isSelected ? C.primary : C.border}`,
                cursor: submitted ? "default" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                minHeight: 92,
              }}
            >
              <NoteSymbolSVG symbol={choice} size={56} />
            </button>
          );
        })}
      </div>
    </div>
  );
}
