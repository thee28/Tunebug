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

export const QUEST_DEFS: QuestDef[] = [
  {
    id: "xp",
    label: "Earn 10 XP today",
    icon: "bolt",
    goal: 10,
    rewardXP: 5,
    progress: (qp) => Math.min(qp.xpToday, 10),
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

export function getQuestDef(id: string): QuestDef | undefined {
  return QUEST_DEFS.find((q) => q.id === id);
}

export function isQuestComplete(def: QuestDef, qp: QuestProgress): boolean {
  return def.progress(qp) >= def.goal;
}
