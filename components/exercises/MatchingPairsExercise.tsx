"use client";

import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import type { MatchingPairsConfig } from "@/types/music";
import type { Difficulty } from "@/lib/curriculum/content";
import type { ExerciseResult } from "./ExerciseEngine";

interface Props {
  config: MatchingPairsConfig;
  difficulty: Difficulty;
  submitted: boolean;
  onAnswerChange: (hasAnswer: boolean) => void;
  onComplete: (result: ExerciseResult) => void;
}

const C = {
  primary: "#574eb1", primaryDark: "#41379b",
  surfaceHigh: "var(--c-surface-high)", border: "var(--c-border)", muted: "var(--c-muted)",
  text: "var(--c-text)", success: "#006c4e",
};

interface Tile {
  id: number;
  note: string;
  matched: boolean;
}

// Deterministic shuffle for tile placement so re-renders don't reshuffle.
function buildTiles(notes: string[]): Tile[] {
  const out: Tile[] = [];
  notes.forEach((n, i) => {
    out.push({ id: i * 2, note: n, matched: false });
    out.push({ id: i * 2 + 1, note: n, matched: false });
  });
  // Fisher-Yates with a fixed seed derived from notes content
  let s = notes.join("|").length * 9301 + 49297;
  const rng = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function MatchingPairsExercise({ config, submitted, onAnswerChange, onComplete }: Props) {
  const [tiles, setTiles] = useState<Tile[]>(() => buildTiles(config.notes));
  const [revealed, setRevealed] = useState<number[]>([]); // tile ids currently shown
  const synthRef = useRef<unknown>(null);

  useEffect(() => {
    return () => {
      (synthRef.current as { dispose?: () => void } | null)?.dispose?.();
    };
  }, []);

  const allMatched = useMemo(() => tiles.every((t) => t.matched), [tiles]);

  useEffect(() => { onAnswerChange(allMatched); }, [allMatched, onAnswerChange]);

  const play = useCallback(async (note: string) => {
    try {
      const Tone = await import("tone");
      await Tone.start();
      if (!synthRef.current) {
        synthRef.current = new Tone.Synth({ oscillator: { type: "triangle" } }).toDestination();
      }
      const synth = synthRef.current as InstanceType<typeof Tone.Synth>;
      synth.triggerAttackRelease(note, "0.5");
    } catch {}
  }, []);

  const tapTile = (tile: Tile) => {
    if (submitted || tile.matched) return;
    if (revealed.includes(tile.id)) return;
    play(tile.note);
    const next = [...revealed, tile.id];
    setRevealed(next);
    if (next.length === 2) {
      const [a, b] = next.map((id) => tiles.find((t) => t.id === id)!);
      if (a.note === b.note) {
        setTimeout(() => {
          setTiles((prev) => prev.map((t) => (t.id === a.id || t.id === b.id ? { ...t, matched: true } : t)));
          setRevealed([]);
        }, 500);
      } else {
        setTimeout(() => setRevealed([]), 800);
      }
    }
  };

  useEffect(() => {
    if (!submitted) return;
    const passed = allMatched;
    onComplete({ score: passed ? 100 : Math.round((tiles.filter((t) => t.matched).length / tiles.length) * 100), passed, correctAnswerText: "All pairs matched" });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submitted]);

  const cols = tiles.length <= 4 ? 2 : tiles.length <= 6 ? 3 : 4;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
      <p style={{ color: C.text, fontFamily: "'Nunito', sans-serif", fontSize: 22, fontWeight: 800, margin: 0, textAlign: "center" }}>
        Match the pairs by sound
      </p>

      <div style={{
        display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gap: 10, width: "100%", maxWidth: 400,
      }}>
        {tiles.map((tile) => {
          const isShown = revealed.includes(tile.id) || tile.matched;
          return (
            <button
              key={tile.id}
              onClick={() => tapTile(tile)}
              disabled={submitted || tile.matched}
              style={{
                aspectRatio: "1", borderRadius: 12,
                backgroundColor: tile.matched ? C.success : isShown ? C.primaryDark : C.surfaceHigh,
                border: `2px solid ${tile.matched ? "#4ade80" : isShown ? C.primary : C.border}`,
                color: "white",
                fontFamily: "'Nunito', sans-serif", fontSize: 22, fontWeight: 900,
                cursor: submitted || tile.matched ? "default" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "background-color 0.2s",
              }}
            >
              {isShown ? tile.note.replace(/\d$/, "") : (
                <span className="material-symbols-outlined" style={{ fontSize: 28, color: C.muted }}>music_note</span>
              )}
            </button>
          );
        })}
      </div>

      <span style={{ color: C.muted, fontFamily: "'Nunito', sans-serif", fontSize: 12 }}>
        Tap a tile to hear its note. Match two tiles with the same sound.
      </span>
    </div>
  );
}
