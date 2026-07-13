import { prisma } from "@/lib/prisma";

let counter = 0;

/** Create a throwaway user unique to this test run. */
export async function createTestUser(overrides: Record<string, unknown> = {}) {
  counter += 1;
  return prisma.user.create({
    data: {
      email: `dbtest-${Date.now()}-${counter}@test.local`,
      name: `DB Test User ${counter}`,
      ...overrides,
    },
  });
}

/** Delete a user and (via cascades) all of their generated state. */
export async function deleteTestUser(userId: string) {
  await prisma.user.delete({ where: { id: userId } }).catch(() => {});
}

/** First lesson of the seeded curriculum, ordered deterministically. */
export async function firstLesson() {
  const lesson = await prisma.lesson.findFirst({
    orderBy: [{ unit: { stage: { order: "asc" } } }, { unit: { order: "asc" } }, { order: "asc" }],
  });
  if (!lesson) throw new Error("Test DB has no seeded lessons — run scripts/test-db.sh");
  return lesson;
}
