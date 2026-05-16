"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import type { Stage } from "@/types/lesson";

const STAGE_COLORS = {
  0: { bg: "#4F46E5", border: "#3730A3", shadow: "#3730A3" },
  1: { bg: "#7C3AED", border: "#5B21B6", shadow: "#5B21B6" },
  2: { bg: "#DB2777", border: "#9D174D", shadow: "#9D174D" },
  3: { bg: "#D97706", border: "#92400E", shadow: "#92400E" },
  4: { bg: "#059669", border: "#065F46", shadow: "#065F46" },
};

interface Props {
  stage: Stage;
  index: number;
}

export default function StageNode({ stage, index }: Props) {
  const color = STAGE_COLORS[index as keyof typeof STAGE_COLORS] ?? STAGE_COLORS[0];
  const isLocked = stage.status === "locked";
  const isComplete = stage.status === "complete";
  const total = stage.lessons.length;
  const done = stage.completedLessons ?? 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.12, duration: 0.4, ease: "easeOut" }}
      className="flex flex-col items-center"
    >
      {/* Connector line above (except first) */}
      {index > 0 && (
        <div
          className="w-1 h-8 rounded-full mb-1"
          style={{ backgroundColor: isLocked ? "#D1D5DB" : color.bg, opacity: isLocked ? 0.4 : 0.6 }}
        />
      )}

      <Link
        href={isLocked ? "#" : `/stages/${stage.slug}`}
        aria-disabled={isLocked}
        className={`flex flex-col items-center gap-3 p-5 rounded-3xl w-64 transition-all duration-200 ${
          isLocked
            ? "cursor-not-allowed"
            : "cursor-pointer hover:-translate-y-1"
        }`}
        style={{
          backgroundColor: isLocked ? "#F3F4F6" : color.bg,
          border: `3px solid ${isLocked ? "#9CA3AF" : color.border}`,
          boxShadow: isLocked
            ? "0 4px 0 0 #9CA3AF, 0 6px 16px rgba(0,0,0,0.08)"
            : `0 4px 0 0 ${color.shadow}, 0 8px 20px ${color.bg}40`,
        }}
      >
        <div className="flex items-center gap-2 w-full">
          <span className="text-3xl" aria-hidden>
            {isLocked ? "🔒" : isComplete ? "✅" : stage.icon ?? "🎵"}
          </span>
          <div className="flex flex-col flex-1 min-w-0">
            <span
              className="font-extrabold text-base truncate"
              style={{
                fontFamily: "'Baloo 2', sans-serif",
                color: isLocked ? "#9CA3AF" : "#FFFFFF",
              }}
            >
              {stage.title}
            </span>
            <span
              className="text-xs font-medium truncate"
              style={{ color: isLocked ? "#D1D5DB" : `${color.bg === "#4F46E5" ? "#C7D2FE" : "#FDE68A"}` }}
            >
              {isLocked ? "Complete previous stage" : isComplete ? "Complete!" : stage.description}
            </span>
          </div>
        </div>

        {/* Progress bar */}
        {!isLocked && (
          <div className="w-full">
            <div className="w-full h-3 rounded-full bg-white/30">
              <div
                className="h-3 rounded-full bg-white transition-all duration-500"
                style={{ width: `${total > 0 ? (done / total) * 100 : 0}%` }}
              />
            </div>
            <p className="text-xs text-white/80 font-semibold mt-1 text-right">
              {done}/{total} lessons
            </p>
          </div>
        )}
      </Link>
    </motion.div>
  );
}
