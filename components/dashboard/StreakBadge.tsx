import type { StreakData } from "@/types/db";

export default function StreakBadge({ streak }: { streak: StreakData | null }) {
  const current = streak?.currentStreak ?? 0;
  return (
    <div
      className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white font-bold text-[#312E81]"
      style={{ boxShadow: "0 3px 0 0 #3730A3, 0 6px 16px rgba(79,70,229,0.15)", border: "2px solid #3730A3" }}
    >
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-[#F59E0B]">
        <path fillRule="evenodd" d="M12.963 2.286a.75.75 0 0 0-1.071-.136 9.742 9.742 0 0 0-3.539 6.176 7.547 7.547 0 0 1-1.705-1.715.75.75 0 0 0-1.152-.082A9 9 0 1 0 15.68 4.534a7.46 7.46 0 0 1-2.717-2.248ZM15.75 14.25a3.75 3.75 0 1 1-7.313-1.172c.628.465 1.35.81 2.133 1a5.99 5.99 0 0 1 1.925-3.545 3.75 3.75 0 0 1 3.255 3.717Z" clipRule="evenodd" />
      </svg>
      <span style={{ fontFamily: "'Baloo 2', sans-serif" }}>{current} day streak</span>
    </div>
  );
}
