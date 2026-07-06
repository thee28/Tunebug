import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit, tooManyRequests } from "@/lib/api/rateLimit";

// Full personal-data export (GDPR-style). Returns a downloadable JSON file
// with everything the app stores about the user.
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!rateLimit(`export:${session.user.id}`, 3, 60_000)) {
    return tooManyRequests();
  }

  try {
    const userId = session.user.id;
    const [user, progress, streak, achievements, mastery, dailyStages, questClaims] =
      await Promise.all([
        prisma.user.findUnique({
          where: { id: userId },
          select: {
            id: true,
            email: true,
            name: true,
            xp: true,
            bannerColor: true,
            publicProfile: true,
            personalizedRecs: true,
            createdAt: true,
          },
        }),
        prisma.lessonProgress.findMany({
          where: { userId },
          orderBy: { completedAt: "asc" },
          select: {
            lessonId: true,
            score: true,
            passed: true,
            attempts: true,
            xpEarned: true,
            completedAt: true,
          },
        }),
        prisma.dailyStreak.findUnique({
          where: { userId },
          select: { currentStreak: true, longestStreak: true, lastActivityDate: true },
        }),
        prisma.achievement.findMany({
          where: { userId },
          select: { type: true, unlockedAt: true },
        }),
        prisma.conceptMastery.findMany({
          where: { userId },
          select: {
            conceptId: true,
            timesSeen: true,
            timesCorrect: true,
            masteryScore: true,
            lastSeenAt: true,
          },
        }),
        prisma.dailyStage.findMany({
          where: { userId },
          orderBy: { date: "asc" },
          select: { date: true, difficulty: true, completed: true, score: true, xpEarned: true },
        }),
        prisma.questClaim.findMany({
          where: { userId },
          orderBy: { date: "asc" },
          select: { questId: true, date: true, xpAwarded: true },
        }),
      ]);

    const payload = {
      exportedAt: new Date().toISOString(),
      user,
      lessonProgress: progress,
      streak,
      achievements,
      conceptMastery: mastery,
      dailyStages,
      questClaims,
    };

    return new Response(JSON.stringify(payload, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="tunebug-export-${new Date().toISOString().slice(0, 10)}.json"`,
      },
    });
  } catch (e) {
    console.error("GET /api/user/export failed:", e);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
