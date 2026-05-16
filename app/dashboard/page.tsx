import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getStagesWithProgress } from "@/lib/db/stages";
import { getStreak } from "@/lib/db/streak";
import StagePath from "@/components/dashboard/StagePath";
import StreakBadge from "@/components/dashboard/StreakBadge";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [stages, streak] = await Promise.all([
    getStagesWithProgress(session.user.id),
    getStreak(session.user.id),
  ]);

  const userWithXP = await import("@/lib/prisma").then(({ prisma }) =>
    prisma.user.findUnique({ where: { id: session.user.id }, select: { xp: true } })
  );
  const totalXP = userWithXP?.xp ?? 0;

  return (
    <div className="min-h-screen bg-[#EEF2FF]">
      {/* Top bar */}
      <header className="sticky top-0 z-20 bg-white border-b-2 border-[#C7D2FE] px-6 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-[#4F46E5]" style={{ fontFamily: "'Baloo 2', sans-serif" }}>
            🐛 TuneBug
          </Link>
          <div className="flex items-center gap-3">
            <StreakBadge streak={streak ? { currentStreak: streak.currentStreak, longestStreak: streak.longestStreak, lastActivityDate: streak.lastActivityDate } : null} />
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-[#EEF2FF] font-bold text-[#4F46E5]"
              style={{ border: "2px solid #C7D2FE", fontFamily: "'Baloo 2', sans-serif" }}
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-[#F59E0B]">
                <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.006Z" clipRule="evenodd" />
              </svg>
              {totalXP} XP
            </div>
            <Link
              href="/practice"
              className="px-4 py-1.5 rounded-2xl font-bold text-white bg-[#22C55E] cursor-pointer hover:bg-[#16A34A] transition-colors text-sm"
              style={{ boxShadow: "0 3px 0 0 #16A34A", border: "2px solid #16A34A", fontFamily: "'Baloo 2', sans-serif" }}
            >
              Free Practice
            </Link>
          </div>
        </div>
      </header>

      {/* Stage path */}
      <main className="max-w-2xl mx-auto">
        <div className="px-6 pt-8 pb-2 text-center">
          <h1 className="text-3xl font-extrabold text-[#312E81]" style={{ fontFamily: "'Baloo 2', sans-serif" }}>
            Your Learning Path
          </h1>
          <p className="text-[#6366F1] font-semibold mt-1">
            Complete each stage to unlock the next one
          </p>
        </div>

        <StagePath stages={stages} />
      </main>
    </div>
  );
}
