"use client";

import type { NoteSymbol } from "@/types/music";

export const NOTE_BEATS: Record<NoteSymbol, number> = {
  whole_note: 4,
  half_note: 2,
  quarter_note: 1,
  eighth_note: 0.5,
  whole_rest: 4,
  half_rest: 2,
  quarter_rest: 1,
};

export const NOTE_SYMBOL_NAME: Record<NoteSymbol, string> = {
  whole_note: "Whole note",
  half_note: "Half note",
  quarter_note: "Quarter note",
  eighth_note: "Eighth note",
  whole_rest: "Whole rest",
  half_rest: "Half rest",
  quarter_rest: "Quarter rest",
};

interface Props {
  symbol: NoteSymbol;
  size?: number;
  color?: string;
}

export function NoteSymbolSVG({ symbol, size = 110, color = "white" }: Props) {
  const dimLine = "rgba(255,255,255,0.2)";
  const w = size;
  const h = Math.round(size * 0.88);

  switch (symbol) {
    case "whole_note":
      return (
        <svg viewBox="0 0 100 80" width={w} height={h}>
          <ellipse cx="50" cy="42" rx="30" ry="20" fill="none" stroke={color} strokeWidth="5" />
        </svg>
      );
    case "half_note":
      return (
        <svg viewBox="0 0 80 110" width={Math.round(w * 0.73)} height={Math.round(w * 1)}>
          <ellipse cx="36" cy="80" rx="22" ry="15" fill="none" stroke={color} strokeWidth="4.5" />
          <line x1="58" y1="78" x2="58" y2="12" stroke={color} strokeWidth="4.5" strokeLinecap="round" />
        </svg>
      );
    case "quarter_note":
      return (
        <svg viewBox="0 0 80 110" width={Math.round(w * 0.73)} height={Math.round(w * 1)}>
          <ellipse cx="36" cy="80" rx="22" ry="15" fill={color} />
          <line x1="58" y1="78" x2="58" y2="12" stroke={color} strokeWidth="4.5" strokeLinecap="round" />
        </svg>
      );
    case "eighth_note":
      return (
        <svg viewBox="0 0 90 110" width={Math.round(w * 0.82)} height={Math.round(w * 1)}>
          <ellipse cx="36" cy="80" rx="22" ry="15" fill={color} />
          <line x1="58" y1="78" x2="58" y2="12" stroke={color} strokeWidth="4.5" strokeLinecap="round" />
          <path d="M58 12 C80 22 80 54 58 60" fill="none" stroke={color} strokeWidth="4.5" strokeLinecap="round" />
        </svg>
      );
    case "whole_rest":
      return (
        <svg viewBox="0 0 100 80" width={w} height={h}>
          <line x1="12" y1="36" x2="88" y2="36" stroke={dimLine} strokeWidth="1.5" />
          <rect x="26" y="36" width="48" height="18" rx="2" fill={color} />
        </svg>
      );
    case "half_rest":
      return (
        <svg viewBox="0 0 100 80" width={w} height={h}>
          <line x1="12" y1="54" x2="88" y2="54" stroke={dimLine} strokeWidth="1.5" />
          <rect x="26" y="36" width="48" height="18" rx="2" fill={color} />
        </svg>
      );
    case "quarter_rest":
      return (
        <svg viewBox="0 0 80 110" width={Math.round(w * 0.73)} height={Math.round(w * 1)}>
          <path
            d="M44 8 L30 28 L50 42 L28 58 L48 70 L32 90"
            stroke={color} strokeWidth="5" fill="none"
            strokeLinecap="round" strokeLinejoin="round"
          />
        </svg>
      );
  }
}
