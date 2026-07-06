import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { readJson } from "@/lib/api/validation";
import { rateLimit, tooManyRequests } from "@/lib/api/rateLimit";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Tight limit — this endpoint verifies the current password, so it's a
  // brute-force target.
  if (!rateLimit(`password:${session.user.id}`, 5, 15 * 60_000)) {
    return tooManyRequests();
  }

  const body = await readJson(request);
  if (!body) {
    return Response.json({ error: "Invalid payload" }, { status: 400 });
  }
  const { currentPassword, newPassword } = body;

  if (typeof newPassword !== "string" || newPassword.length < 8) {
    return Response.json({ error: "New password must be at least 8 characters" }, { status: 400 });
  }
  // bcrypt silently truncates input beyond 72 bytes.
  if (Buffer.byteLength(newPassword, "utf8") > 72) {
    return Response.json({ error: "New password must be at most 72 characters" }, { status: 400 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { passwordHash: true },
    });
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.passwordHash) {
      // Existing password — must prove knowledge of it.
      if (typeof currentPassword !== "string" || !currentPassword) {
        return Response.json({ error: "Current password is required" }, { status: 400 });
      }
      const valid = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!valid) {
        return Response.json({ error: "Current password is incorrect" }, { status: 403 });
      }
    }
    // No passwordHash means a Google-only account setting a password for the
    // first time — the authenticated session is the proof of ownership.

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: session.user.id },
      data: { passwordHash },
    });

    return Response.json({ ok: true });
  } catch (e) {
    console.error("POST /api/user/password failed:", e);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
