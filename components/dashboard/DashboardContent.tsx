"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import LessonPath from "./LessonPath";
import SectionList from "./SectionList";
import type { Stage } from "@/types/lesson";
import type { Difficulty } from "@/lib/curriculum/content";

const C = {
  muted: "#938F99",
  text: "#f3eff5",
  dark: "#0F0F13",
  border: "#33313D",
};

interface Props {
  stages: Stage[];
  difficulties: Record<string, Difficulty>;
}

export default function DashboardContent({ stages, difficulties }: Props) {
  const [showSections, setShowSections] = useState(false);

  return (
    <div style={{ width: "100%", maxWidth: 560 }}>
      <AnimatePresence mode="wait" initial={false}>
        {showSections ? (
          <motion.div
            key="sections"
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.18 }}
          >
            {/* Sticky back button */}
            <div style={{
              position: "sticky", top: 56, zIndex: 10,
              backgroundColor: C.dark,
              paddingTop: 20, paddingBottom: 0,
              marginBottom: 20,
            }}>
              <button
                onClick={() => setShowSections(false)}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  background: "none", border: "none", cursor: "pointer",
                  color: C.muted, fontFamily: "'Nunito', sans-serif",
                  fontSize: 14, fontWeight: 700,
                  padding: "0 0 14px",
                  width: "100%",
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>arrow_back</span>
                Back
              </button>
              <div style={{ height: 1, backgroundColor: C.border }} />
            </div>

            <h1
              style={{
                color: C.text, fontFamily: "'Nunito', sans-serif",
                fontSize: 20, fontWeight: 900, margin: "0 0 16px",
              }}
            >
              All Sections
            </h1>

            <SectionList stages={stages} onBack={() => setShowSections(false)} />
          </motion.div>
        ) : (
          <motion.div
            key="path"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            style={{ width: "100%" }}
          >
            <LessonPath
              stages={stages}
              difficulties={difficulties}
              onShowSections={() => setShowSections(true)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
