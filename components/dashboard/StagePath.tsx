"use client";

import StageNode from "./StageNode";
import type { Stage } from "@/types/lesson";

// Gentle zigzag mirroring Duolingo's snake path
const OFFSETS = [32, -40, 8, 56, -8, -48, 24, -24];

export default function StagePath({ stages }: { stages: Stage[] }) {
  const firstActiveIdx = stages.findIndex((s) => s.status === "available");

  return (
    <div className="flex flex-col items-center gap-10 py-4 w-full max-w-lg relative">
      {stages.map((stage, i) => (
        <StageNode
          key={stage.id}
          stage={stage}
          index={i}
          xOffset={OFFSETS[i % OFFSETS.length]}
          isFirstActive={i === firstActiveIdx}
        />
      ))}
    </div>
  );
}
