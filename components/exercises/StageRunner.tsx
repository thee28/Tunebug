"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import type { Stage, Unit, Lesson } from "@/types/lesson";
import type { Difficulty } from "@/lib/curriculum/content";
import { LessonRunner } from "./LessonRunner";
import { generateLessonSteps } from "@/lib/curriculum/generator";
import { CURRICULUM } from "@/lib/curriculum/config";
import { useMastery } from "./useMastery";

interface Props {
  stage: Stage;
  difficulty: Difficulty;
}

const C = {
  primary: "#574eb1", primaryDark: "#41379b",
  secondary: "#006c4e", secondaryDark: "#00513a", secondaryDim: "#83f5c6",
  surface: "var(--c-surface-alt)", surfaceHigh: "var(--c-surface-high)",
  border: "var(--c-border)", muted: "var(--c-muted)", text: "var(--c-text)",
};

type View =
  | { phase: "browse" }
  | { phase: "exercise"; unit: Unit; lesson: Lesson };

export function StageRunner({ stage, difficulty }: Props) {
  const mastery = useMastery();
  const [view, setView] = useState<View>({ phase: "browse" });
  const [completedIds, setCompletedIds] = useState<Set<string>>(
    new Set(
      stage.units.flatMap((u) => u.lessons).filter((l) => l.passed).map((l) => l.id)
    )
  );
  // null = show stage title, string = show unit title
  const [backLabel, setBackLabel] = useState<string | null>(null);

  const unitRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Track which unit is in view via IntersectionObserver
  useEffect(() => {
    if (view.phase !== "browse") return;

    const refs = unitRefs.current;
    const observers: IntersectionObserver[] = [];

    refs.forEach((el, i) => {
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setBackLabel(stage.units[i]?.title ?? null);
        },
        // Trigger when the unit header crosses the top 30% of the viewport
        { rootMargin: "-10% 0px -60% 0px", threshold: 0 }
      );
      obs.observe(el);
      observers.push(obs);
    });

    return () => observers.forEach((o) => o.disconnect());
  }, [view.phase, stage.units]);


  // Stable across renders so a mid-lesson re-render (e.g. mastery fetch
  // resolving) doesn't shuffle the slot sequence under the user.
  const activeLessonSlug = view.phase === "exercise" ? view.lesson.slug : null;
  const lessonSteps = useMemo(() => {
    if (!activeLessonSlug) return null;
    const cl = CURRICULUM.flatMap(s => s.units.flatMap(u => u.lessons)).find(l => l.slug === activeLessonSlug);
    if (!cl) return null;
    return generateLessonSteps(cl.slug, cl.exerciseType, cl.exerciseConfig, difficulty, cl.secondaryExerciseConfig, cl.consolidationConfigs, cl.reinforceWithPrior, mastery);
    // mastery omitted from deps on purpose — captured once when the user
    // entered the lesson; subsequent fetches don't reshuffle in-flight steps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeLessonSlug, difficulty]);

  // ── Exercise view ──────────────────────────────────────
  if (view.phase === "exercise") {
    const { unit, lesson } = view;
    return (
      <LessonRunner
        title={`${stage.title} · ${unit.title}`}
        steps={lessonSteps ?? []}
        difficulty={difficulty}
        xpReward={lesson.xpReward}
        lessonSlug={lesson.slug}
        onComplete={async (score) => {
          try {
            await fetch("/api/progress", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ lessonId: lesson.id, score }),
            });
          } catch (e) {
            console.error("Failed to save progress:", e);
          }
          if (score >= lesson.passingScore) {
            setCompletedIds((prev) => new Set([...prev, lesson.id]));
          }
        }}
        onExit={() => { setBackLabel(null); setView({ phase: "browse" }); }}
      />
    );
  }

  // ── Browse view — all units in one scroll ──────────────
  const allLessons = stage.units.flatMap((u) => u.lessons);
  const total = allLessons.length;
  const done = allLessons.filter((l) => completedIds.has(l.id)).length;

  return (
    <div style={{ minHeight: "100vh", backgroundColor: C.surface, paddingBottom: 64 }}>
      {/* Sticky back bar */}
      <div
        style={{
          position: "sticky", top: 0, zIndex: 20,
          backgroundColor: C.surface,
          borderBottom: `2px solid ${C.border}`,
          padding: "13px 20px",
        }}
      >
        <a
          href="/dashboard"
          style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            color: C.muted, textDecoration: "none",
            fontFamily: "'Nunito', sans-serif", fontSize: 14, fontWeight: 700,
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>arrow_back</span>
          <span style={{ transition: "opacity 0.2s" }}>
            {backLabel ?? stage.title}
          </span>
        </a>
      </div>

      <div style={{ maxWidth: 560, margin: "0 auto", padding: "0 20px" }}>
        {/* Stage header */}
        <div style={{ textAlign: "center", padding: "32px 0 24px" }}>
          <div style={{ fontSize: 52, marginBottom: 10 }}>{stage.icon}</div>
          <h1
            style={{
              color: C.text, fontFamily: "'Nunito', sans-serif",
              fontSize: 26, fontWeight: 900, margin: "0 0 8px",
            }}
          >
            {stage.title}
          </h1>
          <p style={{ color: C.muted, fontFamily: "'Nunito', sans-serif", fontSize: 14, margin: "0 0 18px" }}>
            {stage.description}
          </p>
          {/* Overall progress */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                flex: 1, height: 8, borderRadius: 4,
                backgroundColor: C.surfaceHigh, overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%", borderRadius: 4,
                  backgroundColor: total > 0 && done === total ? C.secondary : C.primary,
                  width: `${total > 0 ? (done / total) * 100 : 0}%`,
                  transition: "width 0.4s ease",
                }}
              />
            </div>
            <span
              style={{
                color: C.muted, fontFamily: "'Nunito', sans-serif",
                fontSize: 12, fontWeight: 700, whiteSpace: "nowrap",
              }}
            >
              {done}/{total}
            </span>
          </div>
        </div>

        {/* Units */}
        {stage.units.map((unit, unitIndex) => {
          const prevUnit = stage.units[unitIndex - 1];
          const isUnitLocked = unitIndex > 0 &&
            !(prevUnit?.lessons.every((l) => completedIds.has(l.id)) ?? false);

          const unitLessons = unit.lessons.map((lesson, i) => {
            const prevLesson = unit.lessons[i - 1];
            const prevPassed = i === 0 || (prevLesson ? completedIds.has(prevLesson.id) : false);
            return {
              ...lesson,
              unlocked: !isUnitLocked && prevPassed,
              passed: completedIds.has(lesson.id),
            };
          });

          const unitDone = unitLessons.filter((l) => l.passed).length;
          const unitTotal = unitLessons.length;
          const isUnitComplete = unitDone === unitTotal && unitTotal > 0;

          return (
            <div key={unit.id}>
              {/* Divider between units */}
              {unitIndex > 0 && (
                <div style={{ height: 1, backgroundColor: C.border, margin: "4px 0" }} />
              )}

              {/* Unit sentinel — observed for scroll tracking */}
              <div ref={(el) => { unitRefs.current[unitIndex] = el; }}>
                {/* Unit header */}
                <div style={{ padding: "26px 0 14px", display: "flex", alignItems: "center", gap: 14 }}>
                  <div
                    style={{
                      width: 46, height: 46, borderRadius: "50%", flexShrink: 0,
                      backgroundColor: isUnitComplete ? C.secondary : isUnitLocked ? "var(--c-surface-high)" : C.primary,
                      boxShadow: `0 5px 0 0 ${isUnitComplete ? C.secondaryDark : isUnitLocked ? "rgba(0,0,0,0.35)" : C.primaryDark}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      opacity: isUnitLocked ? 0.45 : 1,
                    }}
                  >
                    <span
                      className="material-symbols-outlined"
                      style={{
                        fontSize: 22, color: isUnitComplete ? C.secondaryDim : "white",
                        fontVariationSettings: isUnitComplete ? "'FILL' 1" : "'FILL' 0",
                      }}
                    >
                      {isUnitComplete ? "check" : isUnitLocked ? "lock" : "auto_stories"}
                    </span>
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p
                      style={{
                        color: C.muted, fontFamily: "'Nunito', sans-serif",
                        fontSize: 11, fontWeight: 700,
                        textTransform: "uppercase", letterSpacing: "0.08em",
                        margin: "0 0 2px",
                      }}
                    >
                      Unit {unitIndex + 1} · {unitDone}/{unitTotal}
                    </p>
                    <h2
                      style={{
                        color: isUnitLocked ? C.muted : C.text,
                        fontFamily: "'Nunito', sans-serif",
                        fontSize: 17, fontWeight: 900, margin: 0,
                        opacity: isUnitLocked ? 0.6 : 1,
                      }}
                    >
                      {unit.title}
                    </h2>
                    {unit.description && (
                      <p
                        style={{
                          color: C.muted, fontFamily: "'Nunito', sans-serif",
                          fontSize: 12, margin: "2px 0 0",
                        }}
                      >
                        {unit.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Lessons */}
                <div style={{ display: "flex", flexDirection: "column", gap: 8, paddingBottom: 12 }}>
                  {unitLessons.map((lesson, i) => {
                    const isDone = lesson.passed;
                    const isLocked = !lesson.unlocked;
                    return (
                      <motion.div
                        key={lesson.id}
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: unitIndex * 0.05 + i * 0.04, duration: 0.2 }}
                      >
                        <button
                          onClick={() =>
                            !isLocked && setView({ phase: "exercise", unit, lesson })
                          }
                          disabled={isLocked}
                          style={{
                            width: "100%", padding: "13px 16px", borderRadius: 14,
                            backgroundColor: C.surfaceHigh,
                            border: `2px solid ${isDone ? C.secondary : C.border}`,
                            display: "flex", alignItems: "center", gap: 12,
                            cursor: isLocked ? "not-allowed" : "pointer",
                            opacity: isLocked ? 0.38 : 1, textAlign: "left",
                          }}
                        >
                          <div
                            style={{
                              width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
                              backgroundColor: isDone ? C.secondary : isLocked ? "var(--c-surface-high)" : C.primary,
                              display: "flex", alignItems: "center", justifyContent: "center",
                            }}
                          >
                            <span
                              className="material-symbols-outlined"
                              style={{
                                fontSize: 18,
                                color: isDone ? C.secondaryDim : "white",
                                fontVariationSettings: isDone ? "'FILL' 1" : "'FILL' 0",
                              }}
                            >
                              {isDone ? "check" : isLocked ? "lock" : EXERCISE_ICONS[lesson.exerciseType] ?? "music_note"}
                            </span>
                          </div>

                          <div style={{ flex: 1 }}>
                            <p
                              style={{
                                color: C.text, fontFamily: "'Nunito', sans-serif",
                                fontWeight: 700, fontSize: 13, margin: "0 0 2px",
                              }}
                            >
                              {lesson.title}
                            </p>
                            <p
                              style={{
                                color: C.muted, fontFamily: "'Nunito', sans-serif",
                                fontSize: 11, margin: 0,
                              }}
                            >
                              {EXERCISE_LABELS[lesson.exerciseType]} · {lesson.xpReward} XP
                            </p>
                          </div>

                          {!isLocked && (
                            <span
                              className="material-symbols-outlined"
                              style={{ color: C.muted, fontSize: 18 }}
                            >
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
        })}
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
