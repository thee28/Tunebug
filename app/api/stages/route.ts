import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  // Curriculum is static content, but anonymous callers shouldn't get a free
  // DB query endpoint.
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const stages = await prisma.stage.findMany({
    include: {
      units: {
        orderBy: { order: "asc" },
        include: { lessons: { orderBy: { order: "asc" } } },
      },
    },
    orderBy: { order: "asc" },
  });
  return Response.json(stages);
}
