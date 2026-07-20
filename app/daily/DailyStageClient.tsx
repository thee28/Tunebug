"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { DailyStageData } from "@/lib/db/daily";
import { LessonRunner } from "@/components/exercises/LessonRunner";

interface Props {
  stage: DailyStageData;
}

const C = {
  primary: "#574eb1", primaryDark: "#41379b",
  secondary: "#006c4e", secondaryDark: "#00513a", secondaryDim: "#83f5c6",
  surface: "#141321", surfaceHigh: "#211F26",
  border: "#33313D", muted: "#938F99", text: "#f3eff5",
};

const DIFF_LABEL: Record<string, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

export function DailyStageClient({ stage }: Props) {
  const router = useRouter();
  const [mode, setMode] = useState<"overview" | "running" | "done">(
    stage.completed ? "done" : "overview"
  );
  const [finalScore, setFinalScore] = useState<number>(stage.score ?? 0);
  const [earnedXP, setEarnedXP] = useState(0);

  const handleComplete = async (score: number) => {
    setFinalScore(score);
    try {
      const res = await fetch("/api/daily-stage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: stage.id, score }),
      });
      const data = await res.json().catch(() => null);
      setEarnedXP(data?.xpEarned ?? 0);
    } catch (e) {
      console.error("Failed to save daily stage:", e);
    }
    setMode("done");
  };

  if (mode === "running") {
    return (
      <LessonRunner
        title="Daily Challenge"
        steps={stage.exercises.map(e => ({ kind: "exercise" as const, type: e.type, config: e.config }))}
        difficulty={stage.difficulty}
        xpReward={25}
        onComplete={handleComplete}
        onExit={() => setMode("overview")}
      />
    );
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: C.surface, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px 20px" }}>
      <div style={{ width: "100%", maxWidth: 400, textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 24 }}>

        <a href="/dashboard" style={{ alignSelf: "flex-start", display: "inline-flex", alignItems: "center", gap: 6, color: C.muted, textDecoration: "none", fontFamily: "'Nunito', sans-serif", fontSize: 14, marginBottom: 8 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_back</span>
          Back
        </a>

        <div style={{
          width: 100, height: 100, borderRadius: "50%",
          backgroundColor: mode === "done" && finalScore >= 70 ? C.secondary : C.primary,
          boxShadow: `0 8px 0 0 ${mode === "done" && finalScore >= 70 ? "#00513a" : C.primaryDark}`,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: 52, color: "white", fontVariationSettings: "'FILL' 1" }}>
            {mode === "done" ? (finalScore >= 70 ? "star" : "sentiment_neutral") : "today"}
          </span>
        </div>

        <div>
          <h1 style={{ color: C.text, fontFamily: "'Nunito', sans-serif", fontSize: 26, fontWeight: 900, margin: "0 0 6px" }}>
            {mode === "done" ? (finalScore >= 70 ? "Challenge Complete!" : "Try Again Tomorrow") : "Daily Challenge"}
          </h1>
          <p style={{ color: C.muted, fontFamily: "'Nunito', sans-serif", fontSize: 14, margin: 0 }}>
            {mode === "done"
              ? `Score: ${finalScore}%`
              : `${stage.exercises.length} exercises · ${DIFF_LABEL[stage.difficulty]} difficulty`}
          </p>
        </div>

        {mode === "done" && earnedXP > 0 && (
          <div style={{
            padding: "10px 20px", borderRadius: 12,
            backgroundColor: C.surfaceHigh, border: `2px solid ${C.border}`,
            display: "flex", alignItems: "center", gap: 8,
          }}>
            <span style={{ fontSize: 20 }}>⭐</span>
            <span style={{ color: "#facc15", fontFamily: "'Nunito', sans-serif", fontWeight: 800, fontSize: 18 }}>
              +{earnedXP} XP
            </span>
          </div>
        )}

        {/* Exercise type preview */}
        {mode === "overview" && (
          <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
            {stage.exercises.map((ex, i) => (
              <span
                key={i}
                style={{
                  padding: "4px 12px", borderRadius: 20,
                  backgroundColor: C.surfaceHigh, border: `1px solid ${C.border}`,
                  color: C.muted, fontFamily: "'Nunito', sans-serif", fontSize: 12,
                }}
              >
                {EX_LABELS[ex.type] ?? ex.type}
              </span>
            ))}
          </div>
        )}

        {mode === "overview" && (
          <button
            onClick={() => setMode("running")}
            style={{
              padding: "16px 56px", borderRadius: 14,
              backgroundColor: C.primary, boxShadow: `0 5px 0 0 ${C.primaryDark}`,
              color: "white", border: "none",
              fontFamily: "'Nunito', sans-serif", fontSize: 17, fontWeight: 800, cursor: "pointer",
            }}
          >
            Start Challenge
          </button>
        )}

        {mode === "done" && (
          <button
            onClick={() => { router.push("/dashboard"); router.refresh(); }}
            style={{
              padding: "14px 48px", borderRadius: 14,
              backgroundColor: C.primary, boxShadow: `0 4px 0 0 ${C.primaryDark}`,
              color: "white", border: "none",
              fontFamily: "'Nunito', sans-serif", fontSize: 16, fontWeight: 700, cursor: "pointer",
            }}
          >
            Back to Dashboard
          </button>
        )}
      </div>
    </div>
  );
}

const EX_LABELS: Record<string, string> = {
  EAR_SINGLE: "Ear Training",
  EAR_MULTI: "Chord ID",
  INTERVAL_ID: "Interval",
  PITCH_MATCH: "Pitch Match",
  SIGHT_READ_PIANO: "Sight Read",
};
