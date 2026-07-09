import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTodayQuestProgress } from "@/lib/db/quests";
import { syncAchievements } from "@/lib/db/achievements";
import { getQuestDef, isQuestComplete } from "@/lib/quests";
import { readJson } from "@/lib/api/validation";
import { rateLimit, tooManyRequests } from "@/lib/api/rateLimit";
import { startOfDayUTC } from "@/lib/utils";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  if (!rateLimit(`quest-claim:${userId}`, 10, 60_000)) {
    return tooManyRequests();
  }

  const body = await readJson(request);
  if (!body) {
    return Response.json({ error: "Invalid payload" }, { status: 400 });
  }
  const { questId } = body;
  if (typeof questId !== "string") {
    return Response.json({ error: "Unknown quest" }, { status: 400 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { dailyXpGoal: true },
    });
    const def = getQuestDef(questId, user?.dailyXpGoal ?? undefined);
    if (!def) {
      return Response.json({ error: "Unknown quest" }, { status: 400 });
    }

    const progress = await getTodayQuestProgress(userId);
    if (!isQuestComplete(def, progress)) {
      return Response.json({ error: "Quest not complete yet" }, { status: 409 });
    }

    const today = startOfDayUTC(new Date());
    // The unique (userId, questId, date) constraint makes double-claims
    // impossible even under concurrent requests.
    await prisma.$transaction(async (tx) => {
      await tx.questClaim.create({
        data: { userId, questId: def.id, date: today, xpAwarded: def.rewardXP },
      });
      await tx.user.update({
        where: { id: userId },
        data: { xp: { increment: def.rewardXP } },
      });
    });

    // Quest XP can push the user over an XP-milestone achievement.
    await syncAchievements(userId).catch(() => {});

    return Response.json({ ok: true, xpAwarded: def.rewardXP });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return Response.json({ error: "Already claimed today" }, { status: 409 });
    }
    console.error("POST /api/quests/claim failed:", e);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
