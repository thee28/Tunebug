"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import LessonPath from "./LessonPath";
import SectionList from "./SectionList";
import { SectionTestRunner } from "@/components/exercises/SectionTestRunner";
import { generateSectionTestSteps } from "@/lib/curriculum/sectionTest";
import Guidebook from "./Guidebook";
import FreePractice from "./FreePractice";
import Quests from "./Quests";
import Leaderboards from "./Leaderboards";
import Profile, { type ProfileData } from "./Profile";
import Settings from "./Settings";
import type { Stage } from "@/types/lesson";
import type { Difficulty } from "@/lib/curriculum/content";
import type { QuestProgress } from "@/lib/db/quests";
import type { LeaderboardData } from "@/lib/db/leaderboard";
import type { AchievementView } from "@/lib/achievements";
import type { PrivacySettings } from "./Settings";

const C = {
  muted: "var(--c-muted)",
  text: "var(--c-text)",
  dark: "var(--c-dark)",
  border: "var(--c-border)",
};

interface Props {
  stages: Stage[];
  difficulties: Record<string, Difficulty>;
  stageTitle: string;
  profile: ProfileData;
  questProgress: QuestProgress;
  claimedQuestIds: string[];
  leaderboard: LeaderboardData | null;
  achievements: AchievementView[] | null;
  privacySettings: PrivacySettings;
}

type View = "path" | "sections" | "guidebook";

export default function DashboardContent({
  stages,
  difficulties,
  stageTitle,
  profile,
  questProgress,
  claimedQuestIds,
  leaderboard,
  achievements,
  privacySettings,
}: Props) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [view, setView] = useState<View>("path");
  const [guidebookUnit, setGuidebookUnit] = useState<{ slug: string; title: string } | null>(null);
  const [scrollToUnit, setScrollToUnit] = useState<string | undefined>();

  // Jump-ahead test, frozen at launch time so a post-pass router.refresh()
  // can't yank the runner out from under the user mid-result-screen.
  const [jumpTest, setJumpTest] = useState<{
    fromIndex: number;
    targetIndex: number;
    targetSlug: string;
    targetTitle: string;
    plan: ReturnType<typeof generateSectionTestSteps>;
    nonce: number; // remount key so retries reset the runner's internal state
  } | null>(null);

  // Remounts LessonPath after a successful jump so its cached completion
  // state re-derives from the refreshed server data.
  const passedCount = useMemo(
    () => stages.flatMap((s) => s.units.flatMap((u) => u.lessons)).filter((l) => l.passed).length,
    [stages]
  );

  function startJumpTest(targetIndex: number) {
    // Test covers everything from the first unfinished stage up to the target.
    const idx = stages.findIndex((s) => s.status !== "complete");
    const fromIndex = idx === -1 ? stages.length : idx;
    if (targetIndex <= fromIndex || targetIndex >= stages.length) return;
    setJumpTest({
      fromIndex,
      targetIndex,
      targetSlug: stages[targetIndex].slug,
      targetTitle: stages[targetIndex].title,
      plan: generateSectionTestSteps(fromIndex, targetIndex, Date.now()),
      nonce: Date.now(),
    });
  }

  function retryJumpTest() {
    setJumpTest((prev) =>
      prev
        ? { ...prev, plan: generateSectionTestSteps(prev.fromIndex, prev.targetIndex, Date.now()), nonce: Date.now() }
        : prev
    );
  }

  async function handleTestPassed() {
    if (!jumpTest) return;
    try {
      await fetch("/api/section-jump", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetStageSlug: jumpTest.targetSlug }),
      });
    } finally {
      router.refresh();
    }
  }

  const urlView = searchParams.get("view");
  const settingsSub = searchParams.get("sub") ?? "";
  const isPractice = urlView === "practice";
  const isQuests = urlView === "quests";
  const isProfile = urlView === "profile";
  const isLeaderboards = urlView === "leaderboards";
  const isSettings = urlView === "settings";
  const isUrlView = isPractice || isQuests || isProfile || isLeaderboards || isSettings;

  function openGuidebook(unitSlug: string, unitTitle: string) {
    setGuidebookUnit({ slug: unitSlug, title: unitTitle });
    setView("guidebook");
  }

  function backFromGuidebook() {
    setScrollToUnit(guidebookUnit?.slug);
    setView("path");
  }

  const stickyBack = (label: string, onClick: () => void) => (
    <div style={{
      position: "sticky", top: 56, zIndex: 10,
      backgroundColor: C.dark,
      paddingTop: 20, marginBottom: 20,
    }}>
      <button
        onClick={onClick}
        className="no-hover"
        style={{
          display: "flex", alignItems: "center", gap: 6,
          background: "none", border: "none", cursor: "pointer",
          color: C.muted, fontFamily: "'Nunito', sans-serif",
          fontSize: 14, fontWeight: 700,
          padding: "0 0 14px",
          width: "100%",
        }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 20 }}>arrow_back</span>
        {label}
      </button>
      <div style={{ height: 1, backgroundColor: C.border }} />
    </div>
  );

  return (
    <div style={{ width: "100%", maxWidth: 560 }}>
      {/* Jump-ahead test overlay */}
      <AnimatePresence>
        {jumpTest && (
          <motion.div
            key={`jump-test-${jumpTest.nonce}`}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ position: "fixed", inset: 0, zIndex: 200, backgroundColor: C.dark, overflowY: "auto" }}
          >
            <SectionTestRunner
              targetSectionNumber={jumpTest.targetIndex + 1}
              targetSectionTitle={jumpTest.targetTitle}
              steps={jumpTest.plan.steps}
              difficulty={jumpTest.plan.difficulty}
              onPassed={handleTestPassed}
              onRetry={retryJumpTest}
              onExit={() => setJumpTest(null)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait" initial={false}>
        {isPractice && (
          <motion.div
            key="practice"
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.18 }}
          >
            <FreePractice />
          </motion.div>
        )}

        {isLeaderboards && (
          <motion.div
            key="leaderboards"
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.18 }}
          >
            <Leaderboards
              totalXP={profile.totalXP}
              displayName={profile.displayName}
              initials={profile.initials}
              data={leaderboard}
            />
          </motion.div>
        )}

        {isQuests && (
          <motion.div
            key="quests"
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.18 }}
          >
            <Quests questProgress={questProgress} claimedQuestIds={claimedQuestIds} />
          </motion.div>
        )}

        {isSettings && (
          <motion.div
            key="settings"
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.18 }}
          >
            <Settings
              settingsSub={settingsSub}
              displayName={profile.displayName}
              email={profile.email}
              privacy={privacySettings}
            />
          </motion.div>
        )}

        {isProfile && (
          <motion.div
            key="profile"
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.18 }}
          >
            <Profile data={profile} achievements={achievements ?? []} />
          </motion.div>
        )}

        {!isUrlView && view === "sections" && (
          <motion.div
            key="sections"
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.18 }}
          >
            {stickyBack("Back", () => setView("path"))}
            <h1 style={{ color: C.text, fontFamily: "'Nunito', sans-serif", fontSize: 20, fontWeight: 900, margin: "0 0 16px" }}>
              All Sections
            </h1>
            <SectionList stages={stages} onBack={() => setView("path")} onStartJumpTest={startJumpTest} />
          </motion.div>
        )}

        {!isUrlView && view === "guidebook" && guidebookUnit && (
          <motion.div
            key="guidebook"
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.18 }}
          >
            {stickyBack("Back", backFromGuidebook)}
            <Guidebook
              unitSlug={guidebookUnit.slug}
              unitTitle={guidebookUnit.title}
              stageTitle={stageTitle}
            />
          </motion.div>
        )}

        {!isUrlView && view === "path" && (
          <motion.div
            key="path"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            style={{ width: "100%" }}
          >
            <LessonPath
              key={passedCount}
              stages={stages}
              difficulties={difficulties}
              onShowSections={() => setView("sections")}
              onShowGuidebook={openGuidebook}
              onStartJumpTest={startJumpTest}
              scrollToUnitSlug={scrollToUnit}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
