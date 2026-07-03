import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { recordAnswer, getMasteryMap } from "@/lib/curriculum/mastery";
import { readJson } from "@/lib/api/validation";
import { rateLimit, tooManyRequests } from "@/lib/api/rateLimit";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const map = await getMasteryMap(session.user.id);
    // Strip down to the fields the slot generator actually reads.
    const payload: Record<string, { masteryScore: number; currentStreak: number; timesSeen: number; nextReviewAt: string }> = {};
    for (const [conceptId, row] of map.entries()) {
      payload[conceptId] = {
        masteryScore: row.masteryScore,
        currentStreak: row.currentStreak,
        timesSeen: row.timesSeen,
        nextReviewAt: row.nextReviewAt.toISOString(),
      };
    }
    return Response.json(payload);
  } catch (e) {
    console.error("GET /api/mastery failed:", e);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!rateLimit(`mastery:${session.user.id}`, 60, 60_000)) {
    return tooManyRequests();
  }

  const body = await readJson(request);
  if (!body) {
    return Response.json({ error: "Invalid payload" }, { status: 400 });
  }
  const { conceptId, isCorrect, lessonSlug } = body;

  if (
    typeof conceptId !== "string" ||
    !conceptId ||
    conceptId.length > 100 ||
    typeof isCorrect !== "boolean"
  ) {
    return Response.json({ error: "Invalid payload" }, { status: 400 });
  }

  try {
    const row = await recordAnswer({
      userId: session.user.id,
      conceptId,
      isCorrect,
      lessonSlug:
        typeof lessonSlug === "string" && lessonSlug.length <= 100 ? lessonSlug : undefined,
    });

    return Response.json({
      conceptId: row.conceptId,
      masteryScore: row.masteryScore,
      nextReviewAt: row.nextReviewAt,
    });
  } catch (e) {
    console.error("POST /api/mastery failed:", e);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
