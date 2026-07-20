"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { QuestProgress } from "@/lib/db/quests";
import { buildQuestDefs } from "@/lib/quests";
import { playRewardChime } from "@/lib/audio/reward";

const C = {
  primary: "#574eb1", primaryDark: "#41379b", primaryDim: "#c5c0ff",
  secondary: "#006c4e", secondaryDim: "#83f5c6",
  surface: "var(--c-surface-alt)", surfaceHigh: "var(--c-surface-high)",
  border: "var(--c-border)", muted: "var(--c-muted)", text: "var(--c-text)",
  tertiary: "#ffb95d",
};

const QUEST_STYLE: Record<string, { iconBg: string; iconColor: string }> = {
  xp: { iconBg: "rgba(255,185,93,0.2)", iconColor: C.tertiary },
  lessons: { iconBg: "rgba(87,78,177,0.2)", iconColor: C.primaryDim },
  score: { iconBg: "rgba(0,108,78,0.2)", iconColor: C.secondaryDim },
};

function hoursUntilMidnight(): number {
  const now = new Date();
  const midnight = new Date();
  midnight.setUTCHours(24, 0, 0, 0);
  return Math.ceil((midnight.getTime() - now.getTime()) / 3600000);
}

interface Props {
  questProgress: QuestProgress;
  claimedQuestIds: string[];
  dailyXpGoal: number;
}

export default function Quests({ questProgress, claimedQuestIds, dailyXpGoal }: Props) {
  const router = useRouter();
  const [claimed, setClaimed] = useState<Set<string>>(new Set(claimedQuestIds));
  const [claiming, setClaiming] = useState<string | null>(null);

  const questDefs = buildQuestDefs(dailyXpGoal);
  const completed = questDefs.filter(q => q.progress(questProgress) >= q.goal).length;
  const hours = hoursUntilMidnight();

  async function handleClaim(questId: string) {
    if (claiming || claimed.has(questId)) return;
    setClaiming(questId);
    try {
      const res = await fetch("/api/quests/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questId }),
      });
      if (res.ok || res.status === 409) {
        // 409 = already claimed (e.g. another tab) — reflect that too.
        if (res.ok) playRewardChime();
        setClaimed(prev => new Set(prev).add(questId));
        // Refresh the server-rendered XP counters in the header/sidebar.
        router.refresh();
      }
    } finally {
      setClaiming(null);
    }
  }

  return (
    <div style={{ paddingTop: 28, paddingBottom: 40 }}>

      {/* Hero banner */}
      <div style={{
        borderRadius: 20, padding: "28px 28px 28px 32px", marginBottom: 32,
        background: `linear-gradient(135deg, #5b52c4 0%, #7c60d4 60%, #9b6ee0 100%)`,
        border: `2px solid rgba(255,255,255,0.08)`,
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16,
        overflow: "hidden", position: "relative",
      }}>
        <div style={{ zIndex: 1 }}>
          <h1 style={{ color: "white", fontFamily: "'Nunito', sans-serif", fontSize: 22, fontWeight: 900, margin: "0 0 8px", lineHeight: 1.2 }}>
            Earn rewards with quests!
          </h1>
          <p style={{ color: "rgba(255,255,255,0.75)", fontFamily: "'Nunito', sans-serif", fontSize: 14, margin: 0 }}>
            You&apos;ve completed <strong style={{ color: "white" }}>{completed} out of {questDefs.length}</strong> quests today.
          </p>
        </div>

        {/* Decorative icon cluster */}
        <div style={{ position: "relative", width: 80, height: 80, flexShrink: 0 }}>
          <div style={{ position: "absolute", top: 0, right: 0, width: 56, height: 56, borderRadius: "50%", backgroundColor: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span className="material-symbols-outlined" style={{ fontSize: 32, color: "white", fontVariationSettings: "'FILL' 1" }}>military_tech</span>
          </div>
          <div style={{ position: "absolute", bottom: 0, left: 0, width: 34, height: 34, borderRadius: "50%", backgroundColor: "rgba(255,255,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span className="material-symbols-outlined" style={{ fontSize: 18, color: "rgba(255,255,255,0.8)", fontVariationSettings: "'FILL' 1" }}>star</span>
          </div>
          <div style={{ position: "absolute", top: 8, left: 8, width: 20, height: 20, borderRadius: "50%", backgroundColor: "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span className="material-symbols-outlined" style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
          </div>
        </div>
      </div>

      {/* Daily quests */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <h2 style={{ color: C.text, fontFamily: "'Nunito', sans-serif", fontSize: 18, fontWeight: 900, margin: 0 }}>
          Daily Quests
        </h2>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 16, color: C.tertiary }}>schedule</span>
          <span style={{ color: C.tertiary, fontFamily: "'Nunito', sans-serif", fontSize: 13, fontWeight: 800 }}>
            {hours} {hours === 1 ? "HOUR" : "HOURS"}
          </span>
        </div>
      </div>

      <div style={{ borderRadius: 16, border: `2px solid ${C.border}`, overflow: "hidden" }}>
        {questDefs.map((quest, i) => {
          const current = quest.progress(questProgress);
          const progress = Math.min(current / quest.goal, 1);
          const done = current >= quest.goal;
          const isClaimed = claimed.has(quest.id);
          const claimable = done && !isClaimed;
          const style = QUEST_STYLE[quest.id] ?? QUEST_STYLE.xp;
          return (
            <div
              key={quest.id}
              style={{
                padding: "20px 20px",
                borderBottom: i < questDefs.length - 1 ? `2px solid ${C.border}` : "none",
                backgroundColor: done ? "rgba(0,108,78,0.08)" : C.surfaceHigh,
                display: "flex", alignItems: "center", gap: 16,
              }}
            >
              {/* Icon */}
              <div style={{
                width: 48, height: 48, borderRadius: 14, flexShrink: 0,
                backgroundColor: done ? "rgba(0,108,78,0.2)" : style.iconBg,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: 26, color: done ? C.secondaryDim : style.iconColor, fontVariationSettings: "'FILL' 1" }}
                >
                  {done ? "check_circle" : quest.icon}
                </span>
              </div>

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ color: C.text, fontFamily: "'Nunito', sans-serif", fontSize: 15, fontWeight: 700, margin: "0 0 8px" }}>
                  {quest.label}
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ flex: 1, height: 8, borderRadius: 4, backgroundColor: C.border, overflow: "hidden" }}>
                    <div style={{
                      height: "100%", borderRadius: 4,
                      backgroundColor: done ? C.secondary : C.primary,
                      width: `${progress * 100}%`,
                      transition: "width 0.3s",
                    }} />
                  </div>
                  <span style={{ color: C.muted, fontFamily: "'Nunito', sans-serif", fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                    {current} / {quest.goal}
                  </span>
                </div>
              </div>

              {/* Reward: claim button, claimed check, or pending badge */}
              {claimable ? (
                <button
                  onClick={() => handleClaim(quest.id)}
                  disabled={claiming === quest.id}
                  style={{
                    flexShrink: 0, padding: "10px 14px", borderRadius: 10, border: "none",
                    backgroundColor: C.tertiary, boxShadow: "0 3px 0 0 #b37b2c",
                    color: "#3a2a00", fontFamily: "'Nunito', sans-serif",
                    fontSize: 12, fontWeight: 900, letterSpacing: "0.04em",
                    textTransform: "uppercase", cursor: "pointer",
                    display: "flex", alignItems: "center", gap: 6,
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 16, fontVariationSettings: "'FILL' 1" }}>
                    emoji_events
                  </span>
                  {claiming === quest.id ? "…" : `+${quest.rewardXP} XP`}
                </button>
              ) : (
                <div style={{
                  flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 10,
                    backgroundColor: isClaimed ? "rgba(0,108,78,0.2)" : "rgba(255,255,255,0.04)",
                    border: `2px solid ${isClaimed ? "rgba(0,108,78,0.4)" : C.border}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <span
                      className="material-symbols-outlined"
                      style={{ fontSize: 20, color: isClaimed ? C.secondaryDim : C.muted, fontVariationSettings: "'FILL' 1" }}
                    >
                      {isClaimed ? "check" : "emoji_events"}
                    </span>
                  </div>
                  <span style={{ color: C.muted, fontFamily: "'Nunito', sans-serif", fontSize: 10, fontWeight: 800 }}>
                    {isClaimed ? "CLAIMED" : `+${quest.rewardXP} XP`}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
