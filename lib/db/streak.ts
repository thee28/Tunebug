import { prisma } from "@/lib/prisma";
import { differenceInCalendarDays } from "date-fns";
import { dayMarkerInTZ, startOfDayUTC } from "@/lib/utils";

export async function getStreak(userId: string) {
  return prisma.dailyStreak.findUnique({ where: { userId } });
}

export async function updateStreak(userId: string): Promise<void> {
  // Day boundaries live in the USER's timezone (captured at onboarding,
  // default UTC): lessons at 11:58 PM and 12:02 AM local are consecutive
  // days regardless of where the UTC boundary falls.
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { timezone: true },
  });
  const today = dayMarkerInTZ(new Date(), user?.timezone ?? "UTC");

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
