"use client";

import StageNode from "./StageNode";
import type { Stage } from "@/types/lesson";

// Wide zigzag to fill the center column
const OFFSETS = [80, -80, 30, 110, -30, -110, 50, -50];

export default function StagePath({ stages }: { stages: Stage[] }) {
  const firstActiveIdx = stages.findIndex((s) => s.status === "available");

  return (
    <div className="flex flex-col items-center gap-10 py-4 w-full relative">
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
