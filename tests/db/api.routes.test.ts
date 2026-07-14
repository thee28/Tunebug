import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { prisma } from "@/lib/prisma";
import { createTestUser, deleteTestUser, firstLesson } from "./helpers";

// Route handlers run against the real test DB; only the session is mocked.
vi.mock("@/lib/auth", () => ({
  auth: vi.fn(async () => null),
}));

import { auth } from "@/lib/auth";
const mockAuth = vi.mocked(auth as unknown as () => Promise<unknown>);

function asUser(userId: string | null) {
  mockAuth.mockResolvedValue(userId ? { user: { id: userId } } : null);
}

function jsonPost(url: string, body: unknown, headers: Record<string, string> = {}) {
  return new Request(`http://test.local${url}`, {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
}

let userA: string;
let userB: string;

beforeEach(async () => {
  userA = (await createTestUser()).id;
  userB = (await createTestUser()).id;
  asUser(null);
});

afterEach(async () => {
  await deleteTestUser(userA);
  await deleteTestUser(userB);
});

describe("unauthenticated access is rejected on every protected route", () => {
  it("progress, streak, hearts, mastery, daily-stage GETs → 401", async () => {
    const routes = [
      (await import("@/app/api/progress/route")).GET,
      (await import("@/app/api/streak/route")).GET,
      (await import("@/app/api/hearts/route")).GET,
      (await import("@/app/api/mastery/route")).GET,
      (await import("@/app/api/daily-stage/route")).GET,
      (await import("@/app/api/stages/route")).GET,
    ];
    for (const handler of routes) {
      const res = await handler();
      expect(res.status).toBe(401);
    }
  });

  it("progress, mastery, hearts, quest-claim, section-jump, daily POSTs → 401", async () => {
    const cases: Array<[{ POST: (r: never) => Promise<Response> }, unknown]> = [
      [await import("@/app/api/progress/route"), { lessonId: "x", score: 100 }],
      [await import("@/app/api/mastery/route"), { conceptId: "ear-note:C4", isCorrect: true }],
      [await import("@/app/api/quests/claim/route"), { questId: "daily-xp" }],
      [await import("@/app/api/section-jump/route"), { targetStageSlug: "elementary" }],
      [await import("@/app/api/daily-stage/route"), { id: "x", score: 100 }],
    ];
    for (const [mod, body] of cases) {
      const res = await mod.POST(jsonPost("/api/test", body) as never);
      expect(res.status).toBe(401);
    }
    const hearts = await import("@/app/api/hearts/route");
    expect((await hearts.POST()).status).toBe(401);
    const del = await import("@/app/api/user/route");
    expect((await del.DELETE()).status).toBe(401);
  });
});

describe("authorization: user A cannot touch user B's data", () => {
  it("progress writes land on the session user even if the body smuggles a userId", async () => {
    const lesson = await firstLesson();
    asUser(userA);
    const { POST } = await import("@/app/api/progress/route");
    const res = await POST(
      jsonPost("/api/progress", { lessonId: lesson.id, score: 90, userId: userB }) as never
    );
    expect(res.status).toBe(200);
    expect(await prisma.lessonProgress.count({ where: { userId: userB } })).toBe(0);
    expect(await prisma.lessonProgress.count({ where: { userId: userA } })).toBe(1);
  });

  it("user B cannot complete user A's daily stage by guessing its id → 404", async () => {
    asUser(userA);
    const dailyMod = await import("@/app/api/daily-stage/route");
    const stageA = await (await dailyMod.GET()).json();

    asUser(userB);
    const res = await dailyMod.POST(
      jsonPost("/api/daily-stage", { id: stageA.id, score: 100 }) as never
    );
    expect(res.status).toBe(404);
    const row = await prisma.dailyStage.findUnique({ where: { id: stageA.id } });
    expect(row?.completed).toBe(false);
    const b = await prisma.user.findUnique({ where: { id: userB } });
    expect(b?.xp).toBe(0);
  });

  it("mastery GET returns only the session user's concepts", async () => {
    const { recordAnswer } = await import("@/lib/curriculum/mastery");
    await recordAnswer({ userId: userA, conceptId: "ear-note:C4", isCorrect: true });
    asUser(userB);
    const { GET } = await import("@/app/api/mastery/route");
    const payload = await (await GET()).json();
    expect(Object.keys(payload)).toHaveLength(0);
  });
});

describe("progression integrity", () => {
  it("a LOCKED lesson cannot be completed by hitting the API directly", async () => {
    // Last lesson of the last stage — locked for a brand-new user.
    const lastLesson = await prisma.lesson.findFirst({
      orderBy: [
        { unit: { stage: { order: "desc" } } },
        { unit: { order: "desc" } },
        { order: "desc" },
      ],
    });
    asUser(userA);
    const { POST } = await import("@/app/api/progress/route");
    const res = await POST(
      jsonPost("/api/progress", { lessonId: lastLesson!.id, score: 100 }) as never
    );
    expect(res.status).toBe(403);
    expect(await prisma.lessonProgress.count({ where: { userId: userA } })).toBe(0);
    const user = await prisma.user.findUnique({ where: { id: userA } });
    expect(user?.xp).toBe(0); // no XP farming through locked content
  });

  it("the second lesson unlocks only after the first is passed", async () => {
    const first = await firstLesson();
    const second = await prisma.lesson.findFirst({
      where: { unitId: first.unitId, order: { gt: first.order } },
      orderBy: { order: "asc" },
    });
    asUser(userA);
    const { POST } = await import("@/app/api/progress/route");

    const locked = await POST(
      jsonPost("/api/progress", { lessonId: second!.id, score: 100 }) as never
    );
    expect(locked.status).toBe(403);

    await POST(jsonPost("/api/progress", { lessonId: first.id, score: 100 }) as never);
    const nowUnlocked = await POST(
      jsonPost("/api/progress", { lessonId: second!.id, score: 100 }) as never
    );
    expect(nowUnlocked.status).toBe(200);
  });

  it("pass/fail threshold: exactly passingScore passes, one below fails", async () => {
    const lesson = await firstLesson(); // passingScore 70
    asUser(userA);
    const { POST } = await import("@/app/api/progress/route");

    const below = await (
      await POST(jsonPost("/api/progress", { lessonId: lesson.id, score: lesson.passingScore - 1 }) as never)
    ).json();
    expect(below.passed).toBe(false);

    const exact = await (
      await POST(jsonPost("/api/progress", { lessonId: lesson.id, score: lesson.passingScore }) as never)
    ).json();
    expect(exact.passed).toBe(true);
  });
});

describe("input validation rejects garbage (no coercion)", () => {
  it("progress POST: malformed payloads → 400, nothing written", async () => {
    const lesson = await firstLesson();
    asUser(userA);
    const { POST } = await import("@/app/api/progress/route");

    const bads = [
      {},
      { lessonId: lesson.id }, // missing score
      { score: 90 }, // missing lessonId
      { lessonId: lesson.id, score: "90" }, // string score
      { lessonId: lesson.id, score: 90.5 }, // float
      { lessonId: lesson.id, score: -1 },
      { lessonId: lesson.id, score: 101 },
      { lessonId: lesson.id, score: 1e9 },
      { lessonId: lesson.id, score: NaN }, // JSON.stringify(NaN) → null
      { lessonId: 12345, score: 90 },
      { lessonId: "", score: 90 },
    ];
    for (const body of bads) {
      const res = await POST(jsonPost("/api/progress", body) as never);
      expect(res.status, JSON.stringify(body)).toBe(400);
    }

    const raw = new Request("http://test.local/api/progress", {
      method: "POST",
      body: "not json{{{",
    });
    expect((await POST(raw as never)).status).toBe(400);
    expect(await prisma.lessonProgress.count({ where: { userId: userA } })).toBe(0);
  });

  it("progress POST: nonexistent lesson id → 404", async () => {
    asUser(userA);
    const { POST } = await import("@/app/api/progress/route");
    const res = await POST(
      jsonPost("/api/progress", { lessonId: "clzzzzzzzzzzzzzzzzzzzzzzz", score: 90 }) as never
    );
    expect(res.status).toBe(404);
  });

  it("mastery POST: oversized conceptId and wrong types → 400", async () => {
    asUser(userA);
    const { POST } = await import("@/app/api/mastery/route");
    const bads = [
      { conceptId: "x".repeat(101), isCorrect: true }, // >100 chars
      { conceptId: "ear-note:C4", isCorrect: "yes" },
      { conceptId: 42, isCorrect: true },
      { conceptId: "", isCorrect: true },
    ];
    for (const body of bads) {
      const res = await POST(jsonPost("/api/mastery", body) as never);
      expect(res.status, JSON.stringify(body)).toBe(400);
    }
  });

  it("quest claim: unknown quest id → 400; incomplete quest → 409", async () => {
    asUser(userA);
    const { POST } = await import("@/app/api/quests/claim/route");
    expect(
      (await POST(jsonPost("/api/quests/claim", { questId: "not-a-quest" }) as never)).status
    ).toBe(400);
    // Real quest, zero progress today:
    const res = await POST(jsonPost("/api/quests/claim", { questId: "daily-lesson" }) as never);
    expect([400, 409]).toContain(res.status);
  });
});

describe("registration hardening", () => {
  // Each call uses a unique forwarded IP so the 5-per-15-min limiter
  // never bleeds across tests.
  let ipCounter = 0;
  function register(body: unknown) {
    ipCounter += 1;
    return import("@/app/api/auth/register/route").then(({ POST }) =>
      POST(
        jsonPost("/api/auth/register", body, {
          "x-forwarded-for": `10.99.${Math.floor(ipCounter / 250)}.${ipCounter % 250}`,
        }) as never
      )
    );
  }

  it("rejects invalid emails and short/oversized passwords", async () => {
    expect((await register({ email: "nope", password: "longenough1" })).status).toBe(400);
    expect((await register({ email: "a@b.co", password: "short" })).status).toBe(400);
    // 73 bytes — bcrypt would silently truncate beyond 72.
    expect((await register({ email: "a@b.co", password: "x".repeat(73) })).status).toBe(400);
    expect((await register({ email: 42, password: "longenough1" })).status).toBe(400);
  });

  it("duplicate email → 409, and the password is stored hashed", async () => {
    const email = `reg-${Date.now()}@test.local`;
    expect((await register({ email, password: "hunter2hunter2" })).status).toBe(201);
    expect((await register({ email, password: "hunter2hunter2" })).status).toBe(409);
    const user = await prisma.user.findUnique({ where: { email } });
    expect(user?.passwordHash).toBeTruthy();
    expect(user?.passwordHash).not.toContain("hunter2");
    await deleteTestUser(user!.id);
  });

  it("rate limit: 6th attempt from the same IP inside the window → 429", async () => {
    const { POST } = await import("@/app/api/auth/register/route");
    const ip = "10.200.0.1";
    let last: Response | null = null;
    for (let i = 0; i < 6; i++) {
      last = await POST(
        jsonPost("/api/auth/register", { email: "bad", password: "x" }, { "x-forwarded-for": ip }) as never
      );
    }
    expect(last!.status).toBe(429);
  });
});
