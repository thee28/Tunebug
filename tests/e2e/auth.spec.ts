import { test, expect } from "@playwright/test";
import { signUp, completeOnboarding, logIn, uniqueEmail, startBadge } from "./fixtures";

test.describe("auth and access control", () => {
  test("logged-out users are redirected away from every protected page", async ({ page }) => {
    for (const path of ["/dashboard", "/practice", "/daily", "/sections", "/onboarding"]) {
      await page.goto(path);
      await expect(page).toHaveURL(/\/login/);
    }
  });

  test("logged-out API access returns 401, not data", async ({ request }) => {
    for (const path of ["/api/progress", "/api/streak", "/api/hearts", "/api/mastery"]) {
      const res = await request.get(path);
      expect(res.status(), path).toBe(401);
    }
  });

  test("sign up → onboarding survey → dashboard with lesson path", async ({ page }) => {
    const email = uniqueEmail("signup");
    await signUp(page, email);
    // New users get bounced into the placement survey before the dashboard.
    await expect(page).toHaveURL(/\/onboarding/);
    await completeOnboarding(page);

    // Lesson path renders: first section title + the START badge on the
    // first (unlocked) lesson.
    await expect(startBadge(page)).toBeVisible({ timeout: 15000 });
  });

  test("sign out → protected pages blocked → sign back in → state intact", async ({ page }) => {
    const email = uniqueEmail("signout");
    await signUp(page, email, "Roundtrip Tester");
    await completeOnboarding(page);

    await page.goto("/dashboard?view=settings");
    await page.getByRole("button", { name: /log out/i }).click();
    await page.waitForURL("**/login**", { timeout: 15000 });

    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);

    await logIn(page, email);
    // Onboarding is already done — no bounce back into the survey.
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(startBadge(page)).toBeVisible({ timeout: 15000 });
  });

  test("wrong password shows an error, no session created", async ({ page }) => {
    const email = uniqueEmail("badpw");
    await signUp(page, email);
    await completeOnboarding(page);
    await page.goto("/dashboard?view=settings");
    await page.getByRole("button", { name: /log out/i }).click();
    await page.waitForURL("**/login**");

    await page.getByPlaceholder("Email or username").fill(email);
    await page.getByPlaceholder("Password").fill("definitely-wrong-pw");
    await page.getByRole("button", { name: /^log in$/i }).click();
    await expect(page.getByText(/invalid email or password/i)).toBeVisible();
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
  });
});
