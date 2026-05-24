import { redirect, notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { getStageBySlug } from "@/lib/db/stages";
import { prisma } from "@/lib/prisma";
import { StageRunner } from "@/components/exercises/StageRunner";
import { CURRICULUM } from "@/lib/curriculum/config";
import type { Difficulty } from "@/lib/curriculum/content";
import type { StageStatus } from "@/types/lesson";

export default async function StagePage(props: PageProps<"/stages/[slug]">) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { slug } = await props.params;

  const [stage, passedRows] = await Promise.all([
    getStageBySlug(slug),
    prisma.lessonProgress.findMany({
      where: { userId: session.user.id, passed: true },
      select: { lessonId: true },
    }),
  ]);

  if (!stage) notFound();

  const passedIds = new Set(passedRows.map((r) => r.lessonId));

  const stageWithProgress = {
    ...stage,
    icon: stage.icon ?? "🎵",
    units: stage.units.map((unit, unitIndex) => {
      const prevUnit = stage.units[unitIndex - 1];
      const unitUnlocked = unitIndex === 0 || (prevUnit?.lessons.every((l) => passedIds.has(l.id)) ?? false);
      const unitPassed = unit.lessons.filter((l) => passedIds.has(l.id)).length;

      const lessons = unit.lessons.map((lesson, i) => {
        const prevLesson = unit.lessons[i - 1];
        const unlocked = unitUnlocked && (i === 0 || (prevLesson ? passedIds.has(prevLesson.id) : false));
        return {
          ...lesson,
          exerciseConfig: lesson.exerciseConfig as never,
          exerciseType: lesson.exerciseType as never,
          unlocked,
          passed: passedIds.has(lesson.id),
        };
      });

      const unitStatus: StageStatus = !unitUnlocked
        ? "locked"
        : unitPassed === unit.lessons.length
        ? "complete"
        : "available";

      return {
        ...unit,
        lessons,
        completedLessons: unitPassed,
        totalLessons: unit.lessons.length,
        status: unitStatus,
      };
    }),
    status: undefined,
    completedLessons: stage.units.flatMap((u) => u.lessons).filter((l) => passedIds.has(l.id)).length,
    totalLessons: stage.units.reduce((s, u) => s + u.lessons.length, 0),
  };

  const curriculumStage = CURRICULUM.find((s) => s.slug === slug);
  const difficulty: Difficulty = curriculumStage?.difficulty ?? "beginner";

  return <StageRunner stage={stageWithProgress} difficulty={difficulty} />;
}
