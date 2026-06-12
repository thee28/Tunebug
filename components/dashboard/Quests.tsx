"use client";

const C = {
  primary: "#574eb1", primaryDark: "#41379b", primaryDim: "#c5c0ff",
  secondary: "#006c4e", secondaryDim: "#83f5c6",
  surface: "var(--c-surface-alt)", surfaceHigh: "var(--c-surface-high)",
  border: "var(--c-border)", muted: "var(--c-muted)", text: "var(--c-text)",
  tertiary: "#ffb95d",
};

interface Quest {
  id: string;
  label: string;
  icon: string;
  iconBg: string;
  iconColor: string;
  current: number;
  goal: number;
}

const DAILY_QUESTS: Quest[] = [
  { id: "xp", label: "Earn 10 XP today", icon: "bolt", iconBg: "rgba(255,185,93,0.2)", iconColor: C.tertiary, current: 0, goal: 10 },
  { id: "lessons", label: "Complete 2 lessons", icon: "school", iconBg: "rgba(87,78,177,0.2)", iconColor: C.primaryDim, current: 0, goal: 2 },
  { id: "score", label: "Score 80% or higher in a lesson", icon: "gps_fixed", iconBg: "rgba(0,108,78,0.2)", iconColor: C.secondaryDim, current: 0, goal: 1 },
];

function hoursUntilMidnight(): number {
  const now = new Date();
  const midnight = new Date();
  midnight.setUTCHours(24, 0, 0, 0);
  return Math.ceil((midnight.getTime() - now.getTime()) / 3600000);
}

export default function Quests() {
  const completed = DAILY_QUESTS.filter(q => q.current >= q.goal).length;
  const hours = hoursUntilMidnight();

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
            You&apos;ve completed <strong style={{ color: "white" }}>{completed} out of {DAILY_QUESTS.length}</strong> quests today.
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
        {DAILY_QUESTS.map((quest, i) => {
          const progress = Math.min(quest.current / quest.goal, 1);
          const done = quest.current >= quest.goal;
          return (
            <div
              key={quest.id}
              style={{
                padding: "20px 20px",
                borderBottom: i < DAILY_QUESTS.length - 1 ? `2px solid ${C.border}` : "none",
                backgroundColor: done ? "rgba(0,108,78,0.08)" : C.surfaceHigh,
                display: "flex", alignItems: "center", gap: 16,
              }}
            >
              {/* Icon */}
              <div style={{
                width: 48, height: 48, borderRadius: 14, flexShrink: 0,
                backgroundColor: done ? "rgba(0,108,78,0.2)" : quest.iconBg,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: 26, color: done ? C.secondaryDim : quest.iconColor, fontVariationSettings: "'FILL' 1" }}
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
                    {quest.current} / {quest.goal}
                  </span>
                </div>
              </div>

              {/* Reward badge */}
              <div style={{
                width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                backgroundColor: done ? "rgba(255,185,93,0.2)" : "rgba(255,255,255,0.04)",
                border: `2px solid ${done ? "rgba(255,185,93,0.4)" : C.border}`,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: 20, color: done ? C.tertiary : C.muted, fontVariationSettings: "'FILL' 1" }}
                >
                  emoji_events
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
