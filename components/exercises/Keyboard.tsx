"use client";

import { useMemo } from "react";

interface Props {
  octaveRange: [number, number];
  /** When set, the keyboard only shows the octave(s) containing these notes,
   *  so it fits on screen without horizontal scrolling. */
  focusNotes?: string[];
  selectedNote?: string | null;
  highlightNotes?: string[];   // optional secondary highlight (e.g. answer key)
  disabled?: boolean;
  onSelect?: (note: string) => void;
  maxWhiteKeyWidth?: number;
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
  focusNotes,
  selectedNote,
  highlightNotes,
  disabled,
  onSelect,
  maxWhiteKeyWidth = 72,
  whiteKeyHeight = 160,
}: Props) {
  // Narrow the visible range to the octaves the exercise actually needs,
  // so the whole keyboard fits without scrolling.
  const visibleRange = useMemo<[number, number]>(() => {
    const octs = (focusNotes ?? [])
      .map((n) => parseInt(n.slice(-1), 10))
      .filter((o) => !Number.isNaN(o));
    if (octs.length === 0) return octaveRange;
    return [Math.min(...octs), Math.max(...octs)];
  }, [focusNotes, octaveRange]);

  const whites = useMemo(() => {
    const out: string[] = [];
    for (let oct = visibleRange[0]; oct <= visibleRange[1]; oct++) {
      for (const letter of WHITE_LETTERS) out.push(`${letter}${oct}`);
    }
    return out;
  }, [visibleRange]);

  const keyPct = 100 / whites.length;

  const blacks = useMemo(() => {
    const out: { note: string; leftPct: number }[] = [];
    for (let oct = visibleRange[0]; oct <= visibleRange[1]; oct++) {
      const octWhiteStart = (oct - visibleRange[0]) * 7;
      for (const { name, afterWhiteIdx } of BLACK_KEYS) {
        const note = `${name}${oct}`;
        // Black key sits centered on the boundary between whites afterWhiteIdx and afterWhiteIdx+1.
        const leftPct = (octWhiteStart + afterWhiteIdx + 1 - 0.35) * keyPct;
        out.push({ note, leftPct });
      }
    }
    return out;
  }, [visibleRange, keyPct]);

  const highlightSet = new Set(highlightNotes ?? []);

  return (
    <div style={{ width: "100%", maxWidth: whites.length * maxWhiteKeyWidth, padding: "0 4px" }}>
      <div style={{ position: "relative", width: "100%", height: whiteKeyHeight }}>
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
                left: `${i * keyPct}%`,
                top: 0,
                width: `calc(${keyPct}% - 2px)`,
                height: whiteKeyHeight,
                borderRadius: "0 0 8px 8px",
                backgroundColor: isSelected ? "#a5b4fc" : isHighlight ? "#fef3c7" : "white",
                border: `2px solid ${isSelected ? "#574eb1" : isHighlight ? "#f59e0b" : "#ccc"}`,
                cursor: disabled ? "default" : "pointer",
                display: "flex",
                alignItems: "flex-end",
                justifyContent: "center",
                paddingBottom: 6,
              }}
            >
              <span style={{ fontSize: 13, fontFamily: "'Nunito', sans-serif", color: "#555", fontWeight: 600 }}>
                {note.replace(/\d$/, "")}
              </span>
            </button>
          );
        })}
        {/* Black keys overlaid */}
        {blacks.map(({ note, leftPct }) => {
          const isSelected = note === selectedNote;
          const isHighlight = highlightSet.has(note);
          return (
            <button
              key={note}
              onClick={() => onSelect?.(note)}
              disabled={disabled}
              style={{
                position: "absolute",
                left: `${leftPct}%`,
                top: 0,
                width: `${keyPct * 0.7}%`,
                height: Math.round(whiteKeyHeight * 0.62),
                borderRadius: "0 0 6px 6px",
                backgroundColor: isSelected ? "#7c6df0" : isHighlight ? "#b45309" : "#1a1a1a",
                border: `2px solid ${isSelected ? "#a5b4fc" : isHighlight ? "#f59e0b" : "#000"}`,
                cursor: disabled ? "default" : "pointer",
                zIndex: 2,
                display: "flex",
                alignItems: "flex-end",
                justifyContent: "center",
                paddingBottom: 4,
              }}
            >
              <span style={{ fontSize: 11, fontFamily: "'Nunito', sans-serif", color: "#eee", fontWeight: 600 }}>
                {note.replace(/\d$/, "")}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
