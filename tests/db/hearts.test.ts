import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { getHearts, loseHeart } from "@/lib/db/hearts";
import { HEARTS_MAX, HEART_REFILL_MS } from "@/lib/hearts";
import { createTestUser, deleteTestUser } from "./helpers";

const H = HEART_REFILL_MS; // 3h

describe("hearts refill", () => {
  let userId: string;

  beforeEach(async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-07-12T00:00:00Z"));
    const user = await createTestUser();
    userId = user.id;
  });

  afterEach(async () => {
    vi.useRealTimers();
    await deleteTestUser(userId);
  });

  it("new user starts full with no refill timer", async () => {
    const s = await getHearts(userId);
    expect(s.hearts).toBe(HEARTS_MAX);
    expect(s.nextRefillAt).toBeNull();
  });

  it("losing a heart from full starts the 3h clock", async () => {
    const s = await loseHeart(userId);
    expect(s.hearts).toBe(HEARTS_MAX - 1);
    expect(s.nextRefillAt).toBe(new Date(Date.now() + H).toISOString());
  });

  it("hearts never go below 0", async () => {
    for (let i = 0; i < HEARTS_MAX + 3; i++) await loseHeart(userId);
    const s = await getHearts(userId);
    expect(s.hearts).toBe(0);
  });

  it("one heart returns after exactly 3h, not before", async () => {
    await loseHeart(userId); // 4 hearts, clock anchored at t0
    vi.setSystemTime(new Date(Date.now() + H - 1000));
    expect((await getHearts(userId)).hearts).toBe(HEARTS_MAX - 1);
    vi.setSystemTime(new Date(Date.now() + 1000));
    expect((await getHearts(userId)).hearts).toBe(HEARTS_MAX);
  });

  it("multiple windows elapsed grant multiple hearts, capped at max", async () => {
    for (let i = 0; i < HEARTS_MAX; i++) await loseHeart(userId); // 0 hearts
    vi.setSystemTime(new Date(Date.now() + 100 * H)); // days later
    const s = await getHearts(userId);
    expect(s.hearts).toBe(HEARTS_MAX);
    expect(s.nextRefillAt).toBeNull();
  });

  it("losing a heart below max keeps partial refill progress", async () => {
    await loseHeart(userId); // 4, clock at t0
    vi.setSystemTime(new Date(Date.now() + H / 2)); // 1.5h in
    const s = await loseHeart(userId); // 3 — but clock must NOT reset
    expect(s.hearts).toBe(HEARTS_MAX - 2);
    // Next refill is still 1.5h away, not 3h.
    expect(s.nextRefillAt).toBe(new Date(Date.now() + H / 2).toISOString());
  });
});
