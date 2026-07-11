import { prisma } from "@/lib/prisma";
import { HEARTS_MAX, HEART_REFILL_MS, type HeartsState } from "@/lib/hearts";

// Refill is computed lazily on read: heartsUpdatedAt anchors the clock, and
// each elapsed 3h window adds one heart. Once full the anchor stops mattering
// until the next loss resets it.
function applyRefill(hearts: number, updatedAt: Date, now: Date) {
  if (hearts >= HEARTS_MAX) return { hearts: HEARTS_MAX, updatedAt };
  const gained = Math.floor((now.getTime() - updatedAt.getTime()) / HEART_REFILL_MS);
  if (gained <= 0) return { hearts, updatedAt };
  const next = Math.min(HEARTS_MAX, hearts + gained);
  return {
    hearts: next,
    // Preserve the partial progress toward the next heart unless we hit max.
    updatedAt: next >= HEARTS_MAX
      ? now
      : new Date(updatedAt.getTime() + gained * HEART_REFILL_MS),
  };
}

function toState(hearts: number, updatedAt: Date): HeartsState {
  return {
    hearts,
    nextRefillAt: hearts >= HEARTS_MAX
      ? null
      : new Date(updatedAt.getTime() + HEART_REFILL_MS).toISOString(),
    max: HEARTS_MAX,
  };
}

export async function getHearts(userId: string): Promise<HeartsState> {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { hearts: true, heartsUpdatedAt: true },
  });
  const now = new Date();
  const refilled = applyRefill(user.hearts, user.heartsUpdatedAt, now);
  if (refilled.hearts !== user.hearts) {
    await prisma.user.update({
      where: { id: userId },
      data: { hearts: refilled.hearts, heartsUpdatedAt: refilled.updatedAt },
    });
  }
  return toState(refilled.hearts, refilled.updatedAt);
}

export async function loseHeart(userId: string): Promise<HeartsState> {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { hearts: true, heartsUpdatedAt: true },
  });
  const now = new Date();
  const refilled = applyRefill(user.hearts, user.heartsUpdatedAt, now);

  const hearts = Math.max(0, refilled.hearts - 1);
  // Losing a heart from full starts the refill clock; otherwise the clock
  // keeps its partial progress toward the next heart.
  const updatedAt = refilled.hearts >= HEARTS_MAX ? now : refilled.updatedAt;

  await prisma.user.update({
    where: { id: userId },
    data: { hearts, heartsUpdatedAt: updatedAt },
  });
  return toState(hearts, updatedAt);
}
