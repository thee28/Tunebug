import { prisma } from "@/lib/prisma";
import type { Stage, Unit, StageStatus } from "@/types/lesson";

export async function getStagesWithProgress(userId: string): Promise<Stage[]> {
  const [stages, passedProgress] = await Promise.all([
    prisma.stage.findMany({
      include: {
        units: {
          orderBy: { order: "asc" },
          include: { lessons: { orderBy: { order: "asc" } } },
        },
      },
      orderBy: { order: "asc" },
    }),
    prisma.lessonProgress.findMany({
      where: { userId, passed: true },
      select: { lessonId: true },
    }),
  ]);

  const passedIds = new Set(passedProgress.map((p) => p.lessonId));

  return stages.map((stage, stageIndex) => {
    const allLessons = stage.units.flatMap((u) => u.lessons);
    const totalLessons = allLessons.length;
    const completedLessons = allLessons.filter((l) => passedIds.has(l.id)).length;

    let stageStatus: StageStatus;
    if (stageIndex === 0) {
      stageStatus = completedLessons === totalLessons ? "complete" : "available";
    } else {
      const prevStageAllLessons = stages[stageIndex - 1].units.flatMap((u) => u.lessons);
      const prevComplete = prevStageAllLessons.every((l) => passedIds.has(l.id));
      stageStatus = !prevComplete ? "locked" : completedLessons === totalLessons ? "complete" : "available";
    }

    const units: Unit[] = stage.units.map((unit, unitIndex) => {
      const unitPassed = unit.lessons.filter((l) => passedIds.has(l.id)).length;
      const unitTotal = unit.lessons.length;

      let unitStatus: StageStatus;
      if (stageStatus === "locked") {
        unitStatus = "locked";
      } else if (unitIndex === 0) {
        unitStatus = unitPassed === unitTotal ? "complete" : "available";
      } else {
        const prevUnit = stage.units[unitIndex - 1];
        const prevUnitComplete = prevUnit.lessons.every((l) => passedIds.has(l.id));
        unitStatus = !prevUnitComplete ? "locked" : unitPassed === unitTotal ? "complete" : "available";
      }

      const lessons = unit.lessons.map((lesson, lessonIndex) => {
        let unlocked = false;
        if (unitStatus === "locked") {
          unlocked = false;
        } else if (lessonIndex === 0) {
          unlocked = true;
        } else {
          unlocked = passedIds.has(unit.lessons[lessonIndex - 1].id);
        }
        return {
          ...lesson,
          exerciseConfig: lesson.exerciseConfig as never,
          exerciseType: lesson.exerciseType as never,
          unlocked,
          passed: passedIds.has(lesson.id),
        };
      });

      return {
        ...unit,
        lessons,
        completedLessons: unitPassed,
        totalLessons: unitTotal,
        status: unitStatus,
      };
    });

    return {
      ...stage,
      units,
      status: stageStatus,
      completedLessons,
      totalLessons,
    };
  });
}

/**
 * Server-side lock check for a single lesson. Reuses the exact unlock rules
 * getStagesWithProgress computes for display, so API enforcement can never
 * drift from what the UI shows. Unknown lesson ids report as locked.
 */
export async function isLessonUnlocked(userId: string, lessonId: string): Promise<boolean> {
  const stages = await getStagesWithProgress(userId);
  for (const stage of stages) {
    for (const unit of stage.units) {
      const lesson = unit.lessons.find((l) => l.id === lessonId);
      if (lesson) return lesson.unlocked ?? false;
    }
  }
  return false;
}

export async function getStageBySlug(slug: string) {
  return prisma.stage.findUnique({
    where: { slug },
    include: {
      units: {
        orderBy: { order: "asc" },
        include: { lessons: { orderBy: { order: "asc" } } },
      },
    },
  });
}
