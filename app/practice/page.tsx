"use client";

import { useState } from "react";
import type { ExerciseType, ExerciseConfig } from "@/types/music";
import type { Difficulty } from "@/lib/curriculum/content";
import { DIFFICULTY_SETTINGS, NOTE_POOLS } from "@/lib/curriculum/content";
import { ExerciseEngine, type ExerciseResult } from "@/components/exercises/ExerciseEngine";

const C = {
  primary: "#574eb1", primaryDark: "#41379b",
  secondary: "#006c4e",
  surface: "#141321", surfaceHigh: "#211F26",
  border: "#33313D", muted: "#938F99", text: "#f3eff5",
  selected: "#3d3580",
};

const DIFFICULTIES: { value: Difficulty; label: string }[] = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
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

export default function PracticePage() {
  const [difficulty, setDifficulty] = useState<Difficulty>("beginner");
  const [exerciseType, setExerciseType] = useState<ExerciseType>("EAR_SINGLE");
  const [selectedNote, setSelectedNote] = useState<string>("C4");
  const [mode, setMode] = useState<"config" | "exercise">("config");
  const [lastResult, setLastResult] = useState<ExerciseResult | null>(null);

  const notePool = NOTE_POOLS[difficulty];

  const handleStart = () => {
    setLastResult(null);
    setMode("exercise");
  };

  const handleComplete = (result: ExerciseResult) => {
    setLastResult(result);
    setMode("config");
  };

  if (mode === "exercise") {
    const config = buildFreeExercise(exerciseType, selectedNote, difficulty);
    return (
      <div style={{ minHeight: "100vh", backgroundColor: C.surface, display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={() => setMode("config")} style={{ background: "none", border: "none", cursor: "pointer" }}>
            <span className="material-symbols-outlined" style={{ color: C.muted, fontSize: 24 }}>close</span>
          </button>
          <span style={{ color: C.muted, fontFamily: "'Nunito', sans-serif", fontSize: 14 }}>Free Practice</span>
        </div>
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "32px 20px" }}>
          <div style={{ width: "100%", maxWidth: 480 }}>
            <ExerciseEngine type={exerciseType} config={config} difficulty={difficulty} onComplete={handleComplete} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: C.surface, padding: "0 0 48px" }}>
      <div style={{ padding: "20px 20px 0" }}>
        <a href="/dashboard" style={{ display: "inline-flex", alignItems: "center", gap: 6, color: C.muted, textDecoration: "none", fontFamily: "'Nunito', sans-serif", fontSize: 14 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_back</span>
          Back
        </a>
      </div>

      <div style={{ maxWidth: 480, margin: "0 auto", padding: "32px 20px 0" }}>
        <h1 style={{ color: C.text, fontFamily: "'Nunito', sans-serif", fontSize: 26, fontWeight: 900, margin: "0 0 6px" }}>Free Practice</h1>
        <p style={{ color: C.muted, fontFamily: "'Nunito', sans-serif", fontSize: 14, margin: "0 0 36px" }}>Pick what you want to practice.</p>

        {lastResult && (
          <div style={{ padding: "12px 16px", borderRadius: 12, backgroundColor: lastResult.passed ? "#0d3d2a" : "#3d1212", border: `1px solid ${lastResult.passed ? C.secondary : "#8b2828"}`, marginBottom: 24 }}>
            <p style={{ color: lastResult.passed ? "#4ade80" : "#f87171", fontFamily: "'Nunito', sans-serif", fontWeight: 700, fontSize: 14, margin: 0 }}>
              {lastResult.passed ? `✓ Correct! Score: ${lastResult.score}%` : `✗ Score: ${lastResult.score}% — try again`}
            </p>
          </div>
        )}

        {/* Difficulty */}
        <section style={{ marginBottom: 28 }}>
          <p style={{ color: C.muted, fontFamily: "'Nunito', sans-serif", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 10px" }}>Difficulty</p>
          <div style={{ display: "flex", gap: 10 }}>
            {DIFFICULTIES.map((d) => (
              <button
                key={d.value}
                onClick={() => { setDifficulty(d.value); setSelectedNote(NOTE_POOLS[d.value][0]); }}
                style={{
                  flex: 1, padding: "10px 0", borderRadius: 12,
                  backgroundColor: difficulty === d.value ? C.primary : C.surfaceHigh,
                  border: `2px solid ${difficulty === d.value ? C.primary : C.border}`,
                  color: C.text, fontFamily: "'Nunito', sans-serif", fontSize: 13, fontWeight: 700, cursor: "pointer",
                }}
              >
                {d.label}
              </button>
            ))}
          </div>
        </section>

        {/* Exercise type */}
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
                  cursor: "pointer", display: "flex", alignItems: "center", gap: 12, textAlign: "left",
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 20, color: exerciseType === et.value ? "white" : C.muted }}>{et.icon}</span>
                {et.label}
              </button>
            ))}
          </div>
        </section>

        {/* Note selector */}
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

        <button
          onClick={handleStart}
          style={{
            width: "100%", padding: "16px 0", borderRadius: 14,
            backgroundColor: C.primary, boxShadow: `0 5px 0 0 ${C.primaryDark}`,
            color: "white", border: "none",
            fontFamily: "'Nunito', sans-serif", fontSize: 17, fontWeight: 800, cursor: "pointer",
          }}
        >
          Practice
        </button>
      </div>
    </div>
  );
}
