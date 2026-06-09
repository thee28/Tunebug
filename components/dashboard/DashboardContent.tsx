"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import LessonPath from "./LessonPath";
import SectionList from "./SectionList";
import Guidebook from "./Guidebook";
import FreePractice from "./FreePractice";
import Quests from "./Quests";
import Leaderboards from "./Leaderboards";
import Profile, { type ProfileData } from "./Profile";
import Settings from "./Settings";
import type { Stage } from "@/types/lesson";
import type { Difficulty } from "@/lib/curriculum/content";

const C = {
  muted: "#938F99",
  text: "#f3eff5",
  dark: "#0F0F13",
  border: "#33313D",
};

interface Props {
  stages: Stage[];
  difficulties: Record<string, Difficulty>;
  stageTitle: string;
  profile: ProfileData;
}

type View = "path" | "sections" | "guidebook";

export default function DashboardContent({ stages, difficulties, stageTitle, profile }: Props) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [view, setView] = useState<View>("path");
  const [guidebookUnit, setGuidebookUnit] = useState<{ slug: string; title: string } | null>(null);
  const [scrollToUnit, setScrollToUnit] = useState<string | undefined>();

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
            <Quests />
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
            <Profile data={profile} />
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
            <SectionList stages={stages} onBack={() => setView("path")} />
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
              stages={stages}
              difficulties={difficulties}
              onShowSections={() => setView("sections")}
              onShowGuidebook={openGuidebook}
              scrollToUnitSlug={scrollToUnit}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
