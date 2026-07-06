// Achievement definitions and progress math, shared by the profile UI and the
// server-side unlock sync. Pure module — safe to import from client components.

import type { AchievementType } from "@prisma/client";

// The raw user stats achievements are computed from. Assembled server-side.
export interface AchievementStats {
  passedLessons: number;
  hasPerfectScore: boolean;
  longestStreak: number;
  totalXP: number;
  completedStages: number;
  totalStages: number;
}

export interface AchievementDef {
  type: AchievementType;
  name: string;
  description: string;
  icon: string;
  iconBg: string;
  iconColor: string;
  goal: number;
  current: (s: AchievementStats) => number;
}

export const ACHIEVEMENT_DEFS: AchievementDef[] = [
  {
    type: "FIRST_LESSON",
    name: "First Steps",
    description: "Pass your first lesson",
    icon: "flag",
    iconBg: "#00629b",
    iconColor: "#a5d8ff",
    goal: 1,
    current: (s) => Math.min(s.passedLessons, 1),
  },
  {
    type: "PERFECT_SCORE",
    name: "Flawless",
    description: "Score 100% in a lesson",
    icon: "workspace_premium",
    iconBg: "#825100",
    iconColor: "#ffb95d",
    goal: 1,
    current: (s) => (s.hasPerfectScore ? 1 : 0),
  },
  {
    type: "STREAK_7",
    name: "Wildfire",
    description: "Reach a 7 day streak",
    icon: "local_fire_department",
    iconBg: "#c62828",
    iconColor: "#ffb4ab",
    goal: 7,
    current: (s) => Math.min(s.longestStreak, 7),
  },
  {
    type: "STREAK_30",
    name: "Eternal Flame",
    description: "Reach a 30 day streak",
    icon: "whatshot",
    iconBg: "#8b2828",
    iconColor: "#f87171",
    goal: 30,
    current: (s) => Math.min(s.longestStreak, 30),
  },
  {
    type: "XP_250",
    name: "Sage",
    description: "Earn 250 XP",
    icon: "auto_awesome",
    iconBg: "#2e7d32",
    iconColor: "#83f5c6",
    goal: 250,
    current: (s) => Math.min(s.totalXP, 250),
  },
  {
    type: "XP_1000",
    name: "Virtuoso",
    description: "Earn 1,000 XP",
    icon: "stars",
    iconBg: "#4527a0",
    iconColor: "#c5c0ff",
    goal: 1000,
    current: (s) => Math.min(s.totalXP, 1000),
  },
  {
    type: "STAGE_COMPLETE",
    name: "Graduate",
    description: "Complete your first stage",
    icon: "school",
    iconBg: "#4527a0",
    iconColor: "#c5c0ff",
    goal: 1,
    current: (s) => Math.min(s.completedStages, 1),
  },
  {
    type: "ALL_STAGES",
    name: "Scholar",
    description: "Complete every stage",
    icon: "military_tech",
    iconBg: "#825100",
    iconColor: "#ffb95d",
    goal: 1,
    current: (s) => (s.totalStages > 0 && s.completedStages >= s.totalStages ? 1 : 0),
  },
];

export function earnedTypes(stats: AchievementStats): AchievementType[] {
  return ACHIEVEMENT_DEFS.filter((d) => d.current(stats) >= d.goal).map((d) => d.type);
}

// Serialisable shape passed from server components to the profile UI.
export interface AchievementView {
  type: AchievementType;
  name: string;
  description: string;
  icon: string;
  iconBg: string;
  iconColor: string;
  goal: number;
  current: number;
  unlockedAt: string | null; // ISO string
}
