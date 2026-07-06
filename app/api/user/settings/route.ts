import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { readJson } from "@/lib/api/validation";
import { rateLimit, tooManyRequests } from "@/lib/api/rateLimit";

export async function PATCH(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!rateLimit(`settings:${session.user.id}`, 20, 60_000)) {
    return tooManyRequests();
  }

  const body = await readJson(request);
  if (!body) {
    return Response.json({ error: "Invalid payload" }, { status: 400 });
  }

  const data: { publicProfile?: boolean; personalizedRecs?: boolean } = {};
  if ("publicProfile" in body) {
    if (typeof body.publicProfile !== "boolean") {
      return Response.json({ error: "Invalid payload" }, { status: 400 });
    }
    data.publicProfile = body.publicProfile;
  }
  if ("personalizedRecs" in body) {
    if (typeof body.personalizedRecs !== "boolean") {
      return Response.json({ error: "Invalid payload" }, { status: 400 });
    }
    data.personalizedRecs = body.personalizedRecs;
  }
  if (Object.keys(data).length === 0) {
    return Response.json({ error: "Nothing to update" }, { status: 400 });
  }

  try {
    await prisma.user.update({ where: { id: session.user.id }, data });
    return Response.json({ ok: true });
  } catch (e) {
    console.error("PATCH /api/user/settings failed:", e);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
