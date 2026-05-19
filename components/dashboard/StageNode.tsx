"use client";

import { motion } from "framer-motion";
import type { Stage } from "@/types/lesson";

interface Props {
  stage: Stage;
  index: number;
  xOffset: number;
  isFirstActive: boolean;
}

const C = {
  primary: "#574eb1",
  primaryDark: "#41379b",
  primaryDim: "#c5c0ff",
  secondary: "#006c4e",
  secondaryDark: "#00513a",
  secondaryDim: "#83f5c6",
  surfaceHigh: "#211F26",
  border: "#33313D",
  muted: "#938F99",
};

export default function StageNode({ stage, index, xOffset, isFirstActive }: Props) {
  const isLocked = stage.status === "locked";
  const isComplete = stage.status === "complete";
  const isAvailable = stage.status === "available";
  const isActive = isAvailable && isFirstActive;

  const size = isActive ? 88 : 72;
  const bg = isComplete ? C.secondary : isAvailable ? C.primary : C.surfaceHigh;
  const borderBottom = isComplete
    ? `6px solid ${C.secondaryDark}`
    : isAvailable
    ? `6px solid ${C.primaryDark}`
    : `4px solid #0A0A0E`;
  const iconColor = isComplete ? C.secondaryDim : isLocked ? C.muted : "white";
  const icon = isComplete ? "check" : isAvailable ? (stage.icon ?? "play_arrow") : "lock";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.75 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.08, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="relative"
      style={{ transform: `translateX(${xOffset}px)` }}
    >
      {/* "START" chip above first active */}
      {isActive && (
        <div className="absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap">
          <div
            className="px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-widest"
            style={{
              backgroundColor: C.border,
              color: "#f3eff5",
              fontFamily: "'Nunito', sans-serif",
            }}
          >
            START
          </div>
        </div>
      )}

      {/* Stage title tooltip — active node (left) */}
      {isActive && (
        <div
          className="absolute -left-40 top-1/2 -translate-y-1/2 px-4 py-2 rounded-xl whitespace-nowrap hidden sm:block"
          style={{
            backgroundColor: C.primary,
            color: "white",
            borderBottom: `4px solid ${C.primaryDark}`,
            fontFamily: "'Nunito', sans-serif",
            fontSize: "13px",
            fontWeight: 700,
          }}
        >
          {stage.title}
        </div>
      )}

      {/* Stage title label — non-active nodes (right) */}
      {!isActive && (
        <div
          className="absolute -right-24 top-1/2 -translate-y-1/2 px-2 py-1 rounded-lg text-xs font-semibold hidden sm:block"
          style={{
            backgroundColor: C.surfaceHigh,
            border: `2px solid ${C.border}`,
            color: isComplete ? C.secondaryDim : C.muted,
            fontFamily: "'Nunito', sans-serif",
            whiteSpace: "nowrap",
            maxWidth: "80px",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {stage.title}
        </div>
      )}

      {/* Circle node */}
      <motion.div
        whileHover={isLocked ? {} : { y: -4 }}
        whileTap={isLocked ? {} : { y: 4, scale: 0.95 }}
        transition={{ duration: 0.1 }}
        onClick={isLocked ? undefined : () => (window.location.href = `/stages/${stage.slug}`)}
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          backgroundColor: bg,
          borderBottom,
          boxShadow: isActive ? `0 0 0 10px rgba(87,78,177,0.18)` : "none",
          opacity: isLocked ? 0.5 : 1,
          cursor: isLocked ? "not-allowed" : "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span
          className="material-symbols-outlined"
          style={{
            fontSize: isActive ? 40 : 30,
            color: iconColor,
            fontVariationSettings: isComplete
              ? "'FILL' 1, 'wght' 700"
              : isAvailable
              ? "'FILL' 1"
              : "'FILL' 0",
          }}
        >
          {icon}
        </span>
      </motion.div>
    </motion.div>
  );
}
