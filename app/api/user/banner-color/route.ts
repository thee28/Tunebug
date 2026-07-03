import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { readJson } from "@/lib/api/validation";
import { rateLimit, tooManyRequests } from "@/lib/api/rateLimit";

const HEX_RE = /^#[0-9a-fA-F]{6}$/;

export async function PATCH(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!rateLimit(`banner:${session.user.id}`, 10, 60_000)) {
    return tooManyRequests();
  }

  const body = await readJson(request);
  if (!body) {
    return Response.json({ error: "Invalid payload" }, { status: 400 });
  }
  const { color } = body;

  if (typeof color !== "string" || !HEX_RE.test(color)) {
    return Response.json({ error: "Invalid color" }, { status: 400 });
  }

  try {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { bannerColor: color },
    });

    return Response.json({ ok: true });
  } catch (e) {
    console.error("PATCH /api/user/banner-color failed:", e);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
