"use client";

import StageNode from "./StageNode";
import type { Stage } from "@/types/lesson";

export default function StagePath({ stages }: { stages: Stage[] }) {
  return (
    <div className="flex flex-col items-center gap-2 py-8 px-4">
      {stages.map((stage, i) => (
        <StageNode key={stage.id} stage={stage} index={i} />
      ))}
    </div>
  );
}
