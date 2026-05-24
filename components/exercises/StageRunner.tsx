"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type { Stage, Lesson } from "@/types/lesson";
import type { Difficulty } from "@/lib/curriculum/content";
import { LessonRunner } from "./LessonRunner";

interface Props {
  stage: Stage;
  difficulty: Difficulty;
}

const C = {
  primary: "#574eb1", primaryDark: "#41379b",
  secondary: "#006c4e", secondaryDark: "#00513a", secondaryDim: "#83f5c6",
  surface: "#141321", surfaceHigh: "#211F26",
  border: "#33313D", muted: "#938F99", text: "#f3eff5",
};

export function StageRunner({ stage, difficulty }: Props) {
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [completedIds, setCompletedIds] = useState<Set<string>>(
    new Set(stage.lessons.filter((l) => l.passed).map((l) => l.id))
  );

  if (activeLesson) {
    return (
      <LessonRunner
        title={activeLesson.title}
        exercises={[{ type: activeLesson.exerciseType, config: activeLesson.exerciseConfig }]}
        difficulty={difficulty}
        xpReward={activeLesson.xpReward}
        onComplete={async (score) => {
          await fetch("/api/progress", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ lessonId: activeLesson.id, score }),
          });
          if (score >= activeLesson.passingScore) {
            setCompletedIds((prev) => new Set([...prev, activeLesson.id]));
          }
        }}
        onExit={() => setActiveLesson(null)}
      />
    );
  }

  const allComplete = stage.lessons.every((l) => completedIds.has(l.id));

  return (
    <div style={{ minHeight: "100vh", backgroundColor: C.surface, padding: "0 0 48px" }}>
      {/* Header */}
      <div style={{ padding: "20px 20px 0" }}>
        <a href="/dashboard" style={{ display: "inline-flex", alignItems: "center", gap: 6, color: C.muted, textDecoration: "none", fontFamily: "'Nunito', sans-serif", fontSize: 14 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_back</span>
          Back
        </a>
      </div>

      <div style={{ maxWidth: 480, margin: "0 auto", padding: "32px 20px 0" }}>
        {/* Stage title */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>{stage.icon}</div>
          <h1 style={{ color: C.text, fontFamily: "'Nunito', sans-serif", fontSize: 28, fontWeight: 900, margin: "0 0 8px" }}>
            {stage.title}
          </h1>
          <p style={{ color: C.muted, fontFamily: "'Nunito', sans-serif", fontSize: 15, margin: 0 }}>
            {stage.description}
          </p>
          {allComplete && (
            <div style={{
              marginTop: 12, display: "inline-flex", alignItems: "center", gap: 6,
              padding: "6px 16px", borderRadius: 20,
              backgroundColor: C.secondary, color: C.secondaryDim,
              fontFamily: "'Nunito', sans-serif", fontSize: 13, fontWeight: 700,
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: 16, fontVariationSettings: "'FILL' 1" }}>check_circle</span>
              Stage Complete
            </div>
          )}
        </div>

        {/* Lesson list */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {stage.lessons.map((lesson, i) => {
            const isDone = completedIds.has(lesson.id);
            const isUnlocked = lesson.unlocked ?? false;
            const isLocked = !isUnlocked;

            return (
              <motion.div
                key={lesson.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07, duration: 0.3 }}
              >
                <button
                  onClick={() => !isLocked && setActiveLesson(lesson)}
                  disabled={isLocked}
                  style={{
                    width: "100%", padding: "16px 20px", borderRadius: 16,
                    backgroundColor: C.surfaceHigh,
                    border: `2px solid ${isDone ? C.secondary : isUnlocked ? C.border : C.border}`,
                    display: "flex", alignItems: "center", gap: 16,
                    cursor: isLocked ? "not-allowed" : "pointer",
                    opacity: isLocked ? 0.5 : 1,
                    textAlign: "left",
                  }}
                >
                  {/* Icon */}
                  <div style={{
                    width: 44, height: 44, borderRadius: "50%", flexShrink: 0,
                    backgroundColor: isDone ? C.secondary : isUnlocked ? C.primary : "#2a2838",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <span className="material-symbols-outlined" style={{
                      fontSize: 22, color: isDone ? C.secondaryDim : "white",
                      fontVariationSettings: isDone ? "'FILL' 1" : "'FILL' 0",
                    }}>
                      {isDone ? "check" : isLocked ? "lock" : EXERCISE_ICONS[lesson.exerciseType] ?? "music_note"}
                    </span>
                  </div>

                  {/* Text */}
                  <div style={{ flex: 1 }}>
                    <p style={{ color: C.text, fontFamily: "'Nunito', sans-serif", fontWeight: 700, fontSize: 15, margin: "0 0 2px" }}>
                      {lesson.title}
                    </p>
                    <p style={{ color: C.muted, fontFamily: "'Nunito', sans-serif", fontSize: 12, margin: 0 }}>
                      {EXERCISE_LABELS[lesson.exerciseType]} · {lesson.xpReward} XP
                    </p>
                  </div>

                  {/* Arrow */}
                  {!isLocked && (
                    <span className="material-symbols-outlined" style={{ color: C.muted, fontSize: 20 }}>
                      {isDone ? "replay" : "chevron_right"}
                    </span>
                  )}
                </button>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const EXERCISE_ICONS: Record<string, string> = {
  EAR_SINGLE: "hearing",
  EAR_MULTI: "queue_music",
  INTERVAL_ID: "piano",
  PITCH_MATCH: "mic",
  SIGHT_READ_PIANO: "music_note",
};

const EXERCISE_LABELS: Record<string, string> = {
  EAR_SINGLE: "Ear Training",
  EAR_MULTI: "Chord Ear Training",
  INTERVAL_ID: "Interval ID",
  PITCH_MATCH: "Pitch Matching",
  SIGHT_READ_PIANO: "Sight Reading",
};
