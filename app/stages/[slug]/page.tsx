import { redirect, notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { getStageBySlug } from "@/lib/db/stages";
import { prisma } from "@/lib/prisma";
import { StageRunner } from "@/components/exercises/StageRunner";
import { CURRICULUM } from "@/lib/curriculum/config";
import type { Difficulty } from "@/lib/curriculum/content";

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
    lessons: stage.lessons.map((lesson, i) => {
      const prevLesson = stage.lessons[i - 1];
      const unlocked = i === 0 || (prevLesson ? passedIds.has(prevLesson.id) : false);
      return {
        ...lesson,
        exerciseConfig: lesson.exerciseConfig as never,
        exerciseType: lesson.exerciseType as never,
        unlocked,
        passed: passedIds.has(lesson.id),
      };
    }),
    status: undefined,
    completedLessons: stage.lessons.filter((l) => passedIds.has(l.id)).length,
  };

  const curriculumStage = CURRICULUM.find((s) => s.slug === slug);
  const difficulty: Difficulty = curriculumStage?.difficulty ?? "beginner";

  return <StageRunner stage={stageWithProgress} difficulty={difficulty} />;
}
