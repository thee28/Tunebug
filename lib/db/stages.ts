import { prisma } from "@/lib/prisma";
import type { Stage, StageStatus } from "@/types/lesson";

export async function getStagesWithProgress(userId: string): Promise<Stage[]> {
  const [stages, passedProgress] = await Promise.all([
    prisma.stage.findMany({
      include: { lessons: { orderBy: { order: "asc" } } },
      orderBy: { order: "asc" },
    }),
    prisma.lessonProgress.findMany({
      where: { userId, passed: true },
      select: { lessonId: true },
    }),
  ]);

  const passedLessonIds = new Set(passedProgress.map((p) => p.lessonId));

  return stages.map((stage, stageIndex) => {
    const totalLessons = stage.lessons.length;
    const completedLessons = stage.lessons.filter((l) =>
      passedLessonIds.has(l.id)
    ).length;

    let status: StageStatus;
    if (stageIndex === 0) {
      status = completedLessons === totalLessons ? "complete" : "available";
    } else {
      const prevStage = stages[stageIndex - 1];
      const prevAllPassed = prevStage.lessons.every((l) =>
        passedLessonIds.has(l.id)
      );
      if (!prevAllPassed) {
        status = "locked";
      } else {
        status = completedLessons === totalLessons ? "complete" : "available";
      }
    }

    const lessonsWithUnlock = stage.lessons.map((lesson, lessonIndex) => {
      let unlocked = false;
      if (status === "locked") {
        unlocked = false;
      } else if (lessonIndex === 0) {
        unlocked = true;
      } else {
        const prevLesson = stage.lessons[lessonIndex - 1];
        unlocked = passedLessonIds.has(prevLesson.id);
      }
      return {
        ...lesson,
        exerciseConfig: lesson.exerciseConfig as any,
        exerciseType: lesson.exerciseType as any,
        unlocked,
        passed: passedLessonIds.has(lesson.id),
      };
    });

    return {
      ...stage,
      lessons: lessonsWithUnlock,
      status,
      completedLessons,
    };
  });
}

export async function getStageBySlug(slug: string) {
  return prisma.stage.findUnique({
    where: { slug },
    include: { lessons: { orderBy: { order: "asc" } } },
  });
}
