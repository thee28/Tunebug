export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CURRICULUM } from "@/lib/curriculum/config";
import OnboardingFlow from "@/components/onboarding/OnboardingFlow";

export default async function OnboardingPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, onboardedAt: true },
  });

  // Already placed — don't let them redo the survey.
  if (user?.onboardedAt) redirect("/dashboard");

  const firstName = (user?.name ?? session.user.name ?? "").split(" ")[0] || "there";
  const sectionTitles = CURRICULUM.map((s) => s.title);

  return <OnboardingFlow firstName={firstName} sectionTitles={sectionTitles} />;
}
