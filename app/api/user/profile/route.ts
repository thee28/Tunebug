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

  if (!rateLimit(`profile:${session.user.id}`, 10, 60_000)) {
    return tooManyRequests();
  }

  const body = await readJson(request);
  if (!body) {
    return Response.json({ error: "Invalid payload" }, { status: 400 });
  }
  const { name } = body;

  if (typeof name !== "string" || !name.trim()) {
    return Response.json({ error: "Name is required" }, { status: 400 });
  }
  const trimmed = name.trim().slice(0, 50);

  try {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { name: trimmed },
    });
    return Response.json({ ok: true, name: trimmed });
  } catch (e) {
    console.error("PATCH /api/user/profile failed:", e);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
