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

  /**
   * KNOWN LIMITATION (documented, not asserted away): streaks are UTC-day
   * based with no per-user timezone. A user in UTC−8 who plays 7 PM local
   * on Monday and 9 PM local on Tuesday hits UTC days Tue+Wed — fine. But
   * playing 5 PM Monday (01:00 UTC Tue) then 5 PM Tuesday (01:00 UTC Wed)
   * also works... while 11 PM local Mon (07:00 UTC Tue) and 1 AM local Wed
   * (09:00 UTC Thu) SKIPS a UTC day and breaks the streak even though the
   * user missed only one local evening. This test pins the current
   * (UTC-based) behavior so the eventual TZ fix must consciously change it.
   */
  it("UTC-day semantics: a local-evening pattern can break a streak (known TZ bug)", async () => {
    // User in UTC-8. Plays Mon 11 PM local = Tue 07:00 UTC.
    setNow("2026-07-07T07:00:00Z");
    await updateStreak(userId);
    // Plays Wed 1:00 AM local = Wed 09:00 UTC... wait, that's +1 UTC day → fine.
    // The breaking case: next play Thu 01:00 local = Thu 09:00 UTC = 2 UTC days later.
    setNow("2026-07-09T09:00:00Z");
    await updateStreak(userId);
    const s = await getStreak(userId);
    // Current behavior: reset. A TZ-aware fix would make this 2.
    expect(s?.currentStreak).toBe(1);
  });
});
