"use client";

import { useEffect, useRef } from "react";

interface Props {
  vexKey: string;          // e.g. "c/4", "f#/5"
  width?: number;
  height?: number;
  // Optional override label below the staff (otherwise none).
  label?: string;
}

// Renders a single note on a treble-clef staff using VexFlow.
// The library mutates a DOM node, so we mount inside a ref'd div and
// rebuild on every prop change. VexFlow is pulled in dynamically so it
// doesn't end up in the SSR bundle.
export function StaffRenderer({ vexKey, width = 280, height = 130, label }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    const el = containerRef.current;
    if (!el) return;

    (async () => {
      const vf = await import("vexflow");
      if (cancelled || !containerRef.current) return;
      const { Renderer, Stave, StaveNote, Voice, Formatter, Accidental } = vf;

      // VexFlow's font entry fires the Bravura FontFace load but does not await
      // it, and glyph widths (which decide where the stem attaches) are measured
      // via canvas measureText. If we draw before Bravura is ready, the notehead
      // is measured against the fallback font, so the stem lands at the wrong x
      // and renders detached from the head. Wait for the font before drawing —
      // this only actually blocks on the first staff of a session.
      if (typeof document !== "undefined" && document.fonts) {
        try {
          await document.fonts.load('30pt "Bravura"');
          await document.fonts.ready;
        } catch {
          /* fall through and draw anyway */
        }
        if (cancelled || !containerRef.current) return;
      }

      // Clear any previous render
      el.innerHTML = "";

      const renderer = new Renderer(el, Renderer.Backends.SVG);
      renderer.resize(width, height);
      const ctx = renderer.getContext();
      ctx.setFillStyle("#e0e0ff");
      ctx.setStrokeStyle("#e0e0ff");

      const stave = new Stave(10, 20, width - 20);
      stave.addClef("treble");
      stave.setContext(ctx).draw();

      const isSharp = vexKey.includes("#");
      const note = new StaveNote({
        keys: [vexKey],
        duration: "q",
      });
      // The context fill/stroke above only covers the stave and clef; the
      // note and its stem carry their own styles and default to black.
      note.setStyle({ fillStyle: "#e0e0ff", strokeStyle: "#e0e0ff" });
      note.setStemStyle({ fillStyle: "#e0e0ff", strokeStyle: "#e0e0ff" });
      if (isSharp) note.addModifier(new Accidental("#"), 0);

      const voice = new Voice({ numBeats: 1, beatValue: 4 }).addTickables([note]);
      new Formatter().joinVoices([voice]).format([voice], width - 80);
      voice.draw(ctx, stave);
    })();

    return () => { cancelled = true; };
  }, [vexKey, width, height]);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
      <div ref={containerRef} style={{ width, height }} />
      {label && (
        <span style={{ color: "var(--c-muted)", fontSize: 11, fontFamily: "'Nunito', sans-serif" }}>
          {label}
        </span>
      )}
    </div>
  );
}
