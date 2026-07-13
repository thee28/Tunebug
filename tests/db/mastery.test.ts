import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { recordAnswer, getDueConcepts, getMasteryMap } from "@/lib/curriculum/mastery";
import { createTestUser, deleteTestUser } from "./helpers";

describe("adaptive mastery engine", () => {
  let userId: string;

  beforeEach(async () => {
    const user = await createTestUser();
    userId = user.id;
  });

  afterEach(async () => {
    await deleteTestUser(userId);
  });

  it("cold start: brand-new user has no due concepts and an empty map (no crash)", async () => {
    expect(await getDueConcepts(userId)).toEqual([]);
    expect((await getMasteryMap(userId)).size).toBe(0);
  });

  it("first correct answer creates the row with EMA score 0.3", async () => {
    const m = await recordAnswer({ userId, conceptId: "ear-note:C4", isCorrect: true });
    expect(m.timesSeen).toBe(1);
    expect(m.timesCorrect).toBe(1);
    expect(m.masteryScore).toBeCloseTo(0.3, 10);
    expect(m.currentStreak).toBe(1);
  });

  it("first wrong answer creates the row with score 0 and streak 0", async () => {
    const m = await recordAnswer({ userId, conceptId: "ear-note:D4", isCorrect: false });
    expect(m.masteryScore).toBe(0);
    expect(m.currentStreak).toBe(0);
    expect(m.timesCorrect).toBe(0);
  });

  it("wrong answer collapses the review interval back to 1 day", async () => {
    await recordAnswer({ userId, conceptId: "ear-note:E4", isCorrect: true });
    await recordAnswer({ userId, conceptId: "ear-note:E4", isCorrect: true });
    const grown = await recordAnswer({ userId, conceptId: "ear-note:E4", isCorrect: true });
    expect(grown.reviewIntervalDays).toBeGreaterThan(1);
    const wrong = await recordAnswer({ userId, conceptId: "ear-note:E4", isCorrect: false });
    expect(wrong.reviewIntervalDays).toBe(1);
    expect(wrong.currentStreak).toBe(0);
  });

  it("review interval growth caps at 60 days", async () => {
    for (let i = 0; i < 12; i++) {
      await recordAnswer({ userId, conceptId: "ear-note:F4", isCorrect: true });
    }
    const map = await getMasteryMap(userId);
    expect(map.get("ear-note:F4")?.reviewIntervalDays).toBe(60);
  });

  it("weakest concepts surface first in the due list", async () => {
    // C4: always wrong. D4: mixed. E4: always right (but due immediately? no —
    // correct answers push nextReviewAt into the future, so E4 shouldn't be due).
    await recordAnswer({ userId, conceptId: "ear-note:C4", isCorrect: false });
    await recordAnswer({ userId, conceptId: "ear-note:C4", isCorrect: false });
    await recordAnswer({ userId, conceptId: "ear-note:D4", isCorrect: true });
    await recordAnswer({ userId, conceptId: "ear-note:D4", isCorrect: false });
    await recordAnswer({ userId, conceptId: "ear-note:E4", isCorrect: true });

    // Look 2 days out: C4 and D4 (interval reset to 1 day) are due; E4 is not
    // (its first correct pushed the review ~2.5 days out).
    const due = await getDueConcepts(userId, new Date(Date.now() + 2 * 24 * 3600 * 1000));
    const ids = due.map((d) => d.conceptId);
    expect(ids[0]).toBe("ear-note:C4"); // lowest mastery first
    expect(ids).toContain("ear-note:D4");
    expect(ids).not.toContain("ear-note:E4");
  });

  it("perfect user: nothing due immediately, no divide-by-zero", async () => {
    for (const c of ["ear-note:C4", "ear-note:D4", "ear-note:E4"]) {
      await recordAnswer({ userId, conceptId: c, isCorrect: true });
    }
    const due = await getDueConcepts(userId); // asOf now
    expect(due).toEqual([]);
  });

  it("enharmonic concept ids: C#4 and Db4 would be SEPARATE rows (data invariant)", async () => {
    // The app generates only sharp names (NOTE_NAMES has no flats), so a flat
    // id must never appear. If both existed they'd track independently — a
    // data bug. This documents the invariant the slot generator relies on.
    await recordAnswer({ userId, conceptId: "ear-note:C#4", isCorrect: true });
    const map = await getMasteryMap(userId);
    expect(map.has("ear-note:C#4")).toBe(true);
    expect(map.has("ear-note:Db4")).toBe(false);
  });
});
