import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getStagesWithProgress } from "@/lib/db/stages";
import { getStreak } from "@/lib/db/streak";
import StagePath from "@/components/dashboard/StagePath";

const C = {
  dark: "#0F0F13",
  surface: "#1C1B21",
  surfaceHigh: "#211F26",
  border: "#33313D",
  primary: "#574eb1",
  primaryDark: "#41379b",
  primaryDim: "#c5c0ff",
  secondary: "#006c4e",
  secondaryDark: "#00513a",
  secondaryDim: "#83f5c6",
  tertiary: "#ffb95d",
  muted: "#938F99",
  text: "#f3eff5",
};

const navItems = [
  { icon: "school", label: "Learn", href: "/dashboard", active: true },
  { icon: "music_note", label: "Practice", href: "/practice", active: false },
  { icon: "emoji_events", label: "Leaderboards", href: "#", active: false },
  { icon: "person", label: "Profile", href: "#", active: false },
];

const mobileNav = [
  { icon: "school", label: "Learn", active: true },
  { icon: "music_note", label: "Practice", active: false },
  { icon: "emoji_events", label: "Stats", active: false },
  { icon: "person", label: "Profile", active: false },
];

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [stages, streak] = await Promise.all([
    getStagesWithProgress(session.user.id),
    getStreak(session.user.id),
  ]);

  const userWithXP = await import("@/lib/prisma").then(({ prisma }) =>
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { xp: true },
    })
  );
  const totalXP = userWithXP?.xp ?? 0;
  const currentStreak = streak?.currentStreak ?? 0;

  return (
    <div className="min-h-screen" style={{ backgroundColor: C.dark, color: C.text }}>
      {/* ── Header ── */}
      <header
        className="sticky top-0 z-50 h-14"
        style={{ backgroundColor: C.dark, borderBottom: `2px solid ${C.border}` }}
      >
        <div className="max-w-[1200px] mx-auto h-full flex items-center justify-between px-5 md:px-10">
          <Link
            href="/"
            className="text-xl font-extrabold tracking-tight"
            style={{ color: C.primaryDim, fontFamily: "'Nunito', sans-serif" }}
          >
            Tunebug
          </Link>

          <div className="flex items-center gap-1">
            {/* Streak */}
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl cursor-pointer transition-colors"
              style={{ fontFamily: "'Nunito', sans-serif" }}
              onMouseEnter={undefined}
            >
              <span
                className="material-symbols-outlined"
                style={{ fontSize: 22, color: C.tertiary, fontVariationSettings: "'FILL' 1" }}
              >
                local_fire_department
              </span>
              <span className="font-bold text-sm" style={{ color: C.text }}>
                {currentStreak}
              </span>
            </div>

            {/* XP */}
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl cursor-pointer"
              style={{ fontFamily: "'Nunito', sans-serif" }}
            >
              <span
                className="material-symbols-outlined"
                style={{ fontSize: 22, color: C.primaryDim, fontVariationSettings: "'FILL' 1" }}
              >
                stars
              </span>
              <span className="font-bold text-sm" style={{ color: C.text }}>
                {totalXP}
              </span>
            </div>

            {/* Hearts */}
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl cursor-pointer"
              style={{ fontFamily: "'Nunito', sans-serif" }}
            >
              <span
                className="material-symbols-outlined"
                style={{ fontSize: 22, color: "#ffb4ab", fontVariationSettings: "'FILL' 1" }}
              >
                favorite
              </span>
              <span className="font-bold text-sm" style={{ color: C.text }}>
                5
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-[1200px] mx-auto flex">
        {/* ── Left Sidebar ── */}
        <aside
          className="hidden md:flex flex-col w-60 shrink-0 sticky top-14 py-6 px-3 gap-1"
          style={{
            height: "calc(100vh - 56px)",
            borderRight: `2px solid ${C.border}`,
          }}
        >
          <nav className="flex flex-col gap-1 flex-1">
            {navItems.map(({ icon, label, href, active }) => (
              <Link
                key={label}
                href={href}
                className="flex items-center gap-3 px-4 py-3 rounded-2xl font-bold uppercase tracking-wide transition-all"
                style={{
                  backgroundColor: active ? "rgba(87,78,177,0.15)" : "transparent",
                  color: active ? C.primaryDim : C.muted,
                  border: active
                    ? `2px solid rgba(87,78,177,0.3)`
                    : "2px solid transparent",
                  fontFamily: "'Nunito', sans-serif",
                  fontSize: "13px",
                }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{
                    fontSize: 22,
                    fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0",
                  }}
                >
                  {icon}
                </span>
                {label}
              </Link>
            ))}
          </nav>

          {/* Premium promo */}
          <div
            className="rounded-2xl p-4 mt-auto"
            style={{ backgroundColor: C.surfaceHigh, border: `2px solid ${C.border}` }}
          >
            <p
              className="font-bold text-xs uppercase tracking-widest mb-1"
              style={{ color: C.secondaryDim, fontFamily: "'Nunito', sans-serif" }}
            >
              Go Premium
            </p>
            <p className="text-xs mb-3" style={{ color: C.muted }}>
              Unlimited hearts &amp; no ads
            </p>
            <button
              className="btn-teal w-full py-2 rounded-xl font-bold text-xs uppercase tracking-widest text-white"
              style={{ backgroundColor: C.secondary, fontFamily: "'Nunito', sans-serif" }}
            >
              Try Free
            </button>
          </div>
        </aside>

        {/* ── Main Path ── */}
        <main className="flex-1 flex flex-col items-center py-8 px-4 md:px-8 pb-24 md:pb-8">
          {/* Unit banner */}
          <div
            className="w-full max-w-lg mb-10 rounded-2xl p-5 flex items-center justify-between"
            style={{
              backgroundColor: C.primary,
              borderBottom: `4px solid ${C.primaryDark}`,
            }}
          >
            <div>
              <p
                className="text-xs uppercase tracking-widest mb-1"
                style={{
                  color: "rgba(255,255,255,0.6)",
                  fontFamily: "'Nunito', sans-serif",
                }}
              >
                ← Section 1, Unit 1
              </p>
              <h2
                className="text-xl font-extrabold text-white"
                style={{ fontFamily: "'Nunito', sans-serif" }}
              >
                The Basics of Pitch
              </h2>
            </div>
            <Link href="/practice">
              <button
                className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-wider text-white transition-all hover:bg-white/20"
                style={{
                  backgroundColor: "rgba(255,255,255,0.15)",
                  border: "2px solid rgba(255,255,255,0.25)",
                  fontFamily: "'Nunito', sans-serif",
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                  menu_book
                </span>
                Guidebook
              </button>
            </Link>
          </div>

          {/* Stage path */}
          <StagePath stages={stages} />
        </main>

        {/* ── Right Sidebar ── */}
        <aside
          className="hidden lg:flex flex-col w-80 shrink-0 sticky top-14 py-6 px-4 gap-4 overflow-y-auto"
          style={{ height: "calc(100vh - 56px)" }}
        >
          {/* Daily Quest */}
          <div
            className="rounded-2xl p-5"
            style={{ backgroundColor: C.surface, border: `2px solid ${C.border}` }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3
                className="font-bold text-xs uppercase tracking-widest"
                style={{ color: C.text, fontFamily: "'Nunito', sans-serif" }}
              >
                Daily Quest
              </h3>
              <button
                className="font-bold text-xs uppercase tracking-widest"
                style={{ color: C.primaryDim, fontFamily: "'Nunito', sans-serif" }}
              >
                View All
              </button>
            </div>
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: "rgba(255,185,93,0.15)" }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{
                    fontSize: 26,
                    color: C.tertiary,
                    fontVariationSettings: "'FILL' 1",
                  }}
                >
                  bolt
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className="font-bold text-sm text-white mb-1"
                  style={{ fontFamily: "'Nunito', sans-serif" }}
                >
                  Earn 10 XP
                </p>
                <div
                  className="w-full h-2.5 rounded-full"
                  style={{ backgroundColor: C.border }}
                >
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.min((totalXP % 100) / 10 * 10, 100)}%`,
                      backgroundColor: C.tertiary,
                    }}
                  />
                </div>
                <p className="text-xs mt-1" style={{ color: C.muted }}>
                  {Math.min(totalXP % 100, 10)} / 10
                </p>
              </div>
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{
                  backgroundColor: "rgba(130,81,0,0.25)",
                  border: "2px solid rgba(130,81,0,0.4)",
                }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: 20, color: C.tertiary }}
                >
                  emoji_events
                </span>
              </div>
            </div>
          </div>

          {/* League */}
          <div
            className="rounded-2xl p-5"
            style={{ backgroundColor: C.surface, border: `2px solid ${C.border}` }}
          >
            <div className="flex items-center justify-between mb-3">
              <h3
                className="font-bold text-xs uppercase tracking-widest"
                style={{ color: C.text, fontFamily: "'Nunito', sans-serif" }}
              >
                Bronze League
              </h3>
              <button
                className="font-bold text-xs uppercase tracking-widest"
                style={{ color: C.primaryDim, fontFamily: "'Nunito', sans-serif" }}
              >
                View League
              </button>
            </div>
            <div className="flex items-center gap-3">
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: C.surfaceHigh }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: 30, color: C.muted }}
                >
                  bedtime
                </span>
              </div>
              <p className="text-sm" style={{ color: C.muted, fontFamily: "'Nunito', sans-serif" }}>
                Complete a lesson to join this week&apos;s leaderboard!
              </p>
            </div>
          </div>

          {/* Super upgrade */}
          <div
            className="rounded-2xl p-5"
            style={{
              backgroundColor: "#1A1832",
              border: `2px solid ${C.border}`,
              borderBottom: `4px solid ${C.primaryDark}`,
            }}
          >
            <div
              className="inline-flex px-3 py-1 rounded-full mb-3 text-xs font-bold uppercase tracking-widest text-white"
              style={{
                background: `linear-gradient(135deg, ${C.primary}, ${C.secondary})`,
                fontFamily: "'Nunito', sans-serif",
              }}
            >
              SUPER
            </div>
            <h4
              className="text-lg font-extrabold text-white mb-2"
              style={{ fontFamily: "'Nunito', sans-serif" }}
            >
              Try Super for free
            </h4>
            <p className="text-sm mb-4" style={{ color: C.muted }}>
              No ads, unlimited hearts, and personalized practice!
            </p>
            <button
              className="btn-primary w-full py-3 rounded-xl font-bold text-sm uppercase tracking-wider text-white"
              style={{ backgroundColor: C.primary, fontFamily: "'Nunito', sans-serif" }}
            >
              Try 1 Week Free
            </button>
          </div>
        </aside>
      </div>

      {/* ── Mobile Bottom Nav ── */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex justify-around items-center h-16 border-t-2"
        style={{ backgroundColor: C.surface, borderColor: C.border }}
      >
        {mobileNav.map(({ icon, label, active }) => (
          <button
            key={label}
            className="flex flex-col items-center gap-0.5 py-2 px-3"
            style={{ color: active ? C.primaryDim : C.muted }}
          >
            <span
              className="material-symbols-outlined"
              style={{
                fontSize: 24,
                fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0",
              }}
            >
              {icon}
            </span>
            <span
              className="text-[10px] font-bold uppercase"
              style={{ fontFamily: "'Nunito', sans-serif" }}
            >
              {label}
            </span>
          </button>
        ))}
      </nav>
    </div>
  );
}
