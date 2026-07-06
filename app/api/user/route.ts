import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit, tooManyRequests } from "@/lib/api/rateLimit";

// Permanent account deletion. All user-owned rows (progress, streak,
// achievements, mastery, daily stages, quest claims, accounts, sessions)
// cascade via the schema's onDelete: Cascade relations.
export async function DELETE() {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!rateLimit(`delete:${session.user.id}`, 3, 60_000)) {
    return tooManyRequests();
  }

  try {
    await prisma.user.delete({ where: { id: session.user.id } });
    return Response.json({ ok: true });
  } catch (e) {
    console.error("DELETE /api/user failed:", e);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
