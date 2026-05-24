import { auth } from "@/lib/auth";
import { getTodaysDailyStage, completeDailyStage } from "@/lib/db/daily";
import { updateStreak } from "@/lib/db/streak";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dailyStage = await getTodaysDailyStage(session.user.id);
  return Response.json(dailyStage);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, score } = await request.json();
  if (!id || typeof score !== "number") {
    return Response.json({ error: "Invalid payload" }, { status: 400 });
  }

  const { xpEarned } = await completeDailyStage(id, session.user.id, score);

  if (score >= 70) {
    await updateStreak(session.user.id);
  }

  return Response.json({ xpEarned, passed: score >= 70 });
}
