// Placement-survey configuration, shared by the onboarding UI and the
// /api/onboarding route. Pure module — safe to import from client components.
//
// The curriculum has 5 sections (see lib/curriculum/config.ts), so each skill
// level maps 1:1 onto a starting section index (0 = Beginner … 4 = Advanced).

export interface SkillLevelOption {
  id: string;
  label: string;
  /** How many signal bars to light up in the UI (1..5). */
  bars: number;
  /** 0-based section the learner should be placed into. */
  targetSectionIndex: number;
}

export const SKILL_LEVELS: SkillLevelOption[] = [
  { id: "new", label: "I'm new to music", bars: 1, targetSectionIndex: 0 },
  { id: "some-notes", label: "I know some notes", bars: 2, targetSectionIndex: 1 },
  { id: "basics", label: "I can read basic sheet music", bars: 3, targetSectionIndex: 2 },
  { id: "intervals", label: "I can hear intervals and chords", bars: 4, targetSectionIndex: 3 },
  { id: "fluent", label: "I'm comfortable with most theory", bars: 5, targetSectionIndex: 4 },
];

export interface TimeCommitmentOption {
  id: string;
  minutes: number;
  label: string;
  /** Daily-quest XP goal this commitment maps to. */
  dailyXpGoal: number;
}

// Higher commitment => higher daily XP goal.
export const TIME_COMMITMENTS: TimeCommitmentOption[] = [
  { id: "casual", minutes: 5, label: "Casual", dailyXpGoal: 10 },
  { id: "regular", minutes: 10, label: "Regular", dailyXpGoal: 20 },
  { id: "serious", minutes: 15, label: "Serious", dailyXpGoal: 30 },
  { id: "intense", minutes: 20, label: "Intense", dailyXpGoal: 40 },
];

export type StartMethod = "scratch" | "find-level";

export function getSkillLevel(id: string): SkillLevelOption | undefined {
  return SKILL_LEVELS.find((s) => s.id === id);
}

export function getTimeCommitment(id: string): TimeCommitmentOption | undefined {
  return TIME_COMMITMENTS.find((t) => t.id === id);
}
