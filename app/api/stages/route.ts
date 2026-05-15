import { prisma } from "@/lib/prisma";

export async function GET() {
  const stages = await prisma.stage.findMany({
    include: { lessons: { orderBy: { order: "asc" } } },
    orderBy: { order: "asc" },
  });
  return Response.json(stages);
}
