import { describe, it, expect } from "vitest";
import { weekStartUTC } from "@/lib/utils";
import { earnedTypes, ACHIEVEMENT_DEFS, type AchievementStats } from "@/lib/achievements";
import { QUEST_DEFS, getQuestDef, isQuestComplete } from "@/lib/quests";
import { leagueForXP, leagueIndex, LEAGUES } from "@/lib/leagues";

const baseStats: AchievementStats = {
  passedLessons: 0,
  hasPerfectScore: false,
  longestStreak: 0,
  totalXP: 0,
  completedStages: 0,
  totalStages: 5,
};

describe("weekStartUTC", () => {
  it("returns the same Monday for every day of that week", () => {
    // 2026-07-06 is a Monday.
    const monday = new Date(Date.UTC(2026, 6, 6, 0, 0, 0));
    for (let offset = 0; offset < 7; offset++) {
      const day = new Date(Date.UTC(2026, 6, 6 + offset, 15, 30));
      expect(weekStartUTC(day).toISOString()).toBe(monday.toISOString());
    }
  });

  it("rolls a Sunday back to the previous Monday, not forward", () => {
    const sunday = new Date(Date.UTC(2026, 6, 12, 23, 59));
    expect(weekStartUTC(sunday).getUTCDay()).toBe(1);
    expect(weekStartUTC(sunday).toISOString()).toBe(
      new Date(Date.UTC(2026, 6, 6)).toISOString()
    );
  });

  it("is midnight UTC", () => {
    const d = weekStartUTC(new Date());
    expect(d.getUTCHours()).toBe(0);
    expect(d.getUTCMinutes()).toBe(0);
  });
});

describe("achievements", () => {
  it("earns nothing with zero stats", () => {
    expect(earnedTypes(baseStats)).toEqual([]);
  });

  it("earns FIRST_LESSON after one passed lesson", () => {
    expect(earnedTypes({ ...baseStats, passedLessons: 1 })).toContain("FIRST_LESSON");
  });

  it("XP milestones unlock at their thresholds", () => {
    const at249 = earnedTypes({ ...baseStats, totalXP: 249 });
    expect(at249).not.toContain("XP_250");
    const at250 = earnedTypes({ ...baseStats, totalXP: 250 });
    expect(at250).toContain("XP_250");
    expect(at250).not.toContain("XP_1000");
    expect(earnedTypes({ ...baseStats, totalXP: 1000 })).toContain("XP_1000");
  });

  it("ALL_STAGES requires every stage, not just some", () => {
    expect(earnedTypes({ ...baseStats, completedStages: 4 })).not.toContain("ALL_STAGES");
    const all = earnedTypes({ ...baseStats, completedStages: 5 });
    expect(all).toContain("ALL_STAGES");
    expect(all).toContain("STAGE_COMPLETE");
  });

  it("ALL_STAGES never unlocks when there are no stages", () => {
    expect(
      earnedTypes({ ...baseStats, totalStages: 0, completedStages: 0 })
    ).not.toContain("ALL_STAGES");
  });

  it("streak achievements use the longest streak", () => {
    const types = earnedTypes({ ...baseStats, longestStreak: 30 });
    expect(types).toContain("STREAK_7");
    expect(types).toContain("STREAK_30");
  });

  it("every def's progress is capped at its goal", () => {
    const maxed: AchievementStats = {
      passedLessons: 999,
      hasPerfectScore: true,
      longestStreak: 999,
      totalXP: 99999,
      completedStages: 99,
      totalStages: 5,
    };
    for (const def of ACHIEVEMENT_DEFS) {
      expect(def.current(maxed)).toBeLessThanOrEqual(def.goal);
    }
  });
});

describe("quests", () => {
  it("looks up quests by id", () => {
    for (const def of QUEST_DEFS) {
      expect(getQuestDef(def.id)).toBe(def);
    }
    expect(getQuestDef("nope")).toBeUndefined();
  });

  it("completion respects each quest's goal", () => {
    const none = { xpToday: 0, lessonsToday: 0, highScoreToday: 0 };
    const all = { xpToday: 10, lessonsToday: 2, highScoreToday: 1 };
    for (const def of QUEST_DEFS) {
      expect(isQuestComplete(def, none)).toBe(false);
      expect(isQuestComplete(def, all)).toBe(true);
    }
  });

  it("progress is capped at the goal", () => {
    const over = { xpToday: 500, lessonsToday: 20, highScoreToday: 1 };
    for (const def of QUEST_DEFS) {
      expect(def.progress(over)).toBeLessThanOrEqual(def.goal);
    }
  });
});

describe("leagues", () => {
  it("maps XP to tiers at the documented thresholds", () => {
    expect(leagueForXP(0).name).toBe("Bronze");
    expect(leagueForXP(799).name).toBe("Bronze");
    expect(leagueForXP(800).name).toBe("Silver");
    expect(leagueForXP(2000).name).toBe("Gold");
    expect(leagueForXP(5000).name).toBe("Diamond");
    expect(leagueForXP(999999).name).toBe("Diamond");
  });

  it("index stays within bounds", () => {
    expect(leagueIndex(-5)).toBe(0);
    expect(leagueIndex(10 ** 9)).toBe(LEAGUES.length - 1);
  });
});
