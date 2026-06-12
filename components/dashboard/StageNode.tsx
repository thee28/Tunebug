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
  secondary: "#006c4e",
  secondaryDark: "#00513a",
  secondaryDim: "#83f5c6",
  surfaceHigh: "var(--c-surface-high)",
  border: "var(--c-border)",
  muted: "var(--c-muted)",
};

export default function StageNode({ stage, index, xOffset, isFirstActive }: Props) {
  const isLocked = stage.status === "locked";
  const isComplete = stage.status === "complete";
  const isAvailable = stage.status === "available";
  const isActive = isAvailable && isFirstActive;

  const size = isActive ? 90 : 70;

  const bg = isComplete ? C.secondary : isAvailable ? C.primary : C.surfaceHigh;

  // Multi-layer box-shadow for active node:
  // layer 1: coin bottom arc (darker color, 9px below)
  // layer 2: outer ring around face circle (0 offset, 11px spread)
  // layer 3: outer ring around coin bottom (9px offset, 11px spread)
  // Layers 2+3 together form a continuous ring around the entire coin shape.
  let coinDepth: string;
  if (isActive) {
    coinDepth = `0 9px 0 0 ${C.primaryDark}, 0 0 0 10px var(--c-dark), 0 9px 0 10px var(--c-dark)`;
  } else if (isComplete) {
    coinDepth = `0 9px 0 0 ${C.secondaryDark}`;
  } else if (isAvailable) {
    coinDepth = `0 9px 0 0 ${C.primaryDark}`;
  } else {
    coinDepth = `0 7px 0 0 rgba(0,0,0,0.55)`;
  }

  const iconColor = isComplete ? C.secondaryDim : isLocked ? C.muted : "white";
  const icon = isComplete ? "check" : isAvailable ? "star" : "lock";

  const button = (
    <div
      className={isLocked ? "" : "node-press"}
      onClick={isLocked ? undefined : () => (window.location.href = `/stages/${stage.slug}`)}
      style={{
        width: size * 1.15,
        height: size,
        borderRadius: "50%",
        backgroundColor: bg,
        boxShadow: coinDepth,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        opacity: isLocked ? 0.45 : 1,
        cursor: isLocked ? "not-allowed" : "pointer",
        flexShrink: 0,
      }}
    >
      <span
        className="material-symbols-outlined"
        style={{
          fontSize: isActive ? 46 : 34,
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
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.75 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.08, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="relative flex items-start"
      style={{ transform: `translateX(${xOffset}px)` }}
    >
      {/* START chip */}
      {isActive && (
        <div className="absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap z-10">
          <div
            className="px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-widest"
            style={{ backgroundColor: C.border, color: "var(--c-text)", fontFamily: "'Nunito', sans-serif" }}
          >
            START
          </div>
        </div>
      )}

      {/* Title tooltip — active node (left) */}
      {isActive && (
        <div
          className="absolute -left-40 top-1/2 -translate-y-1/2 px-4 py-2 rounded-xl whitespace-nowrap hidden sm:block"
          style={{
            backgroundColor: C.primary,
            color: "white",
            boxShadow: `0 4px 0 0 ${C.primaryDark}`,
            fontFamily: "'Nunito', sans-serif",
            fontSize: "13px",
            fontWeight: 700,
          }}
        >
          {stage.title}
        </div>
      )}

      {/* Title label — non-active */}
      {!isActive && (
        <div
          className="absolute -right-24 top-1/2 -translate-y-1/2 px-2 py-1 rounded-lg text-xs font-semibold hidden sm:block"
          style={{
            backgroundColor: C.surfaceHigh,
            border: `2px solid ${C.border}`,
            color: isComplete ? C.secondaryDim : C.muted,
            fontFamily: "'Nunito', sans-serif",
            whiteSpace: "nowrap",
            maxWidth: "88px",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {stage.title}
        </div>
      )}

      {button}
    </motion.div>
  );
}
