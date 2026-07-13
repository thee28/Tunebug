import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { saveProgress, getUserProgress } from "@/lib/db/progress";
import { isLessonUnlocked } from "@/lib/db/stages";
import { updateStreak } from "@/lib/db/streak";
import { syncAchievements } from "@/lib/db/achievements";
import { prisma } from "@/lib/prisma";
import { readJson, isValidScore } from "@/lib/api/validation";
import { rateLimit, tooManyRequests } from "@/lib/api/rateLimit";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const progress = await getUserProgress(session.user.id);
    return Response.json(progress);
  } catch (e) {
    console.error("GET /api/progress failed:", e);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!rateLimit(`progress:${session.user.id}`, 30, 60_000)) {
    return tooManyRequests();
  }

  const body = await readJson(request);
  if (!body) {
    return Response.json({ error: "Invalid payload" }, { status: 400 });
  }
  const { lessonId, score } = body;

  if (typeof lessonId !== "string" || !lessonId || !isValidScore(score)) {
    return Response.json({ error: "Invalid payload" }, { status: 400 });
  }

  try {
    const lesson = await prisma.lesson.findUnique({ where: { id: lessonId } });
    if (!lesson) {
      return Response.json({ error: "Lesson not found" }, { status: 404 });
    }

    // Locked content must not be completable by hitting the API directly —
    // the client UI is not the gatekeeper.
    if (!(await isLessonUnlocked(session.user.id, lessonId))) {
      return Response.json({ error: "Lesson locked" }, { status: 403 });
    }

    const passed = score >= lesson.passingScore;
    const { progress, xpEarned } = await saveProgress({
      userId: session.user.id,
      lessonId,
      score,
      passed,
      xpReward: lesson.xpReward,
    });

    if (passed) {
      await updateStreak(session.user.id);
    }

    // Non-fatal: a failed achievement sync must not fail the progress save.
    const unlocked = await syncAchievements(session.user.id).catch(() => [] as string[]);

    return Response.json({ progress, xpEarned, passed, unlockedAchievements: unlocked });
  } catch (e) {
    console.error("POST /api/progress failed:", e);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
