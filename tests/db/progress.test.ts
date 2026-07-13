import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { prisma } from "@/lib/prisma";
import { saveProgress, getUserProgress } from "@/lib/db/progress";
import { createTestUser, deleteTestUser, firstLesson } from "./helpers";

describe("saveProgress XP accounting", () => {
  let userId: string;
  let lessonId: string;
  let xpReward: number;

  beforeEach(async () => {
    const user = await createTestUser();
    userId = user.id;
    const lesson = await firstLesson();
    lessonId = lesson.id;
    xpReward = lesson.xpReward;
  });

  afterEach(async () => {
    await deleteTestUser(userId);
  });

  it("first pass grants the lesson XP exactly once", async () => {
    const { xpEarned } = await saveProgress({ userId, lessonId, score: 90, passed: true, xpReward });
    expect(xpEarned).toBe(xpReward);
    const user = await prisma.user.findUnique({ where: { id: userId } });
    expect(user?.xp).toBe(xpReward);
  });

  it("re-passing the same lesson grants 0 XP (no farming)", async () => {
    await saveProgress({ userId, lessonId, score: 90, passed: true, xpReward });
    const second = await saveProgress({ userId, lessonId, score: 100, passed: true, xpReward });
    expect(second.xpEarned).toBe(0);
    const user = await prisma.user.findUnique({ where: { id: userId } });
    expect(user?.xp).toBe(xpReward);
  });

  it("failing grants no XP; a later pass still gets first-pass XP", async () => {
    const fail = await saveProgress({ userId, lessonId, score: 30, passed: false, xpReward });
    expect(fail.xpEarned).toBe(0);
    const pass = await saveProgress({ userId, lessonId, score: 85, passed: true, xpReward });
    expect(pass.xpEarned).toBe(xpReward);
  });

  it("attempts increment across submissions", async () => {
    await saveProgress({ userId, lessonId, score: 10, passed: false, xpReward });
    await saveProgress({ userId, lessonId, score: 20, passed: false, xpReward });
    const { progress } = await saveProgress({ userId, lessonId, score: 90, passed: true, xpReward });
    expect(progress.attempts).toBe(3);
  });

  it("concurrent double-submit cannot double-grant XP (serializable txn)", async () => {
    const [a, b] = await Promise.all([
      saveProgress({ userId, lessonId, score: 95, passed: true, xpReward }),
      saveProgress({ userId, lessonId, score: 95, passed: true, xpReward }),
    ]);
    expect(a.xpEarned + b.xpEarned).toBe(xpReward); // exactly one grant
    const user = await prisma.user.findUnique({ where: { id: userId } });
    expect(user?.xp).toBe(xpReward);
  });

  it("getUserProgress returns newest-first history", async () => {
    await saveProgress({ userId, lessonId, score: 10, passed: false, xpReward });
    await saveProgress({ userId, lessonId, score: 90, passed: true, xpReward });
    const rows = await getUserProgress(userId);
    expect(rows).toHaveLength(2);
    expect(rows[0].score).toBe(90);
  });
});
