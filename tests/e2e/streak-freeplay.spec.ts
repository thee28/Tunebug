import { test, expect } from "@playwright/test";
import {
  AUDIO_MOCK_INIT,
  signUp,
  completeOnboarding,
  uniqueEmail,
  passUnitsBefore,
  singCurrentExercise,
  db,
} from "./fixtures";

test.describe("streak across a day boundary", () => {
  test("yesterday's streak increments on today's completion (server-side day math)", async ({ page }) => {
    const email = uniqueEmail("streak");
    await page.addInitScript(AUDIO_MOCK_INIT);
    await signUp(page, email);
    await completeOnboarding(page);
    await passUnitsBefore(email, 3);

    // Seed a 3-day streak whose last activity was YESTERDAY (UTC).
    await db(
      `INSERT INTO "DailyStreak" (id, "userId", "currentStreak", "longestStreak", "lastActivityDate", "updatedAt")
       SELECT substr(md5(random()::text), 1, 24), id, 3, 5,
              date_trunc('day', now() at time zone 'utc') - interval '1 day', now()
       FROM "User" WHERE email = $1`,
      [email]
    );

    // Complete today's first passing lesson through the API with the browser session.
    const sv1 = await db<{ id: string }>(`SELECT id FROM "Lesson" WHERE slug = 'beg-sv-1'`);
    const res = await page.request.post("/api/progress", {
      data: { lessonId: sv1[0].id, score: 100 },
    });
    expect(res.status()).toBe(200);

    const streak = await page.request.get("/api/streak").then((r) => r.json());
    expect(streak.currentStreak).toBe(4); // 3 + today
    expect(streak.longestStreak).toBe(5); // untouched

    // Same-day second completion must NOT increment again.
    const sv2 = await db<{ id: string }>(`SELECT id FROM "Lesson" WHERE slug = 'beg-sv-2'`);
    await page.request.post("/api/progress", { data: { lessonId: sv2[0].id, score: 100 } });
    const streak2 = await page.request.get("/api/streak").then((r) => r.json());
    expect(streak2.currentStreak).toBe(4);
  });

  test("a two-day gap resets the streak to 1", async ({ page }) => {
    const email = uniqueEmail("streak-gap");
    await page.addInitScript(AUDIO_MOCK_INIT);
    await signUp(page, email);
    await completeOnboarding(page);
    await passUnitsBefore(email, 3);

    await db(
      `INSERT INTO "DailyStreak" (id, "userId", "currentStreak", "longestStreak", "lastActivityDate", "updatedAt")
       SELECT substr(md5(random()::text), 1, 24), id, 7, 7,
              date_trunc('day', now() at time zone 'utc') - interval '2 days', now()
       FROM "User" WHERE email = $1`,
      [email]
    );

    const sv1 = await db<{ id: string }>(`SELECT id FROM "Lesson" WHERE slug = 'beg-sv-1'`);
    await page.request.post("/api/progress", { data: { lessonId: sv1[0].id, score: 100 } });

    const streak = await page.request.get("/api/streak").then((r) => r.json());
    expect(streak.currentStreak).toBe(1);
    expect(streak.longestStreak).toBe(7);
  });
});

test.describe("free play (login required — confirmed intent)", () => {
  test("free-play pitch match works standalone with the simulated mic", async ({ page }) => {
    const email = uniqueEmail("freeplay");
    await page.addInitScript(AUDIO_MOCK_INIT);
    await signUp(page, email);
    await completeOnboarding(page);

    await page.goto("/dashboard?view=practice");
    await expect(page.getByText(/free practice/i).first()).toBeVisible({ timeout: 15000 });

    // Enable ONLY the Pitch Match domain so every exercise needs the mic
    // (Ear Training is on by default — turn it off after adding Pitch Match).
    await page.getByRole("button", { name: /pitch match/i }).first().click();
    await page.getByRole("button", { name: /ear training/i }).first().click();
    await page.getByRole("button", { name: /^short/i }).first().click();
    await page.getByRole("button", { name: /^practice$/i }).first().click();

    // First exercise: sing it in tune, get positive feedback.
    await singCurrentExercise(page, 0);
    await expect(page.getByRole("button", { name: /^continue$/i }).first()).toBeVisible();

    // No lesson-progress rows were created — free play is practice only.
    const progress = await page.request.get("/api/progress").then((r) => r.json());
    expect(progress).toHaveLength(0);
  });

  test("free play is not reachable logged out (protected by middleware)", async ({ page }) => {
    await page.goto("/practice");
    await expect(page).toHaveURL(/\/login/);
  });
});
