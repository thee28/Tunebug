import { auth } from "@/lib/auth";
import { getTodaysDailyStage, completeDailyStage } from "@/lib/db/daily";
import { updateStreak } from "@/lib/db/streak";
import { syncAchievements } from "@/lib/db/achievements";
import { readJson, isValidScore } from "@/lib/api/validation";
import { rateLimit, tooManyRequests } from "@/lib/api/rateLimit";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const dailyStage = await getTodaysDailyStage(session.user.id);
    return Response.json(dailyStage);
  } catch (e) {
    console.error("GET /api/daily-stage failed:", e);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!rateLimit(`daily:${session.user.id}`, 10, 60_000)) {
    return tooManyRequests();
  }

  const body = await readJson(request);
  if (!body) {
    return Response.json({ error: "Invalid payload" }, { status: 400 });
  }
  const { id, score } = body;

  if (typeof id !== "string" || !id || !isValidScore(score)) {
    return Response.json({ error: "Invalid payload" }, { status: 400 });
  }

  try {
    const { xpEarned } = await completeDailyStage(id, session.user.id, score);

    if (score >= 70) {
      await updateStreak(session.user.id);
    }

    // Non-fatal: a failed achievement sync must not fail the completion.
    await syncAchievements(session.user.id).catch(() => {});

    return Response.json({ xpEarned, passed: score >= 70 });
  } catch (e) {
    if (e instanceof Error && e.message === "Not found") {
      return Response.json({ error: "Not found" }, { status: 404 });
    }
    console.error("POST /api/daily-stage failed:", e);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
