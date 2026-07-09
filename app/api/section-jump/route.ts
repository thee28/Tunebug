import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { readJson } from "@/lib/api/validation";
import { rateLimit, tooManyRequests } from "@/lib/api/rateLimit";
import { unlockPriorSections } from "@/lib/db/sectionJump";

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
    const result = await unlockPriorSections(session.user.id, body.targetStageSlug);
    if (!result) {
      return Response.json({ error: "Nothing to skip before that section" }, { status: 400 });
    }
    return Response.json(result);
  } catch (e) {
    console.error("POST /api/section-jump failed:", e);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
