import { test, expect } from "@playwright/test";
import {
  AUDIO_MOCK_INIT,
  signUp,
  completeOnboarding,
  uniqueEmail,
  passUnitsBefore,
  singCurrentExercise,
  driveLessonToCompletion,
  db,
  startBadge,
  activeLessonNode,
} from "./fixtures";

// The singing unit ("Your Singing Voice", order 3) is the first PITCH_MATCH
// content. Earlier units are marked passed via direct test-DB setup so the
// suite exercises the core sing-into-the-mic loop, not 9 ear-training lessons.
test.describe("PITCH_MATCH lesson with simulated microphone", () => {
  // ~13 exercises at ≥1s hold each plus navigation: needs more than 60s.
  test.setTimeout(180_000);

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(AUDIO_MOCK_INIT);
  });

  test("complete a singing lesson in tune → pass → XP + streak + progress persist across reload", async ({ page }) => {
    const email = uniqueEmail("sing-pass");
    await signUp(page, email);
    await completeOnboarding(page);
    await passUnitsBefore(email, 3);
    await page.goto("/dashboard");

    // The active (START-badged) node is now the first singing lesson.
    await activeLessonNode(page).click();

    await driveLessonToCompletion(page);

    await expect(page.getByText(/lesson complete!/i)).toBeVisible();
    await expect(page.getByText(/\+\d+ XP/)).toBeVisible();
    await page.getByRole("button", { name: /continue/i }).click();

    // Server state: progress row passed, streak started, XP granted.
    const progress = await page.request.get("/api/progress").then((r) => r.json());
    const sv1 = await db<{ id: string }>(
      `SELECT id FROM "Lesson" WHERE slug = 'beg-sv-1'`
    );
    expect(progress.some((p: { lessonId: string; passed: boolean }) => p.lessonId === sv1[0].id && p.passed)).toBe(true);

    const streak = await page.request.get("/api/streak").then((r) => r.json());
    expect(streak.currentStreak).toBe(1);

    // Reload — progress survives, the lesson path shows the NEXT lesson as active.
    await page.reload();
    await expect(startBadge(page)).toBeVisible({ timeout: 15000 });
    const progressAfter = await page.request.get("/api/progress").then((r) => r.json());
    expect(progressAfter.length).toBe(progress.length); // reload duplicated nothing
  });

  test("deliberately out-of-tune singing fails, costs a heart, and lands in mastery as weak", async ({ page }) => {
    const email = uniqueEmail("sing-fail");
    await signUp(page, email);
    await completeOnboarding(page);
    await passUnitsBefore(email, 3);
    await page.goto("/dashboard");

    await activeLessonNode(page).click();

    // Fail the FIRST pitch exercise only (100¢ sharp — a full semitone off),
    // then bail out of the lesson.
    for (let step = 0; step < 10; step++) {
      if (await page.getByRole("button", { name: /start singing/i }).isVisible().catch(() => false)) break;
      const cont = page.getByRole("button", { name: /^continue$/i });
      if (await cont.isVisible().catch(() => false)) {
        await cont.click();
        continue;
      }
      await page.waitForTimeout(300);
    }
    await singCurrentExercise(page, 100); // +100 cents = wrong note
    await expect(page.getByText(/time's up/i)).toBeVisible();

    // A wrong answer costs one heart…
    const hearts = await page.request.get("/api/hearts").then((r) => r.json());
    expect(hearts.hearts).toBeLessThan(hearts.max);

    // …and the concept is recorded as struggled-with (0 correct, seen ≥1).
    const mastery = await page.request.get("/api/mastery").then((r) => r.json());
    const rows = Object.values(mastery) as Array<{ masteryScore: number; timesSeen: number }>;
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.some((r) => r.timesSeen >= 1 && r.masteryScore === 0)).toBe(true);
  });

  test("refresh mid-lesson neither saves partial progress nor corrupts state", async ({ page }) => {
    const email = uniqueEmail("refresh");
    await signUp(page, email);
    await completeOnboarding(page);
    await passUnitsBefore(email, 3);
    await page.goto("/dashboard");

    const before = await page.request.get("/api/progress").then((r) => r.json());
    await activeLessonNode(page).click();
    // Get at least one step in, then bail.
    const cont = page.getByRole("button", { name: /continue/i });
    if (await cont.isVisible().catch(() => false)) await cont.click();
    await page.reload();

    await expect(startBadge(page)).toBeVisible({ timeout: 15000 });
    const after = await page.request.get("/api/progress").then((r) => r.json());
    expect(after.length).toBe(before.length); // nothing written for the aborted run
  });
});
