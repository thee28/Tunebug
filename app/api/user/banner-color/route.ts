import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const HEX_RE = /^#[0-9a-fA-F]{6}$/;

export async function PATCH(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { color } = body;

  if (typeof color !== "string" || !HEX_RE.test(color)) {
    return Response.json({ error: "Invalid color" }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { bannerColor: color },
  });

  return Response.json({ ok: true });
}
