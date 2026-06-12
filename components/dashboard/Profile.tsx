"use client";

const C = {
  primary: "#574eb1", primaryDark: "#41379b", primaryDim: "#c5c0ff",
  secondary: "#006c4e", secondaryDim: "#83f5c6",
  surface: "var(--c-surface-alt)", surfaceHigh: "var(--c-surface-high)",
  border: "var(--c-border)", muted: "var(--c-muted)", text: "var(--c-text)",
  tertiary: "#ffb95d",
};

export interface ProfileData {
  displayName: string;
  initials: string;
  email: string;
  totalXP: number;
  currentStreak: number;
  level: number;
  completedStages: number;
  totalStages: number;
  joinedAt: string; // ISO string, serialisable from server
}

function formatJoinDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function leagueFromXP(xp: number): string {
  if (xp >= 5000) return "Diamond";
  if (xp >= 2000) return "Gold";
  if (xp >= 800) return "Silver";
  return "Bronze";
}

export default function Profile({ data }: { data: ProfileData }) {
  const { displayName, initials, email, totalXP, currentStreak, level, completedStages, totalStages } = data;
  const league = leagueFromXP(totalXP);

  const achievements = [
    {
      name: "Wildfire",
      description: "Reach a 7 day streak",
      icon: "local_fire_department",
      iconBg: "#c62828",
      iconColor: "#ffb4ab",
      current: Math.min(currentStreak, 7),
      goal: 7,
    },
    {
      name: "Sage",
      description: "Earn 250 XP",
      icon: "auto_awesome",
      iconBg: "#2e7d32",
      iconColor: "#83f5c6",
      current: Math.min(totalXP, 250),
      goal: 250,
    },
    {
      name: "Scholar",
      description: "Complete all 5 stages",
      icon: "school",
      iconBg: "#4527a0",
      iconColor: C.primaryDim,
      current: Math.min(completedStages, 5),
      goal: 5,
    },
  ];

  const stats = [
    { icon: "local_fire_department", iconColor: C.tertiary, value: currentStreak, label: "Day streak" },
    { icon: "bolt", iconColor: "#facc15", value: totalXP, label: "Total XP" },
    { icon: "emoji_events", iconColor: C.tertiary, value: league, label: "Current league" },
    { icon: "stars", iconColor: C.primaryDim, value: `Lv ${level}`, label: "Current level" },
  ];

  return (
    <div style={{ paddingTop: 28, paddingBottom: 48 }}>

      {/* Hero banner */}
      <div style={{
        borderRadius: 20, overflow: "hidden", marginBottom: 24,
        backgroundColor: C.primary,
        border: `2px solid rgba(255,255,255,0.08)`,
        padding: "40px 28px 36px",
        display: "flex", alignItems: "center", gap: 24,
      }}>
        {/* Avatar */}
        <div style={{
          width: 80, height: 80, borderRadius: "50%", flexShrink: 0,
          backgroundColor: "rgba(255,255,255,0.15)",
          border: "3px solid rgba(255,255,255,0.3)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <span style={{ color: "white", fontFamily: "'Nunito', sans-serif", fontSize: 28, fontWeight: 900 }}>
            {initials}
          </span>
        </div>

        {/* Name & meta */}
        <div>
          <h1 style={{ color: "white", fontFamily: "'Nunito', sans-serif", fontSize: 22, fontWeight: 900, margin: "0 0 4px" }}>
            {displayName}
          </h1>
          <p style={{ color: "rgba(255,255,255,0.6)", fontFamily: "'Nunito', sans-serif", fontSize: 13, margin: "0 0 6px" }}>
            {email}
          </p>
          <p style={{ color: "rgba(255,255,255,0.5)", fontFamily: "'Nunito', sans-serif", fontSize: 13, margin: 0 }}>
            Joined {formatJoinDate(data.joinedAt)}
          </p>
        </div>
      </div>

      {/* Statistics */}
      <h2 style={{ color: C.text, fontFamily: "'Nunito', sans-serif", fontSize: 18, fontWeight: 900, margin: "0 0 14px" }}>
        Statistics
      </h2>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 32 }}>
        {stats.map((s) => (
          <div
            key={s.label}
            style={{
              borderRadius: 14, padding: "18px 18px",
              backgroundColor: C.surfaceHigh, border: `2px solid ${C.border}`,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 22, color: s.iconColor, fontVariationSettings: "'FILL' 1" }}>
                {s.icon}
              </span>
              <span style={{ color: C.text, fontFamily: "'Nunito', sans-serif", fontSize: 20, fontWeight: 900 }}>
                {s.value}
              </span>
            </div>
            <p style={{ color: C.muted, fontFamily: "'Nunito', sans-serif", fontSize: 12, fontWeight: 600, margin: 0 }}>
              {s.label}
            </p>
          </div>
        ))}
      </div>

      {/* Achievements */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <h2 style={{ color: C.text, fontFamily: "'Nunito', sans-serif", fontSize: 18, fontWeight: 900, margin: 0 }}>
          Achievements
        </h2>
        <span style={{ color: C.muted, fontFamily: "'Nunito', sans-serif", fontSize: 12, fontWeight: 700 }}>
          {achievements.filter(a => a.current >= a.goal).length} / {achievements.length} unlocked
        </span>
      </div>

      <div style={{ borderRadius: 16, border: `2px solid ${C.border}`, overflow: "hidden" }}>
        {achievements.map((a, i) => {
          const done = a.current >= a.goal;
          const pct = Math.min(a.current / a.goal, 1) * 100;
          return (
            <div
              key={a.name}
              style={{
                padding: "20px 20px",
                borderBottom: i < achievements.length - 1 ? `2px solid ${C.border}` : "none",
                backgroundColor: done ? "rgba(0,108,78,0.06)" : C.surfaceHigh,
                display: "flex", alignItems: "center", gap: 16,
              }}
            >
              {/* Badge */}
              <div style={{
                width: 52, height: 52, borderRadius: 14, flexShrink: 0,
                backgroundColor: done ? a.iconBg : "rgba(255,255,255,0.04)",
                border: `2px solid ${done ? "transparent" : C.border}`,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: 26, color: done ? a.iconColor : C.muted, fontVariationSettings: "'FILL' 1" }}
                >
                  {a.icon}
                </span>
              </div>

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                  <p style={{ color: C.text, fontFamily: "'Nunito', sans-serif", fontSize: 15, fontWeight: 800, margin: 0 }}>
                    {a.name}
                  </p>
                  <span style={{ color: C.muted, fontFamily: "'Nunito', sans-serif", fontSize: 12, fontWeight: 700, flexShrink: 0, marginLeft: 8 }}>
                    {a.current} / {a.goal}
                  </span>
                </div>
                <div style={{ height: 8, borderRadius: 4, backgroundColor: C.border, overflow: "hidden", marginBottom: 6 }}>
                  <div style={{
                    height: "100%", borderRadius: 4,
                    backgroundColor: done ? C.secondary : C.tertiary,
                    width: `${pct}%`, transition: "width 0.3s",
                  }} />
                </div>
                <p style={{ color: C.muted, fontFamily: "'Nunito', sans-serif", fontSize: 12, margin: 0 }}>
                  {a.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
