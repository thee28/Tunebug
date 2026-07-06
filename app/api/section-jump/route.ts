import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { readJson } from "@/lib/api/validation";
import { rateLimit, tooManyRequests } from "@/lib/api/rateLimit";
import { updateStreak } from "@/lib/db/streak";
import { syncAchievements } from "@/lib/db/achievements";

// Called after the client-side jump test is passed. Marks every lesson in the
// stages BEFORE the target stage as passed so the normal unlock logic opens
// the target section. Skipped lessons grant no XP — jumping ahead must not be
// an XP farm.
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!rateLimit(`section-jump:${session.user.id}`, 10, 60_000)) {
    return tooManyRequests();
  }

  const body = await readJson(request);
  if (!body || typeof body.targetStageSlug !== "string" || !body.targetStageSlug) {
    return Response.json({ error: "Invalid payload" }, { status: 400 });
  }

  try {
    const target = await prisma.stage.findUnique({
      where: { slug: body.targetStageSlug },
      select: { id: true, order: true },
    });
    if (!target) {
      return Response.json({ error: "Stage not found" }, { status: 404 });
    }
    if (target.order === 0) {
      return Response.json({ error: "Nothing to skip before the first section" }, { status: 400 });
    }

    const priorLessons = await prisma.lesson.findMany({
      where: { unit: { stage: { order: { lt: target.order } } } },
      select: { id: true },
    });
    const priorIds = priorLessons.map((l) => l.id);

    const alreadyPassed = await prisma.lessonProgress.findMany({
      where: { userId: session.user.id, passed: true, lessonId: { in: priorIds } },
      select: { lessonId: true },
    });
    const passedIds = new Set(alreadyPassed.map((p) => p.lessonId));
    const toMark = priorIds.filter((id) => !passedIds.has(id));

    if (toMark.length > 0) {
      await prisma.lessonProgress.createMany({
        data: toMark.map((lessonId) => ({
          userId: session.user.id,
          lessonId,
          score: 100,
          passed: true,
          attempts: 1,
          xpEarned: 0,
        })),
      });
      await updateStreak(session.user.id);
    }

    // Non-fatal, same as the progress route.
    const unlocked = await syncAchievements(session.user.id).catch(() => [] as string[]);

    return Response.json({ skippedLessons: toMark.length, unlockedAchievements: unlocked });
  } catch (e) {
    console.error("POST /api/section-jump failed:", e);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
