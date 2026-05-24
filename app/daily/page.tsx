import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getTodaysDailyStage } from "@/lib/db/daily";
import { DailyStageClient } from "./DailyStageClient";

export default async function DailyPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const dailyStage = await getTodaysDailyStage(session.user.id);

  return <DailyStageClient stage={dailyStage} />;
}
