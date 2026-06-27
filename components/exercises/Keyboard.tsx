"use client";

import { useMemo } from "react";

interface Props {
  octaveRange: [number, number];
  selectedNote?: string | null;
  highlightNotes?: string[];   // optional secondary highlight (e.g. answer key)
  disabled?: boolean;
  onSelect?: (note: string) => void;
  whiteKeyWidth?: number;
  whiteKeyHeight?: number;
}

const WHITE_LETTERS = ["C", "D", "E", "F", "G", "A", "B"] as const;
// Black-key positions: name + which white-key index it sits between (0-indexed from C).
// E.g. C# sits after C (white index 0).
const BLACK_KEYS: { name: string; afterWhiteIdx: number }[] = [
  { name: "C#", afterWhiteIdx: 0 },
  { name: "D#", afterWhiteIdx: 1 },
  { name: "F#", afterWhiteIdx: 3 },
  { name: "G#", afterWhiteIdx: 4 },
  { name: "A#", afterWhiteIdx: 5 },
];

export function Keyboard({
  octaveRange,
  selectedNote,
  highlightNotes,
  disabled,
  onSelect,
  whiteKeyWidth = 36,
  whiteKeyHeight = 110,
}: Props) {
  const whites = useMemo(() => {
    const out: string[] = [];
    for (let oct = octaveRange[0]; oct <= octaveRange[1]; oct++) {
      for (const letter of WHITE_LETTERS) out.push(`${letter}${oct}`);
    }
    return out;
  }, [octaveRange]);

  const blacks = useMemo(() => {
    const out: { note: string; left: number }[] = [];
    for (let oct = octaveRange[0]; oct <= octaveRange[1]; oct++) {
      const octWhiteStart = (oct - octaveRange[0]) * 7;
      for (const { name, afterWhiteIdx } of BLACK_KEYS) {
        const note = `${name}${oct}`;
        // Black key sits centered on the boundary between whites afterWhiteIdx and afterWhiteIdx+1.
        const left = (octWhiteStart + afterWhiteIdx + 1) * whiteKeyWidth - whiteKeyWidth * 0.35;
        out.push({ note, left });
      }
    }
    return out;
  }, [octaveRange, whiteKeyWidth]);

  const totalWidth = whites.length * whiteKeyWidth;
  const highlightSet = new Set(highlightNotes ?? []);

  return (
    <div style={{ overflowX: "auto", maxWidth: "100%", padding: "0 4px" }}>
      <div style={{ position: "relative", width: totalWidth, height: whiteKeyHeight }}>
        {/* White keys */}
        {whites.map((note, i) => {
          const isSelected = note === selectedNote;
          const isHighlight = highlightSet.has(note);
          return (
            <button
              key={note}
              onClick={() => onSelect?.(note)}
              disabled={disabled}
              style={{
                position: "absolute",
                left: i * whiteKeyWidth,
                top: 0,
                width: whiteKeyWidth - 2,
                height: whiteKeyHeight,
                borderRadius: "0 0 6px 6px",
                backgroundColor: isSelected ? "#a5b4fc" : isHighlight ? "#fef3c7" : "white",
                border: `2px solid ${isSelected ? "#574eb1" : isHighlight ? "#f59e0b" : "#ccc"}`,
                cursor: disabled ? "default" : "pointer",
                display: "flex",
                alignItems: "flex-end",
                justifyContent: "center",
                paddingBottom: 4,
              }}
            >
              <span style={{ fontSize: 9, fontFamily: "'Nunito', sans-serif", color: "#555", fontWeight: 600 }}>
                {note.replace(/\d$/, "")}
              </span>
            </button>
          );
        })}
        {/* Black keys overlaid */}
        {blacks.map(({ note, left }) => {
          const isSelected = note === selectedNote;
          const isHighlight = highlightSet.has(note);
          return (
            <button
              key={note}
              onClick={() => onSelect?.(note)}
              disabled={disabled}
              style={{
                position: "absolute",
                left,
                top: 0,
                width: Math.round(whiteKeyWidth * 0.7),
                height: Math.round(whiteKeyHeight * 0.62),
                borderRadius: "0 0 5px 5px",
                backgroundColor: isSelected ? "#7c6df0" : isHighlight ? "#b45309" : "#1a1a1a",
                border: `2px solid ${isSelected ? "#a5b4fc" : isHighlight ? "#f59e0b" : "#000"}`,
                cursor: disabled ? "default" : "pointer",
                zIndex: 2,
                display: "flex",
                alignItems: "flex-end",
                justifyContent: "center",
                paddingBottom: 3,
              }}
            >
              <span style={{ fontSize: 8, fontFamily: "'Nunito', sans-serif", color: "#eee", fontWeight: 600 }}>
                {note.replace(/\d$/, "")}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
