"use client";

// TEMPORARY debugging tool — lets any exercise type be launched directly
// from the sidebar without generating a real lesson. Remove before ship.

import { useState } from "react";
import type { ExerciseType, ExerciseConfig } from "@/types/music";
import type { ConceptCategory } from "@/lib/curriculum/concepts";
import { CONCEPT_TYPE_POOL } from "@/lib/curriculum/concepts";
import { generateFreePracticeSession } from "@/lib/curriculum/freePractice";
import { ExerciseEngine, type ExerciseResult } from "@/components/exercises/ExerciseEngine";

const ALL_TYPES: ExerciseType[] = [
  "EAR_SINGLE", "SAME_DIFFERENT", "HIGHER_LOWER", "ODD_ONE_OUT", "FREE_PICK_KEYBOARD",
  "TRUE_FALSE", "MATCHING_PAIRS", "SEQUENCE_RECALL",
  "PITCH_MATCH",
  "SIGHT_READ_PIANO", "NAME_IT", "ERROR_SPOTTING",
  "INTERVAL_ID",
  "EAR_MULTI",
  "NOTE_VALUE_ID", "COUNT_BEATS", "SAME_DIFFERENT_RHYTHM", "FILL_BLANK_RHYTHM", "BUILD_RHYTHM", "TAP_ALONG",
];

const NOTE_POOL = ["C4", "D4", "E4", "F4", "G4", "A4", "B4", "C#4", "D#4", "F#4", "G#4", "A#4", "C5", "D5", "E5"];

function categoryFor(type: ExerciseType): ConceptCategory {
  for (const cat of Object.keys(CONCEPT_TYPE_POOL) as ConceptCategory[]) {
    if (CONCEPT_TYPE_POOL[cat].includes(type)) return cat;
  }
  throw new Error(`no category for ${type}`);
}

function findExercise(type: ExerciseType): { type: ExerciseType; config: ExerciseConfig } | null {
  const domain = categoryFor(type);
  for (let attempt = 0; attempt < 5; attempt++) {
    const session = generateFreePracticeSession({
      domains: [domain],
      difficulty: "intermediate",
      notePool: NOTE_POOL,
      slotCount: 30,
      seed: Date.now() + attempt,
    });
    const match = session.find((s) => s.type === type);
    if (match) return match;
  }
  return null;
}

export default function DebugExercisePicker() {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState<{ type: ExerciseType; config: ExerciseConfig } | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<ExerciseResult | null>(null);

  const launch = (type: ExerciseType) => {
    const ex = findExercise(type);
    setSubmitted(false);
    setResult(null);
    setCurrent(ex);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{
          marginTop: 12, padding: "8px 12px", borderRadius: 10,
          backgroundColor: "#8b2828", color: "white", border: "2px dashed white",
          fontFamily: "monospace", fontSize: 11, fontWeight: 700, cursor: "pointer",
        }}
      >
        🐛 DEBUG EXERCISES
      </button>

      {open && (
        <div style={{ position: "fixed", inset: 0, zIndex: 999, backgroundColor: "rgba(0,0,0,0.85)", overflowY: "auto", padding: 24 }}>
          <div style={{ maxWidth: 600, margin: "0 auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h2 style={{ color: "white", fontFamily: "monospace" }}>Debug: Pick Exercise</h2>
              <button onClick={() => { setOpen(false); setCurrent(null); }} style={{ color: "white", background: "#8b2828", border: "none", borderRadius: 8, padding: "6px 12px", cursor: "pointer" }}>
                Close
              </button>
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 24 }}>
              {ALL_TYPES.map((t) => (
                <button
                  key={t}
                  onClick={() => launch(t)}
                  style={{
                    padding: "8px 12px", borderRadius: 8,
                    backgroundColor: current?.type === t ? "#574eb1" : "#333", color: "white",
                    border: "1px solid #666", fontFamily: "monospace", fontSize: 11, cursor: "pointer",
                  }}
                >
                  {t}
                </button>
              ))}
            </div>

            {current === null ? null : (
              <div style={{ backgroundColor: "#1a1a1a", borderRadius: 12, padding: 24 }}>
                <ExerciseEngine
                  key={current.type + JSON.stringify(current.config)}
                  type={current.type}
                  config={current.config}
                  difficulty="intermediate"
                  submitted={submitted}
                  onAnswerChange={() => {}}
                  onComplete={setResult}
                />
                <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
                  <button onClick={() => setSubmitted(true)} style={{ padding: "8px 16px", borderRadius: 8, background: "#574eb1", color: "white", border: "none", cursor: "pointer" }}>
                    Check
                  </button>
                  <button onClick={() => launch(current.type)} style={{ padding: "8px 16px", borderRadius: 8, background: "#333", color: "white", border: "1px solid #666", cursor: "pointer" }}>
                    Reroll
                  </button>
                  {result && <span style={{ color: result.passed ? "#83f5c6" : "#ffb4ab", fontFamily: "monospace" }}>{result.passed ? "PASS" : "FAIL"} ({result.score})</span>}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
