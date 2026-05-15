import { auth } from "@/lib/auth";
import { getStreak } from "@/lib/db/streak";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const streak = await getStreak(session.user.id);
  return Response.json(
    streak ?? { currentStreak: 0, longestStreak: 0, lastActivityDate: null }
  );
}
