import { auth } from "@/lib/auth";
import { getHearts, loseHeart } from "@/lib/db/hearts";
import { rateLimit, tooManyRequests } from "@/lib/api/rateLimit";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    return Response.json(await getHearts(session.user.id));
  } catch (e) {
    console.error("GET /api/hearts failed:", e);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST = lose one heart (called on each wrong lesson answer).
export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!rateLimit(`hearts:${session.user.id}`, 60, 60_000)) {
    return tooManyRequests();
  }

  try {
    return Response.json(await loseHeart(session.user.id));
  } catch (e) {
    console.error("POST /api/hearts failed:", e);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
