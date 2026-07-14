import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { updateStreak, getStreak } from "@/lib/db/streak";
import { createTestUser, deleteTestUser } from "./helpers";

// Only Date is faked — pg/prisma still need real timers for I/O.
function setNow(iso: string) {
  vi.setSystemTime(new Date(iso));
}

describe("updateStreak", () => {
  let userId: string;

  beforeEach(async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    const user = await createTestUser();
    userId = user.id;
  });

  afterEach(async () => {
    vi.useRealTimers();
    await deleteTestUser(userId);
  });

  it("first completion starts a streak of 1", async () => {
    setNow("2026-07-10T15:00:00Z");
    await updateStreak(userId);
    const s = await getStreak(userId);
    expect(s?.currentStreak).toBe(1);
    expect(s?.longestStreak).toBe(1);
    expect(s?.lastActivityDate?.toISOString()).toBe("2026-07-10T00:00:00.000Z");
  });

  it("second completion on the same UTC day does NOT double-increment", async () => {
    setNow("2026-07-10T08:00:00Z");
    await updateStreak(userId);
    setNow("2026-07-10T22:00:00Z");
    await updateStreak(userId);
    const s = await getStreak(userId);
    expect(s?.currentStreak).toBe(1);
  });

  it("same-day completion after a multi-day streak neither increments NOR resets", async () => {
    // Catches both failure modes: double-increment (3→4) and the sneakier
    // same-day reset (3→1) if the diff<=0 guard is loosened to diff<0.
    setNow("2026-07-09T12:00:00Z");
    await updateStreak(userId);
    setNow("2026-07-10T12:00:00Z");
    await updateStreak(userId);
    setNow("2026-07-11T12:00:00Z");
    await updateStreak(userId);
    setNow("2026-07-11T20:00:00Z"); // same day again
    await updateStreak(userId);
    const s = await getStreak(userId);
    expect(s?.currentStreak).toBe(3);
  });

  it("consecutive UTC days increment; longest tracks current", async () => {
    setNow("2026-07-10T12:00:00Z");
    await updateStreak(userId);
    setNow("2026-07-11T12:00:00Z");
    await updateStreak(userId);
    setNow("2026-07-12T12:00:00Z");
    await updateStreak(userId);
    const s = await getStreak(userId);
    expect(s?.currentStreak).toBe(3);
    expect(s?.longestStreak).toBe(3);
  });

  it("crossing the UTC midnight boundary by minutes still counts as next day", async () => {
    // 23:58 UTC then 00:02 UTC — the user-visible '11:58 PM / 12:02 AM' case
    // for a UTC-aligned user.
    setNow("2026-07-10T23:58:00Z");
    await updateStreak(userId);
    setNow("2026-07-11T00:02:00Z");
    await updateStreak(userId);
    const s = await getStreak(userId);
    expect(s?.currentStreak).toBe(2);
  });

  it("skipping exactly one UTC day resets to 1 but keeps longest", async () => {
    setNow("2026-07-08T12:00:00Z");
    await updateStreak(userId);
    setNow("2026-07-09T12:00:00Z");
    await updateStreak(userId);
    // Skip the 10th entirely.
    setNow("2026-07-11T12:00:00Z");
    await updateStreak(userId);
    const s = await getStreak(userId);
    expect(s?.currentStreak).toBe(1);
    expect(s?.longestStreak).toBe(2);
  });

  it("clock skew (today < lastActivityDate) never nukes an active streak", async () => {
    setNow("2026-07-11T12:00:00Z");
    await updateStreak(userId);
    // A replica with a slow clock processes a write "yesterday".
    setNow("2026-07-10T23:00:00Z");
    await updateStreak(userId);
    const s = await getStreak(userId);
    expect(s?.currentStreak).toBe(1);
    expect(s?.lastActivityDate?.toISOString()).toBe("2026-07-11T00:00:00.000Z");
  });

  describe("user-timezone day boundaries (America/Los_Angeles, UTC−7 in July)", () => {
    let laUserId: string;

    beforeEach(async () => {
      const u = await createTestUser({ timezone: "America/Los_Angeles" });
      laUserId = u.id;
    });

    afterEach(async () => {
      await deleteTestUser(laUserId);
    });

    it("11:58 PM then 12:02 AM LOCAL increments even inside one UTC day", async () => {
      // Jul 10 23:58 LA = Jul 11 06:58 UTC; Jul 11 00:02 LA = Jul 11 07:02 UTC.
      // Same UTC day — but consecutive LOCAL days must count as a streak.
      setNow("2026-07-11T06:58:00Z");
      await updateStreak(laUserId);
      setNow("2026-07-11T07:02:00Z");
      await updateStreak(laUserId);
      const s = await getStreak(laUserId);
      expect(s?.currentStreak).toBe(2);
    });

    it("crossing UTC midnight mid-local-afternoon does NOT double-count", async () => {
      // Jul 10 16:50 LA = Jul 10 23:50 UTC; Jul 10 17:10 LA = Jul 11 00:10 UTC.
      // Different UTC days — but the SAME local day stays a single streak day.
      setNow("2026-07-10T23:50:00Z");
      await updateStreak(laUserId);
      setNow("2026-07-11T00:10:00Z");
      await updateStreak(laUserId);
      const s = await getStreak(laUserId);
      expect(s?.currentStreak).toBe(1);
    });

    it("skipping one local evening still resets", async () => {
      // Jul 7 and Jul 9 local days — Jul 8 missed.
      setNow("2026-07-07T07:00:00Z"); // Jul 7 00:00 LA
      await updateStreak(laUserId);
      setNow("2026-07-09T09:00:00Z"); // Jul 9 02:00 LA
      await updateStreak(laUserId);
      const s = await getStreak(laUserId);
      expect(s?.currentStreak).toBe(1);
    });

    it("garbage timezone falls back to UTC instead of crashing", async () => {
      const bad = await createTestUser({ timezone: "Not/AZone" });
      setNow("2026-07-10T12:00:00Z");
      await updateStreak(bad.id);
      const s = await getStreak(bad.id);
      expect(s?.currentStreak).toBe(1);
      await deleteTestUser(bad.id);
    });
  });
});
