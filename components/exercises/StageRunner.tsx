"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type { Stage, Unit, Lesson } from "@/types/lesson";
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

type View =
  | { phase: "stage" }
  | { phase: "unit"; unit: Unit }
  | { phase: "exercise"; unit: Unit; lesson: Lesson };

export function StageRunner({ stage, difficulty }: Props) {
  const [view, setView] = useState<View>({ phase: "stage" });
  const [completedIds, setCompletedIds] = useState<Set<string>>(
    new Set(
      stage.units.flatMap((u) => u.lessons).filter((l) => l.passed).map((l) => l.id)
    )
  );

  // ── Exercise view ─────────────────────────
  if (view.phase === "exercise") {
    const { unit, lesson } = view;
    return (
      <LessonRunner
        title={`${stage.title} · ${unit.title}`}
        exercises={[{ type: lesson.exerciseType, config: lesson.exerciseConfig }]}
        difficulty={difficulty}
        xpReward={lesson.xpReward}
        onComplete={async (score) => {
          await fetch("/api/progress", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ lessonId: lesson.id, score }),
          });
          if (score >= lesson.passingScore) {
            setCompletedIds((prev) => new Set([...prev, lesson.id]));
          }
        }}
        onExit={() => setView({ phase: "unit", unit })}
      />
    );
  }

  // ── Unit view (lesson list) ────────────────
  if (view.phase === "unit") {
    const { unit } = view;
    const lessons = unit.lessons.map((lesson, i) => {
      const prevLesson = unit.lessons[i - 1];
      const prevPassed = i === 0 || (prevLesson ? completedIds.has(prevLesson.id) : false);
      const unitUnlocked = unit.status !== "locked";
      return {
        ...lesson,
        unlocked: unitUnlocked && prevPassed,
        passed: completedIds.has(lesson.id),
      };
    });

    return (
      <div style={{ minHeight: "100vh", backgroundColor: C.surface, paddingBottom: 48 }}>
        <div style={{ padding: "20px 20px 0" }}>
          <button
            onClick={() => setView({ phase: "stage" })}
            style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, color: C.muted, fontFamily: "'Nunito', sans-serif", fontSize: 14 }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_back</span>
            {stage.title}
          </button>
        </div>

        <div style={{ maxWidth: 480, margin: "0 auto", padding: "28px 20px 0" }}>
          <div style={{ marginBottom: 36, textAlign: "center" }}>
            <h2 style={{ color: C.text, fontFamily: "'Nunito', sans-serif", fontSize: 24, fontWeight: 900, margin: "0 0 6px" }}>{unit.title}</h2>
            {unit.description && (
              <p style={{ color: C.muted, fontFamily: "'Nunito', sans-serif", fontSize: 14, margin: 0 }}>{unit.description}</p>
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {lessons.map((lesson, i) => {
              const isDone = lesson.passed;
              const isLocked = !lesson.unlocked;
              return (
                <motion.div
                  key={lesson.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06, duration: 0.25 }}
                >
                  <button
                    onClick={() => !isLocked && setView({ phase: "exercise", unit, lesson })}
                    disabled={isLocked}
                    style={{
                      width: "100%", padding: "14px 18px", borderRadius: 14,
                      backgroundColor: C.surfaceHigh,
                      border: `2px solid ${isDone ? C.secondary : isLocked ? C.border : C.border}`,
                      display: "flex", alignItems: "center", gap: 14,
                      cursor: isLocked ? "not-allowed" : "pointer",
                      opacity: isLocked ? 0.45 : 1, textAlign: "left",
                    }}
                  >
                    <div style={{
                      width: 40, height: 40, borderRadius: "50%", flexShrink: 0,
                      backgroundColor: isDone ? C.secondary : isLocked ? "#2a2838" : C.primary,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 20, color: isDone ? C.secondaryDim : "white", fontVariationSettings: isDone ? "'FILL' 1" : "'FILL' 0" }}>
                        {isDone ? "check" : isLocked ? "lock" : EXERCISE_ICONS[lesson.exerciseType] ?? "music_note"}
                      </span>
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ color: C.text, fontFamily: "'Nunito', sans-serif", fontWeight: 700, fontSize: 14, margin: "0 0 2px" }}>{lesson.title}</p>
                      <p style={{ color: C.muted, fontFamily: "'Nunito', sans-serif", fontSize: 12, margin: 0 }}>
                        {EXERCISE_LABELS[lesson.exerciseType]} · {lesson.xpReward} XP
                      </p>
                    </div>
                    {!isLocked && (
                      <span className="material-symbols-outlined" style={{ color: C.muted, fontSize: 18 }}>
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

  // ── Stage view (unit list) ─────────────────
  const allLessons = stage.units.flatMap((u) => u.lessons);
  const total = allLessons.length;
  const done = allLessons.filter((l) => completedIds.has(l.id)).length;

  return (
    <div style={{ minHeight: "100vh", backgroundColor: C.surface, paddingBottom: 48 }}>
      <div style={{ padding: "20px 20px 0" }}>
        <a href="/dashboard" style={{ display: "inline-flex", alignItems: "center", gap: 6, color: C.muted, textDecoration: "none", fontFamily: "'Nunito', sans-serif", fontSize: 14 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_back</span>
          Dashboard
        </a>
      </div>

      <div style={{ maxWidth: 480, margin: "0 auto", padding: "28px 20px 0" }}>
        {/* Stage header */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>{stage.icon}</div>
          <h1 style={{ color: C.text, fontFamily: "'Nunito', sans-serif", fontSize: 26, fontWeight: 900, margin: "0 0 8px" }}>{stage.title}</h1>
          <p style={{ color: C.muted, fontFamily: "'Nunito', sans-serif", fontSize: 14, margin: "0 0 14px" }}>{stage.description}</p>

          {/* Progress bar */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ flex: 1, height: 7, borderRadius: 4, backgroundColor: C.surfaceHigh, overflow: "hidden" }}>
              <div style={{ height: "100%", borderRadius: 4, backgroundColor: total > 0 && done === total ? C.secondary : C.primary, width: `${total > 0 ? (done / total) * 100 : 0}%`, transition: "width 0.4s ease" }} />
            </div>
            <span style={{ color: C.muted, fontFamily: "'Nunito', sans-serif", fontSize: 12, fontWeight: 700, whiteSpace: "nowrap" }}>
              {done}/{total}
            </span>
          </div>
        </div>

        {/* Unit cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {stage.units.map((unit, i) => {
            const unitLessons = unit.lessons;
            const unitDone = unitLessons.filter((l) => completedIds.has(l.id)).length;
            const unitTotal = unitLessons.length;
            const isComplete = unitDone === unitTotal;
            const isLocked = unit.status === "locked";
            const pct = unitTotal > 0 ? (unitDone / unitTotal) * 100 : 0;

            return (
              <motion.div
                key={unit.id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07, duration: 0.3 }}
              >
                <button
                  onClick={() => !isLocked && setView({ phase: "unit", unit })}
                  disabled={isLocked}
                  style={{
                    width: "100%", padding: "18px 20px", borderRadius: 16,
                    backgroundColor: C.surfaceHigh,
                    border: `2px solid ${isComplete ? C.secondary : isLocked ? C.border : C.border}`,
                    display: "flex", alignItems: "center", gap: 16,
                    cursor: isLocked ? "not-allowed" : "pointer",
                    opacity: isLocked ? 0.45 : 1, textAlign: "left",
                  }}
                >
                  {/* Circle icon */}
                  <div style={{
                    width: 48, height: 48, borderRadius: "50%", flexShrink: 0,
                    backgroundColor: isComplete ? C.secondary : isLocked ? "#2a2838" : C.primary,
                    boxShadow: `0 5px 0 0 ${isComplete ? C.secondaryDark : isLocked ? "rgba(0,0,0,0.4)" : C.primaryDark}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 24, color: isComplete ? C.secondaryDim : "white", fontVariationSettings: isComplete ? "'FILL' 1" : "'FILL' 0" }}>
                      {isComplete ? "check" : isLocked ? "lock" : "auto_stories"}
                    </span>
                  </div>

                  {/* Text + mini progress */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ color: C.text, fontFamily: "'Nunito', sans-serif", fontWeight: 800, fontSize: 15, margin: "0 0 4px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{unit.title}</p>
                    {unit.description && (
                      <p style={{ color: C.muted, fontFamily: "'Nunito', sans-serif", fontSize: 12, margin: "0 0 6px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{unit.description}</p>
                    )}
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: "#2a2838", overflow: "hidden" }}>
                        <div style={{ height: "100%", borderRadius: 2, backgroundColor: isComplete ? C.secondary : C.primary, width: `${pct}%` }} />
                      </div>
                      <span style={{ color: C.muted, fontFamily: "'Nunito', sans-serif", fontSize: 11, fontWeight: 700 }}>{unitDone}/{unitTotal}</span>
                    </div>
                  </div>

                  {!isLocked && (
                    <span className="material-symbols-outlined" style={{ color: C.muted, fontSize: 20, flexShrink: 0 }}>chevron_right</span>
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
