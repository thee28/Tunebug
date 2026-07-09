import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { readJson } from "@/lib/api/validation";
import { rateLimit, tooManyRequests } from "@/lib/api/rateLimit";
import { getSkillLevel, getTimeCommitment, type StartMethod } from "@/lib/onboarding";
import { unlockPriorSections } from "@/lib/db/sectionJump";
import { CURRICULUM } from "@/lib/curriculum/config";

// Finalizes the placement survey: records the daily XP goal + skill level,
// stamps onboardedAt (so the dashboard stops redirecting here), and — when the
// learner chose "find my level" — unlocks the sections up to their placement.
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  if (!rateLimit(`onboarding:${userId}`, 10, 60_000)) {
    return tooManyRequests();
  }

  const body = await readJson(request);
  if (!body) {
    return Response.json({ error: "Invalid payload" }, { status: 400 });
  }

  const skill = typeof body.skillLevel === "string" ? getSkillLevel(body.skillLevel) : undefined;
  const time = typeof body.timeCommitment === "string" ? getTimeCommitment(body.timeCommitment) : undefined;
  const startMethod: StartMethod = body.startMethod === "find-level" ? "find-level" : "scratch";

  if (!skill || !time) {
    return Response.json({ error: "Invalid skill level or time commitment" }, { status: 400 });
  }

  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        dailyXpGoal: time.dailyXpGoal,
        skillLevel: skill.id,
        onboardedAt: new Date(),
      },
    });

    // "Find my level" unlocks every section before the placement; "start from
    // scratch" (or a beginner placement) leaves them at Section 1, Lesson 1.
    let placedSectionIndex = 0;
    if (startMethod === "find-level" && skill.targetSectionIndex > 0) {
      const targetStage = CURRICULUM[skill.targetSectionIndex];
      if (targetStage) {
        const result = await unlockPriorSections(userId, targetStage.slug);
        if (result) placedSectionIndex = skill.targetSectionIndex;
      }
    }

    return Response.json({ ok: true, placedSectionIndex });
  } catch (e) {
    console.error("POST /api/onboarding failed:", e);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
