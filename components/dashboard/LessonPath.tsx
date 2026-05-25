"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Stage, Unit, Lesson } from "@/types/lesson";
import type { Difficulty } from "@/lib/curriculum/content";
import { LessonRunner } from "@/components/exercises/LessonRunner";

const C = {
  primary: "#574eb1", primaryDark: "#41379b", primaryDim: "#c5c0ff",
  secondary: "#006c4e", secondaryDark: "#00513a", secondaryDim: "#83f5c6",
  surface: "#141321", surfaceHigh: "#211F26",
  border: "#33313D", muted: "#938F99", text: "#f3eff5",
};

const OFFSETS = [70, -70, 110, -40, 50, -100, 90, -55];

// Professional icon per section index (no emoji)
const SECTION_ICONS = ["school", "menu_book", "library_music", "piano", "workspace_premium"];

const EXERCISE_ICONS: Record<string, string> = {
  EAR_SINGLE: "hearing", EAR_MULTI: "queue_music",
  INTERVAL_ID: "piano", PITCH_MATCH: "mic", SIGHT_READ_PIANO: "music_note",
};

interface ExerciseState {
  lesson: Lesson;
  unit: Unit;
  stage: Stage;
  difficulty: Difficulty;
}

interface BannerInfo {
  section: number;
  unit: number;
  unitTitle: string;
}

interface Props {
  stages: Stage[];
  difficulties: Record<string, Difficulty>;
  onShowSections: () => void;
}

export default function LessonPath({ stages, difficulties, onShowSections }: Props) {
  const [completedIds, setCompletedIds] = useState<Set<string>>(
    () =>
      new Set(
        stages
          .flatMap((s) => s.units.flatMap((u) => u.lessons))
          .filter((l) => l.passed)
          .map((l) => l.id)
      )
  );
  const [exercise, setExercise] = useState<ExerciseState | null>(null);

  const [bannerInfo, setBannerInfo] = useState<BannerInfo>(() => {
    for (let si = 0; si < stages.length; si++) {
      for (let ui = 0; ui < stages[si].units.length; ui++) {
        const unit = stages[si].units[ui];
        if (unit.status !== "locked") {
          return { section: si + 1, unit: ui + 1, unitTitle: unit.title };
        }
      }
    }
    return { section: 1, unit: 1, unitTitle: stages[0]?.units[0]?.title ?? "" };
  });

  const sentinelRefs = useRef<Map<string, Element>>(new Map());

  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    sentinelRefs.current.forEach((el, key) => {
      const [si, ui] = key.split(",").map(Number);
      const unit = stages[si]?.units[ui];
      if (!unit) return;
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting)
            setBannerInfo({ section: si + 1, unit: ui + 1, unitTitle: unit.title });
        },
        { rootMargin: "-10% 0px -65% 0px", threshold: 0 }
      );
      obs.observe(el);
      observers.push(obs);
    });
    return () => observers.forEach((o) => o.disconnect());
  }, [stages]);

  const firstActiveLessonId = useMemo(() => {
    for (const stage of stages) {
      for (const unit of stage.units) {
        if (unit.status === "locked") continue;
        for (let i = 0; i < unit.lessons.length; i++) {
          const lesson = unit.lessons[i];
          const prevOk = i === 0 || completedIds.has(unit.lessons[i - 1].id);
          if (prevOk && !completedIds.has(lesson.id)) return lesson.id;
        }
      }
    }
    return null;
  }, [stages, completedIds]);

  // Only show the section the user is currently in
  const currentStageIndex = useMemo(() => {
    for (let i = 0; i < stages.length; i++) {
      const allLessons = stages[i].units.flatMap((u) => u.lessons);
      if (!allLessons.every((l) => completedIds.has(l.id))) return i;
    }
    return stages.length - 1;
  }, [stages, completedIds]);

  const currentStage = stages[currentStageIndex];
  const nextStage = stages[currentStageIndex + 1] ?? null;

  let globalIdx = 0;

  return (
    <>
      {/* Exercise overlay */}
      <AnimatePresence>
        {exercise && (
          <motion.div
            key="exercise-overlay"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{
              position: "fixed", inset: 0, zIndex: 200,
              backgroundColor: C.surface, overflowY: "auto",
            }}
          >
            <LessonRunner
              title={`${exercise.stage.title} · ${exercise.unit.title}`}
              exercises={[{ type: exercise.lesson.exerciseType, config: exercise.lesson.exerciseConfig }]}
              difficulty={exercise.difficulty}
              xpReward={exercise.lesson.xpReward}
              onComplete={async (score) => {
                await fetch("/api/progress", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ lessonId: exercise.lesson.id, score }),
                });
                if (score >= exercise.lesson.passingScore) {
                  setCompletedIds((prev) => new Set([...prev, exercise.lesson.id]));
                }
              }}
              onExit={() => setExercise(null)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sticky banner — clicking shows sections inline */}
      <div style={{ position: "sticky", top: 56, zIndex: 10, width: "100%", marginBottom: 20 }}>
        <div
          style={{
            borderRadius: 16,
            backgroundColor: C.primary,
            borderBottom: `4px solid ${C.primaryDark}`,
            padding: "14px 18px",
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}
        >
          {/* Left: clickable section/unit label → opens sections view */}
          <button
            onClick={onShowSections}
            style={{
              background: "none", border: "none", cursor: "pointer",
              textAlign: "left", flex: 1, minWidth: 0, padding: 0,
            }}
          >
            <p
              style={{
                color: "rgba(255,255,255,0.6)", fontFamily: "'Nunito', sans-serif",
                fontSize: 11, fontWeight: 700, textTransform: "uppercase",
                letterSpacing: "0.08em", margin: "0 0 3px",
                display: "flex", alignItems: "center", gap: 4,
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 12 }}>arrow_back</span>
              Section {bannerInfo.section}, Unit {bannerInfo.unit}
            </p>
            <h2
              style={{
                color: "white", fontFamily: "'Nunito', sans-serif",
                fontSize: 17, fontWeight: 900, margin: 0,
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}
            >
              {bannerInfo.unitTitle}
            </h2>
          </button>

          {/* Right: guidebook link */}
          <a
            href="/practice"
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "8px 14px", borderRadius: 10,
              backgroundColor: "rgba(255,255,255,0.15)",
              border: "2px solid rgba(255,255,255,0.25)",
              color: "white", textDecoration: "none",
              fontFamily: "'Nunito', sans-serif", fontSize: 12, fontWeight: 800,
              textTransform: "uppercase", letterSpacing: "0.06em",
              flexShrink: 0, marginLeft: 12,
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>menu_book</span>
            Guidebook
          </a>
        </div>
      </div>

      {/* Lesson path — current section only */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%", paddingBottom: 80 }}>
        {(() => {
          const stage = currentStage;
          const si = currentStageIndex;
          const stageTotal = stage.units.flatMap((u) => u.lessons).length;
          const stageDone = stage.units
            .flatMap((u) => u.lessons)
            .filter((l) => completedIds.has(l.id)).length;

          return (
            <div key={stage.id} style={{ width: "100%" }}>
              {/* Section header */}
              <div
                style={{
                  borderRadius: 16,
                  backgroundColor: "rgba(87,78,177,0.12)",
                  border: "2px solid rgba(87,78,177,0.35)",
                  padding: "14px 18px",
                  marginBottom: 24,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div
                    style={{
                      width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                      backgroundColor: C.primary,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}
                  >
                    <span
                      className="material-symbols-outlined"
                      style={{ fontSize: 22, color: "white", fontVariationSettings: "'FILL' 1" }}
                    >
                      {SECTION_ICONS[si % SECTION_ICONS.length]}
                    </span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <p
                      style={{
                        color: C.primaryDim, fontFamily: "'Nunito', sans-serif",
                        fontSize: 11, fontWeight: 700, textTransform: "uppercase",
                        letterSpacing: "0.08em", margin: "0 0 2px",
                      }}
                    >
                      Section {si + 1}
                    </p>
                    <h3
                      style={{
                        color: C.text, fontFamily: "'Nunito', sans-serif",
                        fontSize: 15, fontWeight: 900, margin: 0,
                      }}
                    >
                      {stage.title}
                    </h3>
                  </div>
                  <span style={{ color: C.muted, fontFamily: "'Nunito', sans-serif", fontSize: 12, fontWeight: 700 }}>
                    {stageDone}/{stageTotal}
                  </span>
                </div>
                <div style={{ marginTop: 10, height: 5, borderRadius: 3, backgroundColor: "#2a2838", overflow: "hidden" }}>
                  <div
                    style={{
                      height: "100%", borderRadius: 3,
                      backgroundColor: stageDone === stageTotal ? C.secondary : C.primary,
                      width: `${stageTotal > 0 ? (stageDone / stageTotal) * 100 : 0}%`,
                      transition: "width 0.4s ease",
                    }}
                  />
                </div>
              </div>

              {/* Units */}
              {stage.units.map((unit, ui) => {
                const unitLocked = unit.status === "locked";
                const sentinelKey = `${si},${ui}`;

                return (
                  <div key={unit.id} style={{ display: "flex", flexDirection: "column" }}>
                    {/* Scroll sentinel */}
                    <div
                      ref={(el) => {
                        if (el) sentinelRefs.current.set(sentinelKey, el);
                        else sentinelRefs.current.delete(sentinelKey);
                      }}
                    />

                    {/* Unit divider */}
                    <div
                      style={{
                        display: "flex", alignItems: "center", gap: 10,
                        marginBottom: 20, opacity: unitLocked ? 0.45 : 1,
                      }}
                    >
                      <div style={{ flex: 1, height: 1, backgroundColor: C.border }} />
                      <span
                        style={{
                          color: C.muted, fontFamily: "'Nunito', sans-serif",
                          fontSize: 12, fontWeight: 700, whiteSpace: "nowrap",
                          display: "flex", alignItems: "center", gap: 4,
                        }}
                      >
                        {unitLocked && (
                          <span className="material-symbols-outlined" style={{ fontSize: 12 }}>lock</span>
                        )}
                        {unit.title}
                      </span>
                      <div style={{ flex: 1, height: 1, backgroundColor: C.border }} />
                    </div>

                    {/* Lesson nodes */}
                    {unit.lessons.map((lesson, li) => {
                      const isDone = completedIds.has(lesson.id);
                      const prevOk = li === 0 || completedIds.has(unit.lessons[li - 1].id);
                      const isLocked = unitLocked || !prevOk;
                      const isActive = lesson.id === firstActiveLessonId;
                      const offset = OFFSETS[globalIdx++ % OFFSETS.length];
                      const size = isActive ? 78 : 62;

                      return (
                        <div
                          key={lesson.id}
                          style={{
                            display: "flex", justifyContent: "center",
                            marginBottom: isActive ? 34 : 22,
                            marginTop: isActive ? 10 : 0,
                          }}
                        >
                          <motion.div
                            initial={{ opacity: 0, scale: 0.75 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{
                              delay: ui * 0.01 + li * 0.04,
                              duration: 0.3,
                              ease: [0.22, 1, 0.36, 1],
                            }}
                            style={{ position: "relative", transform: `translateX(${offset}px)` }}
                          >
                            {/* START badge */}
                            {isActive && (
                              <div
                                style={{
                                  position: "absolute",
                                  left: "calc(100% + 14px)",
                                  top: "50%",
                                  transform: "translateY(-50%)",
                                  backgroundColor: C.border,
                                  color: C.text, fontFamily: "'Nunito', sans-serif",
                                  fontSize: 11, fontWeight: 800,
                                  textTransform: "uppercase", letterSpacing: "0.08em",
                                  padding: "5px 12px", borderRadius: 8,
                                  whiteSpace: "nowrap",
                                }}
                              >
                                START
                              </div>
                            )}

                            {/* Node */}
                            <button
                              onClick={() =>
                                !isLocked &&
                                setExercise({
                                  lesson, unit, stage,
                                  difficulty: difficulties[stage.slug] ?? "beginner",
                                })
                              }
                              disabled={isLocked}
                              style={{
                                width: size, height: size,
                                borderRadius: "50%",
                                backgroundColor: isDone ? C.secondary : isLocked ? "#2a2838" : C.primary,
                                boxShadow: isActive
                                  ? `0 8px 0 0 ${C.primaryDark}, 0 0 0 10px #2a2838, 0 8px 0 10px #2a2838`
                                  : isDone
                                  ? `0 6px 0 0 ${C.secondaryDark}`
                                  : isLocked
                                  ? `0 6px 0 0 rgba(0,0,0,0.4)`
                                  : `0 6px 0 0 ${C.primaryDark}`,
                                display: "flex", alignItems: "center", justifyContent: "center",
                                opacity: isLocked ? 0.38 : 1,
                                cursor: isLocked ? "not-allowed" : "pointer",
                                border: "none",
                              }}
                            >
                              <span
                                className="material-symbols-outlined"
                                style={{
                                  fontSize: isActive ? 36 : 28,
                                  color: isDone ? C.secondaryDim : "white",
                                  fontVariationSettings: "'FILL' 1",
                                }}
                              >
                                {isDone
                                  ? "check"
                                  : isLocked
                                  ? "lock"
                                  : isActive
                                  ? "star"
                                  : EXERCISE_ICONS[lesson.exerciseType] ?? "music_note"}
                              </span>
                            </button>
                          </motion.div>
                        </div>
                      );
                    })}

                    <div style={{ height: 16 }} />
                  </div>
                );
              })}
            </div>
          );
        })()}

        {/* UP NEXT card */}
        {nextStage && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            style={{
              width: "100%", marginTop: 16,
              borderRadius: 20,
              backgroundColor: C.surfaceHigh,
              border: `2px solid ${C.border}`,
              padding: "28px 24px 24px",
              textAlign: "center",
            }}
          >
            {/* "UP NEXT" chip */}
            <div style={{ marginBottom: 14 }}>
              <span
                style={{
                  backgroundColor: "#2a2838",
                  color: C.muted, fontFamily: "'Nunito', sans-serif",
                  fontSize: 10, fontWeight: 800,
                  textTransform: "uppercase", letterSpacing: "0.12em",
                  padding: "4px 12px", borderRadius: 6,
                }}
              >
                Up Next
              </span>
            </div>

            {/* Next section name */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 8 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 20, color: C.muted }}>lock</span>
              <h3
                style={{
                  color: C.text, fontFamily: "'Nunito', sans-serif",
                  fontSize: 20, fontWeight: 900, margin: 0,
                }}
              >
                Section {currentStageIndex + 2}: {nextStage.title}
              </h3>
            </div>

            <p
              style={{
                color: C.muted, fontFamily: "'Nunito', sans-serif",
                fontSize: 13, margin: "0 auto 20px",
                maxWidth: 300, lineHeight: 1.5,
              }}
            >
              {nextStage.description}
            </p>

            <button
              onClick={onShowSections}
              style={{
                width: "100%", padding: "13px 0", borderRadius: 14,
                backgroundColor: "transparent",
                border: `2px solid ${C.border}`,
                color: C.muted, fontFamily: "'Nunito', sans-serif",
                fontWeight: 800, fontSize: 13,
                textTransform: "uppercase", letterSpacing: "0.08em",
                cursor: "pointer",
              }}
            >
              Jump Here?
            </button>
          </motion.div>
        )}
      </div>
    </>
  );
}
