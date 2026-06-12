import type { StreakData } from "@/types/db";

export default function StreakBadge({ streak }: { streak: StreakData | null }) {
  const current = streak?.currentStreak ?? 0;
  return (
    <div
      className="flex items-center gap-2 px-4 py-2 rounded-2xl font-bold"
      style={{
        backgroundColor: "rgba(255,185,93,0.12)",
        border: "2px solid rgba(255,185,93,0.3)",
        fontFamily: "'Nunito', sans-serif",
        color: "#ffb95d",
      }}
    >
      <span
        className="material-symbols-outlined"
        style={{ fontSize: 20, fontVariationSettings: "'FILL' 1", color: "#ffb95d" }}
      >
        local_fire_department
      </span>
      <span style={{ fontFamily: "'Nunito', sans-serif", color: "var(--c-text)" }}>
        {current} day streak
      </span>
    </div>
  );
}
