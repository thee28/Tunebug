import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { readJson } from "@/lib/api/validation";
import { rateLimit, clientIp, tooManyRequests } from "@/lib/api/rateLimit";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  if (!rateLimit(`register:${clientIp(request)}`, 5, 15 * 60_000)) {
    return tooManyRequests();
  }

  const body = await readJson(request);
  if (!body) {
    return Response.json({ error: "Invalid payload" }, { status: 400 });
  }
  const { email, password, name } = body;

  if (typeof email !== "string" || typeof password !== "string") {
    return Response.json({ error: "Email and password required" }, { status: 400 });
  }

  const normalizedEmail = email.trim().toLowerCase();
  if (!EMAIL_RE.test(normalizedEmail) || normalizedEmail.length > 254) {
    return Response.json({ error: "Invalid email address" }, { status: 400 });
  }

  if (password.length < 8) {
    return Response.json({ error: "Password must be at least 8 characters" }, { status: 400 });
  }
  // bcrypt silently truncates input beyond 72 bytes.
  if (Buffer.byteLength(password, "utf8") > 72) {
    return Response.json({ error: "Password must be at most 72 characters" }, { status: 400 });
  }

  let displayName = normalizedEmail.split("@")[0];
  if (typeof name === "string" && name.trim()) {
    displayName = name.trim().slice(0, 50);
  }

  try {
    const passwordHash = await bcrypt.hash(password, 12);

    await prisma.user.create({
      data: { email: normalizedEmail, name: displayName, passwordHash },
    });

    return Response.json({ ok: true }, { status: 201 });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return Response.json({ error: "Email already in use" }, { status: 409 });
    }
    console.error("POST /api/auth/register failed:", e);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
