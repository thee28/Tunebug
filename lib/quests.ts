// Daily quest definitions, shared by the quests UI and the claim API.
// Pure module — safe to import from client components.

import type { QuestProgress } from "@/lib/db/quests";

export interface QuestDef {
  id: string;
  label: string;
  icon: string;
  goal: number;
  rewardXP: number;
  progress: (qp: QuestProgress) => number;
}

export const DEFAULT_DAILY_XP_GOAL = 10;

// The "xp" quest goal is personalized by the placement survey's time
// commitment (see lib/onboarding.ts) — higher commitment, higher daily goal.
// The other two quests are fixed. Reward scales with the goal.
export function buildQuestDefs(dailyXpGoal: number = DEFAULT_DAILY_XP_GOAL): QuestDef[] {
  const goal = Math.max(1, dailyXpGoal);
  return [
    {
      id: "xp",
      label: `Earn ${goal} XP today`,
      icon: "bolt",
      goal,
      rewardXP: Math.max(5, Math.round(goal / 2)),
      progress: (qp) => Math.min(qp.xpToday, goal),
    },
    {
      id: "lessons",
      label: "Complete 2 lessons",
      icon: "school",
      goal: 2,
      rewardXP: 10,
      progress: (qp) => Math.min(qp.lessonsToday, 2),
    },
    {
      id: "score",
      label: "Score 80% or higher in a lesson",
      icon: "gps_fixed",
      goal: 1,
      rewardXP: 10,
      progress: (qp) => qp.highScoreToday,
    },
  ];
}

export const QUEST_DEFS: QuestDef[] = buildQuestDefs();

export function getQuestDef(
  id: string,
  dailyXpGoal: number = DEFAULT_DAILY_XP_GOAL
): QuestDef | undefined {
  const defs = dailyXpGoal === DEFAULT_DAILY_XP_GOAL ? QUEST_DEFS : buildQuestDefs(dailyXpGoal);
  return defs.find((q) => q.id === id);
}

export function isQuestComplete(def: QuestDef, qp: QuestProgress): boolean {
  return def.progress(qp) >= def.goal;
}
