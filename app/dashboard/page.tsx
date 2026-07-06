export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { getStagesWithProgress } from "@/lib/db/stages";
import { getStreak } from "@/lib/db/streak";
import { getTodayQuestProgress, getTodayClaimedQuestIds } from "@/lib/db/quests";
import { getWeeklyLeaderboard } from "@/lib/db/leaderboard";
import { getAchievementViews } from "@/lib/db/achievements";
import { leagueForXP } from "@/lib/leagues";
import { CURRICULUM } from "@/lib/curriculum/config";
import type { Difficulty } from "@/lib/curriculum/content";
import DashboardContent from "@/components/dashboard/DashboardContent";
import LogoutButton from "@/components/LogoutButton";

const C = {
  dark: "var(--c-dark)",
  surface: "var(--c-surface)",
  surfaceHigh: "var(--c-surface-high)",
  border: "var(--c-border)",
  primary: "#574eb1",
  primaryDark: "#41379b",
  primaryDim: "#c5c0ff",
  secondary: "#006c4e",
  secondaryDark: "#00513a",
  secondaryDim: "#83f5c6",
  tertiary: "#ffb95d",
  muted: "var(--c-muted)",
  text: "var(--c-text)",
};

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ view?: string; sub?: string }> }) {
  const { view, sub } = await searchParams;
  const isPractice = view === "practice";
  const isQuests = view === "quests";
  const isProfile = view === "profile";
  const isLeaderboards = view === "leaderboards";
  const isSettings = view === "settings";
  const settingsSub = sub ?? "";

  const navItems = [
    { icon: "school", label: "Learn", href: "/dashboard", active: !isPractice && !isQuests && !isProfile && !isLeaderboards && !isSettings },
    { icon: "music_note", label: "Free Practice", href: "/dashboard?view=practice", active: isPractice },
    { icon: "emoji_events", label: "Leaderboards", href: "/dashboard?view=leaderboards", active: isLeaderboards },
    { icon: "military_tech", label: "Quests", href: "/dashboard?view=quests", active: isQuests },
    { icon: "person", label: "Profile", href: "/dashboard?view=profile", active: isProfile },
    { icon: "settings", label: "Settings", href: "/dashboard?view=settings", active: isSettings },
  ];

  const mobileNav = [
    { icon: "school", label: "Learn", href: "/dashboard", active: !isPractice && !isQuests && !isProfile && !isLeaderboards && !isSettings },
    { icon: "music_note", label: "Free Practice", href: "/dashboard?view=practice", active: isPractice },
    { icon: "emoji_events", label: "Ranks", href: "/dashboard?view=leaderboards", active: isLeaderboards },
    { icon: "person", label: "Profile", href: "/dashboard?view=profile", active: isProfile },
  ];
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [stages, streak, questProgress, dbUser, claimedQuestIds, leaderboard, achievements] =
    await Promise.all([
      getStagesWithProgress(session.user.id),
      getStreak(session.user.id),
      getTodayQuestProgress(session.user.id),
      import("@/lib/prisma").then(({ prisma }) =>
        prisma.user.findUnique({
          where: { id: session.user.id },
          select: {
            xp: true,
            createdAt: true,
            name: true,
            publicProfile: true,
            personalizedRecs: true,
          },
        })
      ),
      isQuests ? getTodayClaimedQuestIds(session.user.id) : Promise.resolve([]),
      isLeaderboards ? getWeeklyLeaderboard(session.user.id) : Promise.resolve(null),
      isProfile ? getAchievementViews(session.user.id) : Promise.resolve(null),
    ]);
  const totalXP = dbUser?.xp ?? 0;
  const currentStreak = streak?.currentStreak ?? 0;

  // Prefer the DB name — the JWT session copy goes stale after a rename.
  const displayName = dbUser?.name ?? session.user.name ?? session.user.email ?? "Musician";
  const initials = displayName
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const level = Math.floor(totalXP / 500) + 1;
  const xpInLevel = totalXP % 500;
  const xpProgress = Math.round((xpInLevel / 500) * 100);
  const completedStages = stages.filter((s) => s.status === "complete").length;
  const totalStages = stages.length;

  const difficulties: Record<string, Difficulty> = Object.fromEntries(
    CURRICULUM.map((s) => [s.slug, s.difficulty])
  );

  return (
    <div className="min-h-screen" style={{ backgroundColor: C.dark, color: C.text }}>

      {/* ── Header — full viewport width ── */}
      <header
        className="fixed top-0 left-0 right-0 z-50 h-14 flex items-center justify-between px-5 md:px-8"
        style={{ backgroundColor: C.dark, borderBottom: `2px solid ${C.border}` }}
      >
        <Link
          href="/"
          className="text-xl font-extrabold tracking-tight"
          style={{ color: C.primaryDim, fontFamily: "'Nunito', sans-serif" }}
        >
          Tunebug
        </Link>

        <div className="flex items-center gap-1">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl cursor-default select-none">
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 22, color: C.tertiary, fontVariationSettings: "'FILL' 1" }}
            >
              local_fire_department
            </span>
            <span className="font-bold text-sm" style={{ color: C.text, fontFamily: "'Nunito', sans-serif" }}>
              {currentStreak}
            </span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl cursor-default select-none">
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 22, color: C.primaryDim, fontVariationSettings: "'FILL' 1" }}
            >
              stars
            </span>
            <span className="font-bold text-sm" style={{ color: C.text, fontFamily: "'Nunito', sans-serif" }}>
              {totalXP}
            </span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl cursor-default select-none">
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 22, color: "#ffb4ab", fontVariationSettings: "'FILL' 1" }}
            >
              favorite
            </span>
            <span className="font-bold text-sm" style={{ color: C.text, fontFamily: "'Nunito', sans-serif" }}>
              &#8734;
            </span>
          </div>
        </div>
      </header>

      {/* ── Left Sidebar — fixed to left edge ── */}
      <aside
        className="hidden md:flex flex-col fixed left-0 top-14 bottom-0 w-64 py-5 px-3 gap-2 overflow-y-auto"
        style={{ backgroundColor: C.dark, borderRight: `2px solid ${C.border}` }}
      >
        <nav className="flex flex-col gap-0.5">
          {navItems.map(({ icon, label, href, active }) => (
            <Link
              key={label}
              href={href}
              className={`nav-link${active ? " nav-active" : ""} flex items-center gap-3 px-4 py-3 rounded-2xl font-bold uppercase tracking-wide`}
              style={{
                backgroundColor: active ? "rgba(87,78,177,0.15)" : "transparent",
                color: active ? C.primaryDim : C.muted,
                border: active ? `2px solid rgba(87,78,177,0.3)` : "2px solid transparent",
                fontFamily: "'Nunito', sans-serif",
                fontSize: "13px",
              }}
            >
              <span
                className="material-symbols-outlined"
                style={{ fontSize: 22, fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0" }}
              >
                {icon}
              </span>
              {label}
            </Link>
          ))}
        </nav>
      </aside>

      {/* ── Right Sidebar — fixed to right edge ── */}
      <aside
        className="hidden lg:flex flex-col fixed right-0 top-14 bottom-0 w-80 py-5 px-4 gap-4 overflow-y-auto"
        style={{ backgroundColor: C.dark, borderLeft: `2px solid ${C.border}` }}
      >
        {isSettings ? (
          <>
            {/* Account */}
            <div className="rounded-2xl p-5" style={{ backgroundColor: C.surface, border: `2px solid ${C.border}` }}>
              <h3 className="font-bold text-base mb-4" style={{ color: C.text, fontFamily: "'Nunito', sans-serif" }}>Account</h3>
              <nav className="flex flex-col">
                {[
                  { label: "Preferences", sub: "" },
                  { label: "Profile", sub: "profile" },
                  { label: "Privacy settings", sub: "privacy" },
                ].map(item => {
                  const active = settingsSub === item.sub;
                  return (
                    <Link
                      key={item.label}
                      href={`/dashboard?view=settings${item.sub ? `&sub=${item.sub}` : ""}`}
                      className="nav-link"
                      style={{
                        display: "block", padding: "10px 12px", borderRadius: 10,
                        backgroundColor: active ? "rgba(87,78,177,0.15)" : "transparent",
                        color: active ? C.primaryDim : C.muted,
                        fontFamily: "'Nunito', sans-serif", fontSize: 14, fontWeight: 500,
                        textDecoration: "none",
                      }}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Support */}
            <div className="rounded-2xl p-5" style={{ backgroundColor: C.surface, border: `2px solid ${C.border}` }}>
              <h3 className="font-bold text-base mb-3" style={{ color: C.text, fontFamily: "'Nunito', sans-serif" }}>Support</h3>
              <Link href="/help" className="nav-link" style={{ display: "block", padding: "10px 12px", borderRadius: 10, color: C.muted, fontFamily: "'Nunito', sans-serif", fontSize: 14, fontWeight: 500, textDecoration: "none" }}>
                Help Center
              </Link>
            </div>

            {/* Log Out */}
            <LogoutButton />
          </>
        ) : (
          <>
            {/* Your Progress */}
            <div
              className="rounded-2xl p-5"
              style={{ backgroundColor: C.surface, border: `2px solid ${C.border}` }}
            >
              <h3
                className="font-bold text-xs uppercase tracking-widest mb-4"
                style={{ color: C.text, fontFamily: "'Nunito', sans-serif" }}
              >
                Your Progress
              </h3>
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="material-symbols-outlined"
                      style={{ fontSize: 20, color: C.tertiary, fontVariationSettings: "'FILL' 1" }}
                    >
                      local_fire_department
                    </span>
                    <span className="text-sm font-semibold" style={{ color: C.muted, fontFamily: "'Nunito', sans-serif" }}>
                      Streak
                    </span>
                  </div>
                  <span className="font-bold" style={{ color: C.tertiary, fontFamily: "'Nunito', sans-serif" }}>
                    {currentStreak} days
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="material-symbols-outlined"
                      style={{ fontSize: 20, color: C.secondaryDim, fontVariationSettings: "'FILL' 1" }}
                    >
                      check_circle
                    </span>
                    <span className="text-sm font-semibold" style={{ color: C.muted, fontFamily: "'Nunito', sans-serif" }}>
                      Stages done
                    </span>
                  </div>
                  <span className="font-bold" style={{ color: C.secondaryDim, fontFamily: "'Nunito', sans-serif" }}>
                    {completedStages}/{totalStages}
                  </span>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span
                        className="material-symbols-outlined"
                        style={{ fontSize: 20, color: C.primaryDim, fontVariationSettings: "'FILL' 1" }}
                      >
                        stars
                      </span>
                      <span className="text-sm font-semibold" style={{ color: C.muted, fontFamily: "'Nunito', sans-serif" }}>
                        Level {level}
                      </span>
                    </div>
                    <span className="font-bold text-sm" style={{ color: C.primaryDim, fontFamily: "'Nunito', sans-serif" }}>
                      {totalXP} XP
                    </span>
                  </div>
                  <div className="w-full h-3 rounded-full" style={{ backgroundColor: C.border }}>
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${xpProgress}%`, backgroundColor: C.primaryDim }}
                    />
                  </div>
                  <p className="text-xs mt-1 text-right" style={{ color: C.muted, fontFamily: "'Nunito', sans-serif" }}>
                    {xpInLevel} / 500 to next level
                  </p>
                </div>
              </div>
            </div>

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
                <Link
                  href="/dashboard?view=quests"
                  className="font-bold text-xs uppercase tracking-widest"
                  style={{ color: C.primaryDim, fontFamily: "'Nunito', sans-serif", textDecoration: "none" }}
                >
                  View All
                </Link>
              </div>
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: "rgba(255,185,93,0.15)" }}
                >
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: 26, color: C.tertiary, fontVariationSettings: "'FILL' 1" }}
                  >
                    bolt
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm mb-1" style={{ color: C.text, fontFamily: "'Nunito', sans-serif" }}>
                    Earn 10 XP
                  </p>
                  <div className="w-full h-2.5 rounded-full" style={{ backgroundColor: C.border }}>
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${Math.min((questProgress.xpToday / 10) * 100, 100)}%`, backgroundColor: C.tertiary }}
                    />
                  </div>
                  <p className="text-xs mt-1" style={{ color: C.muted }}>
                    {Math.min(questProgress.xpToday, 10)} / 10
                  </p>
                </div>
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: "rgba(130,81,0,0.25)", border: "2px solid rgba(130,81,0,0.4)" }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 20, color: C.tertiary }}>
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
                  {leagueForXP(totalXP).name} League
                </h3>
                <Link
                  href="/dashboard?view=leaderboards"
                  className="font-bold text-xs uppercase tracking-widest"
                  style={{ color: C.primaryDim, fontFamily: "'Nunito', sans-serif", textDecoration: "none" }}
                >
                  View League
                </Link>
              </div>
              <div className="flex items-center gap-3">
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: C.surfaceHigh }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 30, color: C.muted }}>
                    bedtime
                  </span>
                </div>
                <p className="text-sm" style={{ color: C.muted, fontFamily: "'Nunito', sans-serif" }}>
                  Complete a lesson to join this week&apos;s leaderboard!
                </p>
              </div>
            </div>
          </>
        )}
      </aside>

      {/* ── Main content — inset by sidebar widths ── */}
      <main
        className="pt-14 pb-24 md:pb-8 md:ml-64 lg:mr-80 min-h-screen flex flex-col items-center px-6"
      >
        <Suspense fallback={null}>
          <DashboardContent
            stages={stages}
            difficulties={difficulties}
            stageTitle={stages.find((s) => s.status !== "complete")?.title ?? stages[0]?.title ?? ""}
            profile={{
              displayName,
              initials,
              email: session.user.email ?? "",
              totalXP,
              currentStreak,
              level,
              completedStages,
              totalStages,
              joinedAt: (dbUser?.createdAt ?? new Date()).toISOString(),
            }}
            questProgress={questProgress}
            claimedQuestIds={claimedQuestIds}
            leaderboard={leaderboard}
            achievements={achievements}
            privacySettings={{
              publicProfile: dbUser?.publicProfile ?? true,
              personalizedRecs: dbUser?.personalizedRecs ?? true,
            }}
          />
        </Suspense>
      </main>

      {/* ── Mobile Bottom Nav ── */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex justify-around items-center h-16 border-t-2"
        style={{ backgroundColor: C.surface, borderColor: C.border }}
      >
        {mobileNav.map(({ icon, label, href, active }) => (
          <Link
            key={label}
            href={href}
            className="flex flex-col items-center gap-0.5 py-2 px-3"
            style={{ color: active ? C.primaryDim : C.muted, textDecoration: "none" }}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 24, fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0" }}
            >
              {icon}
            </span>
            <span
              className="text-[10px] font-bold uppercase"
              style={{ fontFamily: "'Nunito', sans-serif" }}
            >
              {label}
            </span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
