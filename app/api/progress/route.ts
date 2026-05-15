import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { saveProgress, getUserProgress } from "@/lib/db/progress";
import { updateStreak } from "@/lib/db/streak";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const progress = await getUserProgress(session.user.id);
  return Response.json(progress);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { lessonId, score } = body;

  if (!lessonId || typeof score !== "number") {
    return Response.json({ error: "Invalid payload" }, { status: 400 });
  }

  const lesson = await prisma.lesson.findUnique({ where: { id: lessonId } });
  if (!lesson) {
    return Response.json({ error: "Lesson not found" }, { status: 404 });
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

  return Response.json({ progress, xpEarned, passed });
}
