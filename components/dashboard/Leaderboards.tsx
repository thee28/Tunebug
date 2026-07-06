"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { LEAGUES, leagueIndex } from "@/lib/leagues";
import type { LeaderboardData } from "@/lib/db/leaderboard";

const C = {
  primary: "#574eb1", primaryDark: "#41379b", primaryDim: "#c5c0ff",
  secondary: "#006c4e", secondaryDim: "#83f5c6",
  surface: "var(--c-surface-alt)", surfaceHigh: "var(--c-surface-high)",
  border: "var(--c-border)", muted: "var(--c-muted)", text: "var(--c-text)",
  tertiary: "#ffb95d",
};

const GHOST_WIDTHS = [110, 140, 95, 125, 108, 130, 100];

interface Props {
  totalXP: number;
  displayName: string;
  initials: string;
  data: LeaderboardData | null;
}

export default function Leaderboards({ totalXP, displayName, initials, data }: Props) {
  const router = useRouter();
  const idx = leagueIndex(totalXP);
  const league = LEAGUES[idx];

  const entries = data?.entries ?? [];
  const userEntry = entries.find((u) => u.isUser);
  const hasJoined = (data?.userWeeklyXP ?? 0) > 0;
  const isPublic = data?.userIsPublic ?? true;
  const boardEmpty = entries.length === 0;

  return (
    <div style={{ paddingTop: 28, paddingBottom: 32 }}>

      {/* League tier icons */}
      <div style={{ display: "flex", justifyContent: "center", alignItems: "flex-end", gap: 14, marginBottom: 22 }}>
        {LEAGUES.map((l, i) => {
          const current = i === idx;
          const locked = i > idx;
          return (
            <div
              key={l.name}
              style={{
                width: current ? 68 : 46,
                height: current ? 68 : 46,
                flexShrink: 0,
                backgroundColor: locked ? "rgba(255,255,255,0.03)" : current ? l.bg : "rgba(255,255,255,0.06)",
                border: `2px solid ${locked ? C.border : current ? l.color : "rgba(255,255,255,0.15)"}`,
                borderRadius: 14,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <span
                className="material-symbols-outlined"
                style={{
                  fontSize: current ? 32 : 22,
                  color: locked ? C.border : current ? l.color : "rgba(255,255,255,0.3)",
                  fontVariationSettings: "'FILL' 1",
                }}
              >
                {locked ? "lock" : l.icon}
              </span>
            </div>
          );
        })}
      </div>

      {/* Title & CTA */}
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <h1 style={{ color: C.text, fontFamily: "'Nunito', sans-serif", fontSize: 22, fontWeight: 900, margin: "0 0 8px" }}>
          {league.name} League
        </h1>
        <p style={{ color: C.muted, fontFamily: "'Nunito', sans-serif", fontSize: 13, margin: "0 0 4px" }}>
          Weekly XP · resets Monday
        </p>
        {!hasJoined && (
          <>
            <p style={{ color: C.muted, fontFamily: "'Nunito', sans-serif", fontSize: 14, margin: "10px 0 18px" }}>
              Complete a lesson to join this week&apos;s leaderboard
            </p>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => router.push("/dashboard")}
              style={{
                padding: "12px 32px", borderRadius: 14, border: "none",
                backgroundColor: C.primary, boxShadow: `0 5px 0 0 ${C.primaryDark}`,
                color: "white", fontFamily: "'Nunito', sans-serif",
                fontSize: 13, fontWeight: 800, letterSpacing: "0.06em",
                textTransform: "uppercase", cursor: "pointer",
              }}
            >
              Start a Lesson
            </motion.button>
          </>
        )}
      </div>

      {/* Private-profile notice */}
      {!isPublic && (
        <div style={{
          borderRadius: 14, border: `2px solid ${C.border}`,
          backgroundColor: "rgba(255,185,93,0.08)",
          padding: "14px 18px", marginBottom: 16,
          display: "flex", alignItems: "center", gap: 12,
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: 22, color: C.tertiary, flexShrink: 0 }}>
            visibility_off
          </span>
          <p style={{ color: C.text, fontFamily: "'Nunito', sans-serif", fontSize: 13, margin: 0, lineHeight: 1.5 }}>
            Your profile is private, so other learners can&apos;t see you here.{" "}
            <Link href="/dashboard?view=settings&sub=privacy" style={{ color: C.primaryDim, fontWeight: 800 }}>
              Make it public
            </Link>{" "}
            to compete on the leaderboard.
          </p>
        </div>
      )}

      {/* List */}
      <div style={{ borderRadius: 16, border: `2px solid ${C.border}`, overflow: "hidden", marginBottom: 12 }}>
        {!boardEmpty ? (
          entries.map((u, i) => (
            <div
              key={u.userId}
              style={{
                padding: "13px 18px",
                borderBottom: i < entries.length - 1 ? `1px solid ${C.border}` : "none",
                backgroundColor: u.isUser ? "rgba(87,78,177,0.12)" : C.surfaceHigh,
                display: "flex", alignItems: "center", gap: 14,
                outline: u.isUser ? `2px solid rgba(87,78,177,0.35)` : undefined,
                outlineOffset: "-2px",
              }}
            >
              <span style={{
                width: 22, textAlign: "center", flexShrink: 0,
                color: u.rank <= 3 ? C.tertiary : C.muted,
                fontFamily: "'Nunito', sans-serif", fontSize: 13, fontWeight: 800,
              }}>
                {u.rank}
              </span>
              <div style={{
                width: 38, height: 38, borderRadius: "50%", flexShrink: 0,
                backgroundColor: u.isUser ? C.primary : "rgba(255,255,255,0.08)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <span style={{ color: "white", fontFamily: "'Nunito', sans-serif", fontSize: 12, fontWeight: 900 }}>
                  {u.initials}
                </span>
              </div>
              <span style={{
                flex: 1, color: C.text,
                fontFamily: "'Nunito', sans-serif", fontSize: 14,
                fontWeight: u.isUser ? 800 : 600,
              }}>
                {u.name}
              </span>
              <span style={{
                color: u.isUser ? C.primaryDim : C.muted,
                fontFamily: "'Nunito', sans-serif", fontSize: 13, fontWeight: 800,
              }}>
                {u.xp} XP
              </span>
            </div>
          ))
        ) : (
          <>
            {GHOST_WIDTHS.map((w, i) => (
              <div
                key={i}
                style={{
                  padding: "14px 18px",
                  borderBottom: i < GHOST_WIDTHS.length - 1 ? `1px solid ${C.border}` : "none",
                  backgroundColor: C.surfaceHigh,
                  display: "flex", alignItems: "center", gap: 14,
                }}
              >
                <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: C.border, flexShrink: 0 }} />
                <div style={{
                  width: 38, height: 38, borderRadius: "50%", flexShrink: 0,
                  backgroundColor: `rgba(255,255,255,${Math.max(0.03, 0.07 - i * 0.008)})`,
                }} />
                <div style={{
                  height: 11, borderRadius: 6, flexShrink: 0,
                  backgroundColor: `rgba(255,255,255,${Math.max(0.03, 0.07 - i * 0.008)})`,
                  width: w,
                }} />
                <div style={{ marginLeft: "auto", height: 10, width: 44, borderRadius: 5, flexShrink: 0, backgroundColor: C.border }} />
              </div>
            ))}
          </>
        )}
      </div>

      {boardEmpty && (
        <p style={{ color: C.muted, fontFamily: "'Nunito', sans-serif", fontSize: 13, textAlign: "center", margin: "0 0 12px" }}>
          No one has earned XP this week yet. Be the first!
        </p>
      )}

      {/* Sticky user row */}
      <div style={{
        position: "sticky", bottom: 0,
        backgroundColor: C.surfaceHigh,
        border: `2px solid ${C.border}`,
        borderRadius: 14,
        padding: "13px 18px",
        display: "flex", alignItems: "center", gap: 14,
        boxShadow: "0 -4px 20px rgba(0,0,0,0.4)",
      }}>
        <span style={{
          width: 22, textAlign: "center", flexShrink: 0,
          color: C.muted, fontFamily: "'Nunito', sans-serif", fontSize: 13, fontWeight: 800,
        }}>
          {userEntry ? userEntry.rank : "-"}
        </span>
        <div style={{
          width: 38, height: 38, borderRadius: "50%", flexShrink: 0,
          backgroundColor: C.primary,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <span style={{ color: "white", fontFamily: "'Nunito', sans-serif", fontSize: 12, fontWeight: 900 }}>
            {initials}
          </span>
        </div>
        <span style={{ flex: 1, color: C.text, fontFamily: "'Nunito', sans-serif", fontSize: 14, fontWeight: 700 }}>
          {displayName}
        </span>
        <span style={{ color: C.muted, fontFamily: "'Nunito', sans-serif", fontSize: 13, fontWeight: 800 }}>
          {data?.userWeeklyXP ?? 0} XP this week
        </span>
      </div>
    </div>
  );
}
