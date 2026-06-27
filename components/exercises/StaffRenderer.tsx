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
