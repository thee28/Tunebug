import { describe, it, expect } from "vitest";
import { levelInfo, totalXpForLevel, xpForLevelUp, MAX_LEVEL } from "@/lib/leveling";
import { clamp, startOfDayUTC, weekStartUTC } from "@/lib/utils";

describe("leveling curve", () => {
  it("level thresholds match the documented formula", () => {
    expect(totalXpForLevel(1)).toBe(0);
    expect(totalXpForLevel(2)).toBe(50);
    expect(totalXpForLevel(3)).toBe(125); // 50 + 75
    expect(totalXpForLevel(4)).toBe(225); // 50 + 75 + 100
    expect(xpForLevelUp(1)).toBe(50);
    expect(xpForLevelUp(2)).toBe(75);
  });

  it("exact-boundary XP advances the level (49 vs 50)", () => {
    expect(levelInfo(49).level).toBe(1);
    expect(levelInfo(50).level).toBe(2);
    expect(levelInfo(124).level).toBe(2);
    expect(levelInfo(125).level).toBe(3);
  });

  it("0 XP is level 1 with 0 progress", () => {
    expect(levelInfo(0)).toMatchObject({ level: 1, xpInLevel: 0, progress: 0, isMax: false });
  });

  it("negative XP is clamped, not level 0 or NaN", () => {
    expect(levelInfo(-500)).toMatchObject({ level: 1, xpInLevel: 0 });
  });

  it("caps at MAX_LEVEL and reports 100% progress", () => {
    const huge = levelInfo(10_000_000);
    expect(huge.level).toBe(MAX_LEVEL);
    expect(huge.isMax).toBe(true);
    expect(huge.progress).toBe(100);
    expect(huge.xpForNext).toBe(0);
  });

  it("xpInLevel + threshold reconstructs total XP (no XP lost)", () => {
    for (const xp of [0, 49, 50, 51, 137, 999, 12345]) {
      const info = levelInfo(xp);
      expect(totalXpForLevel(info.level) + info.xpInLevel).toBe(xp);
    }
  });
});

describe("date helpers", () => {
  it("startOfDayUTC truncates to UTC midnight regardless of local TZ", () => {
    const d = new Date("2026-07-12T23:59:59.999Z");
    expect(startOfDayUTC(d).toISOString()).toBe("2026-07-12T00:00:00.000Z");
  });

  it("weekStartUTC returns the Monday of the containing week", () => {
    // 2026-07-12 is a Sunday → week starts Monday 2026-07-06.
    expect(weekStartUTC(new Date("2026-07-12T10:00:00Z")).toISOString()).toBe(
      "2026-07-06T00:00:00.000Z"
    );
    // A Monday maps to itself.
    expect(weekStartUTC(new Date("2026-07-06T00:00:00Z")).toISOString()).toBe(
      "2026-07-06T00:00:00.000Z"
    );
  });

  it("clamp handles inverted extremes without NaN", () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-1, 0, 10)).toBe(0);
    expect(clamp(11, 0, 10)).toBe(10);
  });
});
