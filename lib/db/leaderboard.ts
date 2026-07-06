import { prisma } from "@/lib/prisma";
import { weekStartUTC } from "@/lib/utils";

export interface LeaderboardEntry {
  userId: string;
  name: string;
  initials: string;
  xp: number;
  isUser: boolean;
  rank: number;
}

export interface LeaderboardData {
  entries: LeaderboardEntry[];
  // The viewer's own weekly XP even when they aren't on the board yet.
  userWeeklyXP: number;
  userIsPublic: boolean;
  weekStart: string; // ISO string
}

const BOARD_SIZE = 50;

/**
 * Weekly XP leaderboard: lesson XP + daily-stage XP + quest bonuses earned
 * since Monday UTC. Only users with a public profile appear to others; the
 * viewer always sees their own row.
 */
export async function getWeeklyLeaderboard(currentUserId: string): Promise<LeaderboardData> {
  const since = weekStartUTC();

  const [lessonXP, dailyXP, questXP, viewer] = await Promise.all([
    prisma.lessonProgress.groupBy({
      by: ["userId"],
      where: { completedAt: { gte: since } },
      _sum: { xpEarned: true },
    }),
    prisma.dailyStage.groupBy({
      by: ["userId"],
      where: { date: { gte: since }, completed: true },
      _sum: { xpEarned: true },
    }),
    prisma.questClaim.groupBy({
      by: ["userId"],
      where: { date: { gte: since } },
      _sum: { xpAwarded: true },
    }),
    prisma.user.findUnique({
      where: { id: currentUserId },
      select: { publicProfile: true },
    }),
  ]);

  const totals = new Map<string, number>();
  for (const row of lessonXP) totals.set(row.userId, (totals.get(row.userId) ?? 0) + (row._sum.xpEarned ?? 0));
  for (const row of dailyXP) totals.set(row.userId, (totals.get(row.userId) ?? 0) + (row._sum.xpEarned ?? 0));
  for (const row of questXP) totals.set(row.userId, (totals.get(row.userId) ?? 0) + (row._sum.xpAwarded ?? 0));

  const active = [...totals.entries()].filter(([, xp]) => xp > 0);
  const users = active.length
    ? await prisma.user.findMany({
        where: { id: { in: active.map(([id]) => id) } },
        select: { id: true, name: true, email: true, publicProfile: true },
      })
    : [];
  const userById = new Map(users.map((u) => [u.id, u]));

  const visible = active.filter(([id]) => {
    const u = userById.get(id);
    if (!u) return false;
    return u.publicProfile || id === currentUserId;
  });

  const entries = visible
    .sort((a, b) => b[1] - a[1])
    .slice(0, BOARD_SIZE)
    .map(([id, xp], i) => {
      const u = userById.get(id)!;
      const name = u.name ?? u.email?.split("@")[0] ?? "Musician";
      const initials = name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();
      return { userId: id, name, initials, xp, isUser: id === currentUserId, rank: i + 1 };
    });

  return {
    entries,
    userWeeklyXP: totals.get(currentUserId) ?? 0,
    userIsPublic: viewer?.publicProfile ?? true,
    weekStart: since.toISOString(),
  };
}
