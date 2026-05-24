"use client";

import { motion } from "framer-motion";
import type { Stage } from "@/types/lesson";

const C = {
  primary: "#574eb1", primaryDark: "#41379b", primaryDim: "#c5c0ff",
  secondary: "#006c4e", secondaryDark: "#00513a", secondaryDim: "#83f5c6",
  surfaceHigh: "#211F26", border: "#33313D", muted: "#938F99", text: "#f3eff5",
};

const SECTION_ICONS = ["school", "menu_book", "library_music", "piano", "workspace_premium"];

export default function SectionList({ stages }: { stages: Stage[] }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, width: "100%", maxWidth: 560 }}>
      {stages.map((stage, i) => {
        const isComplete = stage.status === "complete";
        const isLocked = stage.status === "locked";
        const isActive = stage.status === "available";
        const pct =
          (stage.totalLessons ?? 0) > 0
            ? ((stage.completedLessons ?? 0) / (stage.totalLessons ?? 1)) * 100
            : 0;

        return (
          <motion.div
            key={stage.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07, duration: 0.3 }}
            style={{
              borderRadius: 20,
              border: `2px solid ${isActive ? C.primary : isComplete ? C.secondary : C.border}`,
              backgroundColor: C.surfaceHigh,
              opacity: isLocked ? 0.5 : 1,
              overflow: "hidden",
            }}
          >
            {/* Card body */}
            <div style={{ padding: "18px 18px 0", display: "flex", gap: 14, alignItems: "flex-start" }}>
              {/* Icon */}
              <div
                style={{
                  width: 52, height: 52, borderRadius: 14, flexShrink: 0,
                  backgroundColor: isComplete ? C.secondary : isActive ? C.primary : "#2a2838",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{
                    fontSize: 24,
                    color: isLocked ? C.muted : isComplete ? C.secondaryDim : "white",
                    fontVariationSettings: "'FILL' 1",
                  }}
                >
                  {isLocked ? "lock" : SECTION_ICONS[i % SECTION_ICONS.length]}
                </span>
              </div>

              {/* Text */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                  <span
                    style={{
                      color: isActive ? C.primaryDim : C.muted,
                      fontFamily: "'Nunito', sans-serif", fontSize: 11, fontWeight: 700,
                      textTransform: "uppercase", letterSpacing: "0.08em",
                    }}
                  >
                    Section {i + 1}
                  </span>
                  {isComplete && (
                    <span style={{ color: C.secondaryDim, fontFamily: "'Nunito', sans-serif", fontSize: 11, fontWeight: 700 }}>
                      · Complete
                    </span>
                  )}
                </div>
                <h3
                  style={{
                    color: C.text, fontFamily: "'Nunito', sans-serif",
                    fontSize: 17, fontWeight: 900, margin: "0 0 3px",
                  }}
                >
                  {stage.title}
                </h3>
                <p
                  style={{
                    color: C.muted, fontFamily: "'Nunito', sans-serif", fontSize: 12,
                    margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}
                >
                  {stage.description}
                </p>
              </div>
            </div>

            {/* Progress bar or unit count */}
            <div style={{ padding: "12px 18px 0" }}>
              {isLocked ? (
                <p style={{ color: C.muted, fontFamily: "'Nunito', sans-serif", fontSize: 12, margin: 0 }}>
                  {stage.units.length} units · {stage.totalLessons ?? 0} lessons
                </p>
              ) : (
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ flex: 1, height: 8, borderRadius: 4, backgroundColor: "#2a2838", overflow: "hidden" }}>
                    <div
                      style={{
                        height: "100%", borderRadius: 4,
                        backgroundColor: isComplete ? C.secondary : C.primary,
                        width: `${pct}%`, transition: "width 0.4s ease",
                      }}
                    />
                  </div>
                  <span style={{ color: C.muted, fontFamily: "'Nunito', sans-serif", fontSize: 11, fontWeight: 700, whiteSpace: "nowrap" }}>
                    {stage.completedLessons ?? 0}/{stage.totalLessons ?? 0}
                  </span>
                </div>
              )}
            </div>

            {/* Action button */}
            <div style={{ padding: "14px 18px 18px" }}>
              {isLocked ? (
                <div
                  style={{
                    width: "100%", padding: "12px 0", borderRadius: 14, textAlign: "center",
                    backgroundColor: "#2a2838", border: `2px solid ${C.border}`,
                    color: C.muted, fontFamily: "'Nunito', sans-serif", fontWeight: 800,
                    fontSize: 13, textTransform: "uppercase", letterSpacing: "0.08em",
                  }}
                >
                  Jump to Section {i + 1}
                </div>
              ) : (
                <a href={`/stages/${stage.slug}`} style={{ display: "block", textDecoration: "none" }}>
                  <div
                    style={{
                      width: "100%", padding: "12px 0", borderRadius: 14, textAlign: "center",
                      backgroundColor: isActive ? C.primary : C.secondary,
                      border: `2px solid ${isActive ? C.primaryDark : C.secondaryDark}`,
                      color: "white", fontFamily: "'Nunito', sans-serif", fontWeight: 800,
                      fontSize: 13, textTransform: "uppercase", letterSpacing: "0.08em",
                      cursor: "pointer",
                    }}
                  >
                    {isComplete ? "Review Section" : "Continue"}
                  </div>
                </a>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
