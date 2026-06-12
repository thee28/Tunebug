"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

const C = {
  primary: "#574eb1", primaryDark: "#41379b", primaryDim: "#c5c0ff",
  secondary: "#006c4e", secondaryDim: "#83f5c6",
  surface: "var(--c-surface-alt)", surfaceHigh: "var(--c-surface-high)",
  border: "var(--c-border)", muted: "var(--c-muted)", text: "var(--c-text)",
  tertiary: "#ffb95d",
};

const LEAGUES = [
  { name: "Bronze",  color: "#cd7f32", bg: "rgba(205,127,50,0.18)",  icon: "military_tech", minXP: 0    },
  { name: "Silver",  color: "#9e9e9e", bg: "rgba(158,158,158,0.12)", icon: "military_tech", minXP: 800  },
  { name: "Gold",    color: "#ffd700", bg: "rgba(255,215,0,0.15)",   icon: "emoji_events",  minXP: 2000 },
  { name: "Diamond", color: "#7df9ff", bg: "rgba(125,249,255,0.12)", icon: "diamond",       minXP: 5000 },
];

const GHOST_WIDTHS = [110, 140, 95, 125, 108, 130, 100];

const FAKE_USERS = [
  { initials: "AM", name: "Alex M.",    xp: 340 },
  { initials: "JK", name: "Jordan K.",  xp: 290 },
  { initials: "SR", name: "Sam R.",     xp: 255 },
  { initials: "CL", name: "Chris L.",   xp: 210 },
  { initials: "MN", name: "Morgan N.",  xp: 180 },
  { initials: "TW", name: "Taylor W.",  xp: 145 },
  { initials: "RB", name: "Riley B.",   xp: 120 },
  { initials: "KP", name: "Kim P.",     xp: 95  },
  { initials: "DC", name: "Drew C.",    xp: 60  },
];

function leagueIndex(xp: number) {
  if (xp >= 5000) return 3;
  if (xp >= 2000) return 2;
  if (xp >= 800)  return 1;
  return 0;
}

interface Props {
  totalXP: number;
  displayName: string;
  initials: string;
}

export default function Leaderboards({ totalXP, displayName, initials }: Props) {
  const router = useRouter();
  const hasJoined = totalXP > 0;
  const idx = leagueIndex(totalXP);
  const league = LEAGUES[idx];

  const ranked = hasJoined
    ? [...FAKE_USERS, { initials, name: displayName, xp: totalXP, isUser: true }]
        .sort((a, b) => b.xp - a.xp)
        .map((u, i) => ({ ...u, rank: i + 1 }))
    : [];

  const userEntry = ranked.find((u: any) => u.isUser);

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
        {!hasJoined && (
          <>
            <p style={{ color: C.muted, fontFamily: "'Nunito', sans-serif", fontSize: 14, margin: "0 0 18px" }}>
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

      {/* List */}
      <div style={{ borderRadius: 16, border: `2px solid ${C.border}`, overflow: "hidden", marginBottom: 12 }}>
        {hasJoined ? (
          ranked.map((u: any, i) => (
            <div
              key={u.name}
              style={{
                padding: "13px 18px",
                borderBottom: i < ranked.length - 1 ? `1px solid ${C.border}` : "none",
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
          GHOST_WIDTHS.map((w, i) => (
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
          ))
        )}
      </div>

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
          {hasJoined && userEntry ? userEntry.rank : "—"}
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
          {totalXP} XP
        </span>
      </div>
    </div>
  );
}
