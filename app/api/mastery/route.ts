import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { recordAnswer } from "@/lib/curriculum/mastery";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { conceptId, isCorrect, lessonSlug } = body;

  if (typeof conceptId !== "string" || typeof isCorrect !== "boolean") {
    return Response.json({ error: "Invalid payload" }, { status: 400 });
  }

  const row = await recordAnswer({
    userId: session.user.id,
    conceptId,
    isCorrect,
    lessonSlug: typeof lessonSlug === "string" ? lessonSlug : undefined,
  });

  return Response.json({
    conceptId: row.conceptId,
    masteryScore: row.masteryScore,
    nextReviewAt: row.nextReviewAt,
  });
}
