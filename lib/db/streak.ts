import { prisma } from "@/lib/prisma";
import { differenceInCalendarDays } from "date-fns";
import { startOfDayUTC } from "@/lib/utils";

export async function getStreak(userId: string) {
  return prisma.dailyStreak.findUnique({ where: { userId } });
}

export async function updateStreak(userId: string): Promise<void> {
  const today = startOfDayUTC(new Date());

  const streak = await prisma.dailyStreak.upsert({
    where: { userId },
    create: {
      userId,
      currentStreak: 1,
      longestStreak: 1,
      lastActivityDate: today,
    },
    update: {},
  });

  if (!streak.lastActivityDate) {
    await prisma.dailyStreak.update({
      where: { userId },
      data: { currentStreak: 1, longestStreak: 1, lastActivityDate: today },
    });
    return;
  }

  const last = startOfDayUTC(streak.lastActivityDate);
  const diff = differenceInCalendarDays(today, last);

  // diff < 0 guards against clock skew / out-of-order writes — never reset
  // an active streak because "today" appears earlier than the last activity.
  if (diff <= 0) return;

  if (diff === 1) {
    const next = streak.currentStreak + 1;
    await prisma.dailyStreak.update({
      where: { userId },
      data: {
        currentStreak: next,
        longestStreak: Math.max(next, streak.longestStreak),
        lastActivityDate: today,
      },
    });
  } else {
    await prisma.dailyStreak.update({
      where: { userId },
      data: { currentStreak: 1, lastActivityDate: today },
    });
  }
}
