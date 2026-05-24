"use client";

// TODO: render the note on a staff using VexFlow
// API: import { Renderer, Stave, StaveNote, Voice, Formatter } from "vexflow"
// Mount into a div ref, create Renderer with SVG backend, draw treble clef + note

import { useState } from "react";
import type { SightReadPianoConfig } from "@/types/music";
import type { Difficulty } from "@/lib/curriculum/content";
import type { ExerciseResult } from "./ExerciseEngine";

interface Props {
  config: SightReadPianoConfig;
  difficulty: Difficulty;
  onComplete: (result: ExerciseResult) => void;
}

const C = {
  primary: "#574eb1", primaryDark: "#41379b",
  surfaceHigh: "#211F26", border: "#33313D", muted: "#938F99",
  success: "#006c4e", error: "#8b2828", text: "#f3eff5",
};

const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

function noteStrToMidi(note: string): number {
  const m = note.match(/^([A-G]#?)(\d)$/);
  if (!m) return 60;
  return (parseInt(m[2]) + 1) * 12 + NOTE_NAMES.indexOf(m[1]);
}

function buildKeyboard(octaveRange: [number, number]): { note: string; isBlack: boolean }[] {
  const keys: { note: string; isBlack: boolean }[] = [];
  for (let oct = octaveRange[0]; oct <= octaveRange[1]; oct++) {
    for (const name of ["C", "D", "E", "F", "G", "A", "B"]) {
      keys.push({ note: `${name}${oct}`, isBlack: false });
    }
  }
  return keys;
}

export function SightReadExercise({ config, difficulty, onComplete }: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);

  const targetMidi = noteStrToMidi(config.targetNote);
  const targetName = config.targetNote.replace(/\d$/, "");

  const handleSelect = (note: string) => {
    if (revealed) return;
    setSelected(note);
    setRevealed(true);
  };

  const handleContinue = () => {
    onComplete({ score: selected === config.targetNote ? 100 : 0, passed: selected === config.targetNote });
  };

  // Simple piano key row (white keys only for now)
  const whiteKeys = buildKeyboard(config.octaveRange);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 24 }}>
      <p style={{ color: C.muted, fontFamily: "'Nunito', sans-serif", fontSize: 14, margin: 0 }}>
        Find this note on the keyboard
      </p>

      {/* Staff placeholder — TODO: replace with VexFlow renderer */}
      <div style={{
        width: "100%", maxWidth: 360, height: 100,
        backgroundColor: C.surfaceHigh, borderRadius: 12,
        border: `2px solid ${C.border}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        flexDirection: "column", gap: 4,
      }}>
        <span style={{ color: C.muted, fontSize: 13, fontFamily: "'Nunito', sans-serif" }}>
          Staff (VexFlow)
        </span>
        <span style={{ color: C.text, fontSize: 28, fontWeight: 900, fontFamily: "'Nunito', sans-serif" }}>
          {targetName}
        </span>
        <span style={{ color: C.muted, fontSize: 11, fontFamily: "'Nunito', sans-serif" }}>
          {config.vexKey}
        </span>
      </div>

      {/* Piano keyboard — white keys only */}
      <div style={{ display: "flex", gap: 3, overflowX: "auto", maxWidth: "100%", padding: "0 4px" }}>
        {whiteKeys.map(({ note }) => {
          const isTarget = note === config.targetNote;
          const isSelected = note === selected;
          let bg = "white", border = "#ccc";
          if (revealed) {
            if (isTarget) { bg = "#4ade80"; border = "#22c55e"; }
            else if (isSelected && !isTarget) { bg = "#fca5a5"; border = "#ef4444"; }
          } else if (isSelected) {
            bg = "#a5b4fc"; border = C.primary;
          }
          return (
            <button
              key={note}
              onClick={() => handleSelect(note)}
              style={{
                width: 36, height: 80, borderRadius: "0 0 6px 6px",
                backgroundColor: bg, border: `2px solid ${border}`,
                cursor: revealed ? "default" : "pointer", flexShrink: 0,
                display: "flex", alignItems: "flex-end", justifyContent: "center", paddingBottom: 4,
              }}
            >
              <span style={{ fontSize: 9, fontFamily: "'Nunito', sans-serif", color: "#555", fontWeight: 600 }}>
                {note.replace(/\d$/, "")}
              </span>
            </button>
          );
        })}
      </div>

      {revealed && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
          <p style={{
            color: selected === config.targetNote ? "#4ade80" : "#f87171",
            fontFamily: "'Nunito', sans-serif", fontWeight: 700, fontSize: 15, margin: 0,
          }}>
            {selected === config.targetNote ? "Correct!" : `It was ${config.targetNote}`}
          </p>
          <button
            onClick={handleContinue}
            style={{
              padding: "14px 48px", borderRadius: 14,
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
  );
}
